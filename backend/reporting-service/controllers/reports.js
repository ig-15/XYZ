
const db = require('../../shared/db');
const { logUserAction } = require('../../shared/utils/logger');

// Get entry/exit logs with filters
exports.getEntryExitLogs = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { 
      startDate, 
      endDate, 
      parkingId, 
      plate, 
      status, // 'entry', 'exit', or 'all'
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query filters
    const filters = [];
    const params = [];
    
    // Date range filter
    if (startDate) {
      filters.push('(e.entry_time >= $' + (params.length + 1) + ' OR e.exit_time >= $' + (params.length + 1) + ')');
      params.push(startDate);
    }
    
    if (endDate) {
      filters.push('(e.entry_time <= $' + (params.length + 1) + ' OR e.exit_time <= $' + (params.length + 1) + ')');
      params.push(endDate);
    }
    
    // Parking filter
    if (parkingId) {
      filters.push('e.parking_id = $' + (params.length + 1));
      params.push(parkingId);
    }
    
    // Car plate filter
    if (plate) {
      filters.push('c.plate_number ILIKE $' + (params.length + 1));
      params.push(`%${plate}%`);
    }
    
    // Entry/Exit status filter
    if (status === 'entry') {
      filters.push('e.exit_time IS NULL');
    } else if (status === 'exit') {
      filters.push('e.exit_time IS NOT NULL');
    }
    
    // Build WHERE clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total records
    const countQuery = `
      SELECT COUNT(*) 
      FROM entries e
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Build main query
    const queryParams = [...params, parseInt(limit), offset];
    const query = `
      SELECT 
        e.id,
        e.entry_time,
        e.exit_time,
        e.charged_amount,
        c.plate_number,
        p.code AS parking_code,
        p.name AS parking_name,
        p.fee_per_hour,
        CASE 
          WHEN e.exit_time IS NULL THEN 'active'
          ELSE 'completed'
        END AS status,
        CASE 
          WHEN e.exit_time IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (e.exit_time - e.entry_time))/3600
          ELSE 
            EXTRACT(EPOCH FROM (NOW() - e.entry_time))/3600
        END AS duration_hours
      FROM entries e
      JOIN cars c ON e.car_id = c.id
      JOIN parkings p ON e.parking_id = p.id
      ${whereClause}
      ORDER BY 
        CASE WHEN e.exit_time IS NULL THEN e.entry_time ELSE e.exit_time END DESC
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}
    `;
    
    const result = await db.query(query, queryParams);
    
    // Format entries
    const logs = result.rows.map(row => ({
      id: row.id,
      entry_time: row.entry_time,
      exit_time: row.exit_time,
      charged_amount: parseFloat(row.charged_amount),
      plate_number: row.plate_number,
      parking_code: row.parking_code,
      parking_name: row.parking_name,
      fee_per_hour: parseFloat(row.fee_per_hour),
      status: row.status,
      duration_hours: parseFloat(row.duration_hours.toFixed(2))
    }));
    
    // Log report generation
    await logUserAction(
      req.user.id,
      'REPORT_GENERATED',
      'Entry/exit logs report generated'
    );
    
    res.status(200).json({
      data: logs,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue report by parking lot
exports.getRevenueByParking = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { startDate, endDate } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    // Build query
    const query = `
      SELECT 
        p.id,
        p.code,
        p.name,
        p.location,
        COUNT(e.id) AS total_entries,
        SUM(e.charged_amount) AS total_revenue,
        AVG(e.charged_amount) AS avg_revenue_per_entry,
        AVG(EXTRACT(EPOCH FROM (e.exit_time - e.entry_time))/3600) AS avg_duration_hours
      FROM parkings p
      LEFT JOIN entries e ON p.id = e.parking_id
      WHERE e.exit_time IS NOT NULL
        AND e.exit_time >= $1
        AND e.exit_time <= $2
      GROUP BY p.id, p.code, p.name, p.location
      ORDER BY total_revenue DESC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    
    // Format results
    const revenues = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      location: row.location,
      total_entries: parseInt(row.total_entries || 0),
      total_revenue: parseFloat(row.total_revenue || 0).toFixed(2),
      avg_revenue: parseFloat(row.avg_revenue_per_entry || 0).toFixed(2),
      avg_duration: parseFloat(row.avg_duration_hours || 0).toFixed(2)
    }));
    
    // Calculate grand total
    const totalRevenue = revenues.reduce(
      (sum, item) => sum + parseFloat(item.total_revenue), 
      0
    ).toFixed(2);
    
    // Log report generation
    await logUserAction(
      req.user.id,
      'REPORT_GENERATED',
      `Revenue report generated for period ${startDate} to ${endDate}`
    );
    
    res.status(200).json({
      startDate,
      endDate,
      totalRevenue,
      parkings: revenues
    });
  } catch (error) {
    next(error);
  }
};

