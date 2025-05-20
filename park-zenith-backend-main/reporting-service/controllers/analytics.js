
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');

// Get dashboard summary statistics
exports.getDashboardSummary = async (req, res, next) => {
  try {
    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Total users by role
    const usersQuery = `
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `;
    
    // Total parkings and spaces
    const parkingsQuery = `
      SELECT 
        COUNT(*) as total_parkings,
        SUM(total_spaces) as total_spaces,
        SUM(available_spaces) as available_spaces
      FROM parkings
    `;
    
    // Today's statistics
    const todayStatsQuery = `
      SELECT 
        COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as active_entries,
        COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as completed_entries,
        SUM(CASE WHEN exit_time IS NOT NULL THEN charged_amount ELSE 0 END) as revenue
      FROM entries
      WHERE entry_time >= $1
    `;
    
    // Yesterday's statistics for comparison
    const yesterdayStatsQuery = `
      SELECT 
        COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as completed_entries,
        SUM(CASE WHEN exit_time IS NOT NULL THEN charged_amount ELSE 0 END) as revenue
      FROM entries
      WHERE entry_time >= $1 AND entry_time < $2
    `;
    
    // Last 30 days statistics
    const monthlyStatsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as completed_entries,
        SUM(CASE WHEN exit_time IS NOT NULL THEN charged_amount ELSE 0 END) as revenue
      FROM entries
      WHERE entry_time >= $1
    `;
    
    // Run all queries concurrently
    const [
      usersResult, 
      parkingsResult, 
      todayStatsResult, 
      yesterdayStatsResult,
      monthlyStatsResult
    ] = await Promise.all([
      db.query(usersQuery),
      db.query(parkingsQuery),
      db.query(todayStatsQuery, [today]),
      db.query(yesterdayStatsQuery, [yesterday, today]),
      db.query(monthlyStatsQuery, [thirtyDaysAgo])
    ]);
    
    // Process user stats
    const userStats = {};
    usersResult.rows.forEach(row => {
      userStats[row.role] = parseInt(row.count);
    });
    
    // Calculate occupancy rate
    const totalSpaces = parseInt(parkingsResult.rows[0].total_spaces) || 0;
    const availableSpaces = parseInt(parkingsResult.rows[0].available_spaces) || 0;
    const occupiedSpaces = totalSpaces - availableSpaces;
    const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;
    
    // Format today's statistics
    const todayStats = {
      active_entries: parseInt(todayStatsResult.rows[0].active_entries) || 0,
      completed_entries: parseInt(todayStatsResult.rows[0].completed_entries) || 0,
      revenue: parseFloat(todayStatsResult.rows[0].revenue || 0).toFixed(2)
    };
    
    // Format yesterday's statistics
    const yesterdayStats = {
      completed_entries: parseInt(yesterdayStatsResult.rows[0].completed_entries) || 0,
      revenue: parseFloat(yesterdayStatsResult.rows[0].revenue || 0).toFixed(2)
    };
    
    // Calculate day-over-day changes
    const entryChange = yesterdayStats.completed_entries > 0 ? 
      ((todayStats.completed_entries - yesterdayStats.completed_entries) / yesterdayStats.completed_entries) * 100 : 0;
      
    const revenueChange = parseFloat(yesterdayStats.revenue) > 0 ? 
      ((parseFloat(todayStats.revenue) - parseFloat(yesterdayStats.revenue)) / parseFloat(yesterdayStats.revenue)) * 100 : 0;
    
    // Format monthly statistics
    const monthlyStats = {
      total_entries: parseInt(monthlyStatsResult.rows[0].total_entries) || 0,
      completed_entries: parseInt(monthlyStatsResult.rows[0].completed_entries) || 0,
      revenue: parseFloat(monthlyStatsResult.rows[0].revenue || 0).toFixed(2)
    };
    
    // Build response
    const summary = {
      users: {
        total: Object.values(userStats).reduce((sum, count) => sum + count, 0),
        by_role: userStats
      },
      parkings: {
        total_parkings: parseInt(parkingsResult.rows[0].total_parkings) || 0,
        total_spaces: totalSpaces,
        available_spaces: availableSpaces,
        occupied_spaces: occupiedSpaces,
        occupancy_rate: parseFloat(occupancyRate.toFixed(2))
      },
      today: todayStats,
      yesterday: yesterdayStats,
      comparison: {
        entry_change_percent: parseFloat(entryChange.toFixed(2)),
        revenue_change_percent: parseFloat(revenueChange.toFixed(2))
      },
      last_30_days: monthlyStats
    };
    
    // Log analytics access
    await logUserAction(
      req.user.id,
      'ANALYTICS_ACCESSED',
      'Dashboard summary analytics accessed'
    );
    
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

// Get hourly occupancy statistics
exports.getHourlyOccupancy = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { date, parkingId } = req.query;
    
    // Validate required parameters
    if (!date) {
      return res.status(400).json({
        message: 'Date parameter is required'
      });
    }
    
    // Build query with optional parking filter
    let params = [date];
    let parkingFilter = '';
    
    if (parkingId) {
      parkingFilter = 'AND e.parking_id = $2';
      params.push(parkingId);
    }
    
    // Query for entries by hour
    const query = `
      WITH hours AS (
        SELECT generate_series(0, 23) AS hour
      ),
      entry_counts AS (
        SELECT 
          EXTRACT(HOUR FROM e.entry_time) AS hour,
          COUNT(*) AS entries
        FROM entries e
        WHERE DATE(e.entry_time) = DATE($1)
          ${parkingFilter}
        GROUP BY EXTRACT(HOUR FROM e.entry_time)
      ),
      exit_counts AS (
        SELECT 
          EXTRACT(HOUR FROM e.exit_time) AS hour,
          COUNT(*) AS exits
        FROM entries e
        WHERE DATE(e.exit_time) = DATE($1)
          ${parkingFilter}
        GROUP BY EXTRACT(HOUR FROM e.exit_time)
      )
      SELECT 
        h.hour,
        COALESCE(ec.entries, 0) AS entries,
        COALESCE(exc.exits, 0) AS exits
      FROM hours h
      LEFT JOIN entry_counts ec ON h.hour = ec.hour
      LEFT JOIN exit_counts exc ON h.hour = exc.hour
      ORDER BY h.hour
    `;
    
    const result = await db.query(query, params);
    
    // Calculate running occupancy
    let currentOccupancy = 0;
    const occupancyData = result.rows.map(row => {
      const hourlyEntries = parseInt(row.entries);
      const hourlyExits = parseInt(row.exits);
      
      currentOccupancy += (hourlyEntries - hourlyExits);
      
      return {
        hour: parseInt(row.hour),
        entries: hourlyEntries,
        exits: hourlyExits,
        occupancy: Math.max(0, currentOccupancy) // Ensure we don't have negative occupancy
      };
    });
    
    // Log analytics access
    await logUserAction(
      req.user.id,
      'ANALYTICS_ACCESSED',
      `Hourly occupancy analytics accessed for date ${date}`
    );
    
    res.status(200).json({
      date,
      parking_id: parkingId || 'all',
      hourly_data: occupancyData
    });
  } catch (error) {
    next(error);
  }
};

// Get peak hours analysis
exports.getPeakHoursAnalysis = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { startDate, endDate, parkingId } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    // Build query with optional parking filter
    let params = [startDate, endDate];
    let parkingFilter = '';
    
    if (parkingId) {
      parkingFilter = 'AND e.parking_id = $3';
      params.push(parkingId);
    }
    
    // Query for peak entry and exit hours
    const query = `
      WITH entry_counts AS (
        SELECT 
          EXTRACT(HOUR FROM entry_time) AS hour,
          COUNT(*) AS count
        FROM entries e
        WHERE entry_time >= $1
          AND entry_time <= $2
          ${parkingFilter}
        GROUP BY EXTRACT(HOUR FROM entry_time)
      ),
      exit_counts AS (
        SELECT 
          EXTRACT(HOUR FROM exit_time) AS hour,
          COUNT(*) AS count
        FROM entries e
        WHERE exit_time >= $1
          AND exit_time <= $2
          ${parkingFilter}
        GROUP BY EXTRACT(HOUR FROM exit_time)
      ),
      day_of_week_counts AS (
        SELECT 
          EXTRACT(DOW FROM entry_time) AS day_of_week,
          COUNT(*) AS count
        FROM entries e
        WHERE entry_time >= $1
          AND entry_time <= $2
          ${parkingFilter}
        GROUP BY EXTRACT(DOW FROM entry_time)
      )
      SELECT
        (SELECT array_agg(json_build_object('hour', hour, 'count', count))
         FROM entry_counts
         ORDER BY count DESC
         LIMIT 5) AS peak_entry_hours,
        (SELECT array_agg(json_build_object('hour', hour, 'count', count))
         FROM exit_counts
         ORDER BY count DESC
         LIMIT 5) AS peak_exit_hours,
        (SELECT array_agg(json_build_object('day_of_week', day_of_week, 'count', count))
         FROM day_of_week_counts
         ORDER BY count DESC) AS busiest_days
    `;
    
    const result = await db.query(query, params);
    
    // Format the data
    const data = result.rows[0];
    
    // Map day of week number to name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const busiestDays = data.busiest_days ? data.busiest_days.map(day => ({
      day_of_week: parseInt(day.day_of_week),
      day_name: dayNames[parseInt(day.day_of_week)],
      count: parseInt(day.count)
    })) : [];
    
    // Format peak hours
    const peakEntryHours = data.peak_entry_hours ? data.peak_entry_hours.map(entry => ({
      hour: parseInt(entry.hour),
      formatted_hour: `${parseInt(entry.hour)}:00 - ${parseInt(entry.hour) + 1}:00`,
      count: parseInt(entry.count)
    })) : [];
    
    const peakExitHours = data.peak_exit_hours ? data.peak_exit_hours.map(exit => ({
      hour: parseInt(exit.hour),
      formatted_hour: `${parseInt(exit.hour)}:00 - ${parseInt(exit.hour) + 1}:00`,
      count: parseInt(exit.count)
    })) : [];
    
    // Log analytics access
    await logUserAction(
      req.user.id,
      'ANALYTICS_ACCESSED',
      'Peak hours analytics accessed'
    );
    
    res.status(200).json({
      startDate,
      endDate,
      parking_id: parkingId || 'all',
      peak_entry_hours: peakEntryHours,
      peak_exit_hours: peakExitHours,
      busiest_days: busiestDays
    });
  } catch (error) {
    next(error);
  }
};

// Get duration and revenue analysis
exports.getDurationRevenueAnalysis = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { startDate, endDate, parkingId } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    // Build query with optional parking filter
    let params = [startDate, endDate];
    let parkingFilter = '';
    
    if (parkingId) {
      parkingFilter = 'AND e.parking_id = $3';
      params.push(parkingId);
    }
    
    // Query for duration categories
    const query = `
      WITH duration_categories AS (
        SELECT
          CASE
            WHEN EXTRACT(EPOCH FROM (exit_time - entry_time))/3600 <= 1 THEN '0-1 hour'
            WHEN EXTRACT(EPOCH FROM (exit_time - entry_time))/3600 <= 3 THEN '1-3 hours'
            WHEN EXTRACT(EPOCH FROM (exit_time - entry_time))/3600 <= 6 THEN '3-6 hours'
            WHEN EXTRACT(EPOCH FROM (exit_time - entry_time))/3600 <= 12 THEN '6-12 hours'
            ELSE 'Over 12 hours'
          END AS duration_category,
          COUNT(*) AS count,
          SUM(charged_amount) AS total_revenue,
          AVG(charged_amount) AS avg_revenue
        FROM entries e
        WHERE exit_time IS NOT NULL
          AND exit_time >= $1
          AND exit_time <= $2
          ${parkingFilter}
        GROUP BY duration_category
      )
      SELECT * FROM duration_categories
      ORDER BY CASE
        WHEN duration_category = '0-1 hour' THEN 1
        WHEN duration_category = '1-3 hours' THEN 2
        WHEN duration_category = '3-6 hours' THEN 3
        WHEN duration_category = '6-12 hours' THEN 4
        WHEN duration_category = 'Over 12 hours' THEN 5
      END
    `;
    
    const result = await db.query(query, params);
    
    // Format the data
    const durationData = result.rows.map(row => ({
      duration_category: row.duration_category,
      count: parseInt(row.count),
      total_revenue: parseFloat(row.total_revenue).toFixed(2),
      avg_revenue: parseFloat(row.avg_revenue).toFixed(2)
    }));
    
    // Calculate overall stats
    const totalCount = durationData.reduce((sum, item) => sum + item.count, 0);
    const totalRevenue = durationData.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
    
    // Calculate percentages
    const durationDataWithPercent = durationData.map(item => ({
      ...item,
      percentage: totalCount > 0 ? parseFloat(((item.count / totalCount) * 100).toFixed(2)) : 0
    }));
    
    // Log analytics access
    await logUserAction(
      req.user.id,
      'ANALYTICS_ACCESSED',
      'Duration and revenue analytics accessed'
    );
    
    res.status(200).json({
      startDate,
      endDate,
      parking_id: parkingId || 'all',
      total_entries: totalCount,
      total_revenue: totalRevenue.toFixed(2),
      duration_analysis: durationDataWithPercent
    });
  } catch (error) {
    next(error);
  }
};
