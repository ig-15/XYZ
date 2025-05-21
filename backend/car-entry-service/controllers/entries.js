const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../../shared/middleware/auth');
const db = require('../../shared/db');

const entriesController = {
  getAllEntries: async (req, res, next) => {
    try {
      let {
        page = 1,
        limit = 10,
        plate,
        parkingId,
        status,
        startDate,
        endDate
      } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      let query = `
        SELECT *, COUNT(*) OVER() AS total_count
        FROM entries
        WHERE 1=1
      `;
      const params = [];

      if (plate) {
        params.push(`%${plate}%`);
        query += ` AND plate_number ILIKE $${params.length}`;
      }

      if (parkingId) {
        params.push(parkingId);
        query += ` AND parking_id = $${params.length}`;
      }

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      if (startDate) {
        params.push(startDate);
        query += ` AND entry_time >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        query += ` AND entry_time <= $${params.length}`;
      }

      params.push(limit, offset);
      query += ` ORDER BY entry_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await db.query(query, params);

      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total: totalCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getActiveEntries: async (req, res, next) => {
    try {
      let { page = 1, limit = 10, parkingId } = req.query;

      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;

      let query = `
        SELECT *, COUNT(*) OVER() AS total_count
        FROM entries
        WHERE status = $1
      `;
      const params = ['active'];

      if (parkingId) {
        params.push(parkingId);
        query += ` AND parking_id = $${params.length}`;
      }

      params.push(limit, offset);
      query += ` ORDER BY entry_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await db.query(query, params);
      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total: totalCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getEntryById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM entries WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Entry not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  },

  registerEntry: async (req, res, next) => {
    try {
      const { car_id, parking_id } = req.body;

      const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [car_id]);
      if (carResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }

      const parkingResult = await db.query(
        'SELECT * FROM parkings WHERE id = $1 AND available_spaces > 0',
        [parking_id]
      );

      if (parkingResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Parking not found or no available spaces'
        });
      }

      const activeEntryResult = await db.query(
        'SELECT * FROM entries WHERE car_id = $1 AND status = $2',
        [car_id, 'active']
      );

      if (activeEntryResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Car already has an active entry'
        });
      }

      const entryResult = await db.query(
        `INSERT INTO entries (car_id, parking_id, entry_time, status)
         VALUES ($1, $2, NOW(), $3)
         RETURNING *`,
        [car_id, parking_id, 'active']
      );

      await db.query(
        'UPDATE parkings SET available_spaces = available_spaces - 1 WHERE id = $1',
        [parking_id]
      );

      res.status(201).json({ success: true, data: entryResult.rows[0] });
    } catch (error) {
      next(error);
    }
  },

  registerExit: async (req, res, next) => {
    try {
      const { id } = req.params;

      const entryResult = await db.query(
        'SELECT * FROM entries WHERE id = $1 AND status = $2',
        [id, 'active']
      );

      if (entryResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Active entry not found'
        });
      }

      const entry = entryResult.rows[0];
      const exitTime = new Date();
      const entryTime = new Date(entry.entry_time);
      const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);
      const fee = Math.ceil(durationHours * 5); // $5 per hour

      const updateResult = await db.query(
        `UPDATE entries
         SET exit_time = $1, status = $2, fee = $3
         WHERE id = $4
         RETURNING *`,
        [exitTime, 'completed', fee, id]
      );

      await db.query(
        'UPDATE parkings SET available_spaces = available_spaces + 1 WHERE id = $1',
        [entry.parking_id]
      );

      res.json({ success: true, data: updateResult.rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = entriesController;