// Get daily revenue report
exports.getDailyRevenue = async (req, res, next) => {
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
    
    const query = `
      SELECT 
        DATE(e.exit_time) AS date,
        COUNT(e.id) AS total_entries,
        SUM(e.charged_amount) AS total_revenue,
        AVG(e.charged_amount) AS avg_revenue,
        COUNT(DISTINCT e.parking_id) AS parking_lots_used
      FROM entries e
      WHERE e.exit_time IS NOT NULL
        AND e.exit_time >= $1
        AND e.exit_time <= $2
        ${parkingFilter}
      GROUP BY DATE(e.exit_time)
      ORDER BY date
    `;
    
    const result = await db.query(query, params);
    
    // Format results
    const revenues = result.rows.map(row => ({
      date: row.date,
      total_entries: parseInt(row.total_entries),
      total_revenue: parseFloat(row.total_revenue).toFixed(2),
      avg_revenue: parseFloat(row.avg_revenue).toFixed(2),
      parking_lots_used: parseInt(row.parking_lots_used)
    }));
    
    // Calculate grand total
    const totalRevenue = revenues.reduce(
      (sum, item) => sum + parseFloat(item.total_revenue), 
      0
    ).toFixed(2);
    
    // Log report generation
    await logUserAction(
      req.user.id,
      'REPORT_GENERATED',
      `Daily revenue report generated for period ${startDate} to ${endDate}`
    );
    
    res.status(200).json({
      startDate,
      endDate,
      totalRevenue,
      parking_id: parkingId || 'all',
      days: revenues
    });
  } catch (error) {
    next(error);
  }
};

// Get parking usage report
exports.getParkingUsage = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { startDate, endDate } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Start date and end date are required'
      });
    }
    
    // Get parking usage data
    const query = `
      SELECT 
        p.id,
        p.code,
        p.name,
        p.location,
        p.total_spaces,
        COUNT(e.id) AS total_entries,
        COUNT(DISTINCT DATE(e.entry_time)) AS days_with_entries,
        COUNT(e.id) / COUNT(DISTINCT DATE(e.entry_time)) AS avg_entries_per_day,
        AVG(EXTRACT(EPOCH FROM (e.exit_time - e.entry_time))/3600) AS avg_stay_duration
      FROM parkings p
      LEFT JOIN entries e ON p.id = e.parking_id
      WHERE e.entry_time >= $1
        AND e.entry_time <= $2
      GROUP BY p.id, p.code, p.name, p.location, p.total_spaces
      ORDER BY total_entries DESC
    `;
    
    const result = await db.query(query, [startDate, endDate]);
    
    // Get the total days in the date range
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    // Format results
    const usageData = result.rows.map(row => {
      const daysWithEntries = parseInt(row.days_with_entries) || 0;
      const totalEntries = parseInt(row.total_entries) || 0;
      
      // Calculate utilization percentage
      // (total entries / (total spaces * total days)) * 100
      const utilizationRate = totalDays > 0 ? 
        (totalEntries / (row.total_spaces * totalDays)) * 100 : 0;
      
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        location: row.location,
        total_spaces: parseInt(row.total_spaces),
        total_entries: totalEntries,
        days_with_entries: daysWithEntries,
        avg_entries_per_day: daysWithEntries > 0 ? 
          parseFloat((totalEntries / daysWithEntries).toFixed(2)) : 0,
        avg_stay_duration: parseFloat(row.avg_stay_duration || 0).toFixed(2),
        utilization_rate: parseFloat(utilizationRate.toFixed(2))
      };
    });
    
    // Log report generation
    await logUserAction(
      req.user.id,
      'REPORT_GENERATED',
      `Parking usage report generated for period ${startDate} to ${endDate}`
    );
    
    res.status(200).json({
      startDate,
      endDate,
      total_days: totalDays,
      parkings: usageData
    });
  } catch (error) {
    next(error);
  }
};

// Get user activity logs
exports.getUserActivityLogs = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { 
      startDate, 
      endDate, 
      userId, 
      action,
      page = 1,
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query filters
    const filters = [];
    const params = [];
    
    // Date range filter
    if (startDate) {
      filters.push('l.timestamp >= $' + (params.length + 1));
      params.push(startDate);
    }
    
    if (endDate) {
      filters.push('l.timestamp <= $' + (params.length + 1));
      params.push(endDate);
    }
    
    // User filter
    if (userId) {
      filters.push('l.user_id = $' + (params.length + 1));
      params.push(userId);
    }
    
    // Action filter
    if (action) {
      filters.push('l.action ILIKE $' + (params.length + 1));
      params.push(`%${action}%`);
    }
    
    // Build WHERE clause
    const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
    
    // Count total records
    const countQuery = `
      SELECT COUNT(*) 
      FROM logs l
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    // Build main query
    const queryParams = [...params, parseInt(limit), offset];
    const query = `
      SELECT 
        l.id,
        l.user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.role,
        l.action,
        l.description,
        l.timestamp
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      ${whereClause}
      ORDER BY l.timestamp DESC
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}
    `;
    
    const result = await db.query(query, queryParams);
    
    // Format logs
    const logs = result.rows.map(row => ({
      id: row.id,
      user: row.user_id ? {
        id: row.user_id,
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email,
        role: row.role
      } : null,
      action: row.action,
      description: row.description,
      timestamp: row.timestamp
    }));
    
    // Log report generation
    await logUserAction(
      req.user.id,
      'REPORT_GENERATED',
      'User activity logs report generated'
    );
    
    res.status(200).json({
      data: logs,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    next(error);
  }
};
