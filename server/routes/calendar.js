const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get calendar events for a specific date range
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, event_id } = req.query;

    let whereClause = 'WHERE 1=1';
    let whereParams = [];

    if (start_date && end_date) {
      whereClause += ' AND (start_time BETWEEN ? AND ? OR end_time BETWEEN ? AND ?)';
      whereParams.push(start_date, end_date, start_date, end_date);
    }
    if (event_id) {
      whereClause += ' AND event_id = ?';
      whereParams.push(event_id);
    }

    const calendarEvents = await getAll(
      `SELECT c.*, e.title as event_title, e.event_type
       FROM calendar c
       JOIN events e ON c.event_id = e.id
       ${whereClause}
       ORDER BY c.start_time`,
      whereParams
    );

    res.json({ calendarEvents });

  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Error fetching calendar events' });
  }
});

// Create calendar event
router.post('/', authenticateToken, [
  body('event_id').isInt().withMessage('Event ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('start_time').isISO8601().withMessage('Start time must be a valid date'),
  body('end_time').isISO8601().withMessage('End time must be a valid date'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_id, title, description, start_time, end_time, color, is_all_day } = req.body;

    // Validate dates
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check if user has access to the event
    const event = await getRow(
      'SELECT * FROM events WHERE id = ? AND (customer_id = ? OR manager_id = ?)',
      [event_id, req.user.id, req.user.id]
    );

    if (!event) {
      return res.status(403).json({ error: 'Access denied to this event' });
    }

    const result = await runQuery(
      `INSERT INTO calendar (event_id, title, description, start_time, end_time, color, is_all_day)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_id, title, description, start_time, end_time, color || '#3788d8', is_all_day || false]
    );

    const newCalendarEvent = await getRow(
      'SELECT * FROM calendar WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Calendar event created successfully',
      calendarEvent: newCalendarEvent
    });

  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Error creating calendar event' });
  }
});

// Update calendar event
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('start_time').optional().isISO8601().withMessage('Start time must be a valid date'),
  body('end_time').optional().isISO8601().withMessage('End time must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if calendar event exists and user has access
    const calendarEvent = await getRow(
      `SELECT c.* FROM calendar c
       JOIN events e ON c.event_id = e.id
       WHERE c.id = ? AND (e.customer_id = ? OR e.manager_id = ?)`,
      [id, req.user.id, req.user.id]
    );

    if (!calendarEvent) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    // Validate dates if both are provided
    if (updateData.start_time && updateData.end_time) {
      if (new Date(updateData.start_time) >= new Date(updateData.end_time)) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await runQuery(
      `UPDATE calendar SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedCalendarEvent = await getRow('SELECT * FROM calendar WHERE id = ?', [id]);

    res.json({
      message: 'Calendar event updated successfully',
      calendarEvent: updatedCalendarEvent
    });

  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Error updating calendar event' });
  }
});

// Delete calendar event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if calendar event exists and user has access
    const calendarEvent = await getRow(
      `SELECT c.* FROM calendar c
       JOIN events e ON c.event_id = e.id
       WHERE c.id = ? AND (e.customer_id = ? OR e.manager_id = ?)`,
      [id, req.user.id, req.user.id]
    );

    if (!calendarEvent) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    await runQuery('DELETE FROM calendar WHERE id = ?', [id]);

    res.json({ message: 'Calendar event deleted successfully' });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ error: 'Error deleting calendar event' });
  }
});

module.exports = router;

