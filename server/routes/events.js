const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireRole, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all events (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, event_type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // Role-based filtering
    if (req.user.profile_type === 'customer') {
      whereClause += ' AND customer_id = ?';
      params.push(req.user.id);
    }
    
    // Additional filters
    if (status && status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (event_type && event_type !== 'all') {
      whereClause += ' AND event_type = ?';
      params.push(event_type);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM events ${whereClause}`;
    const countResult = await getRow(countSql, params);
    const total = countResult.total;
    
    // Get events with pagination
    const eventsSql = `
      SELECT e.*, 
             u.first_name as customer_first_name, 
             u.last_name as customer_last_name,
             m.first_name as manager_first_name, 
             m.last_name as manager_last_name
      FROM events e
      LEFT JOIN users u ON e.customer_id = u.id
      LEFT JOIN users m ON e.manager_id = m.id
      ${whereClause}
      ORDER BY e.start_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const events = await getAll(eventsSql, [...params, limit, offset]);
    
    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventSql = `
      SELECT e.*, 
             u.first_name as customer_first_name, 
             u.last_name as customer_last_name,
             m.first_name as manager_first_name, 
             m.last_name as manager_last_name
      FROM events e
      LEFT JOIN users u ON e.customer_id = u.id
      LEFT JOIN users m ON e.manager_id = m.id
      WHERE e.id = ?
    `;
    
    const event = await getRow(eventSql, [id]);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check access permissions
    if (req.user.profile_type === 'customer' && event.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Managers can view all events
    
    res.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (customers only)
router.post('/', [
  authenticateToken,
  requireRole(['customer']),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('event_type').isIn(['wedding', 'birthday', 'corporate', 'other']).withMessage('Invalid event type'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('start_date').custom((value, { req }) => {
    if (new Date(value) <= new Date()) {
      throw new Error('Start date must be in the future');
    }
    return true;
  }),
  body('end_date').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.start_date)) {
      throw new Error('End date must be after start date');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      location,
      address,
      max_guests,
      budget,
      theme,
      notes
    } = req.body;
    
    const eventId = uuidv4();
    
    const insertSql = `
      INSERT INTO events (
        id, title, description, event_type, start_date, end_date,
        location, address, max_guests, budget, theme, notes,
        customer_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await runQuery(insertSql, [
      eventId, title, description, event_type, start_date, end_date,
      location, address, max_guests, budget, theme, notes, req.user.id
    ]);
    
    // Get the created event
    const event = await getRow('SELECT * FROM events WHERE id = ?', [eventId]);
    
    res.status(201).json({ 
      message: 'Event created successfully',
      event 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', [
  authenticateToken,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('event_type').isIn(['wedding', 'birthday', 'corporate', 'other']).withMessage('Invalid event type'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    // Check if event exists and user has access
    const event = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.profile_type === 'customer' && event.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile_type === 'manager' && event.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      title,
      description,
      event_type,
      start_date,
      end_date,
      location,
      address,
      max_guests,
      budget,
      theme,
      notes
    } = req.body;
    
    const updateSql = `
      UPDATE events SET
        title = ?, description = ?, event_type = ?, start_date = ?, end_date = ?,
        location = ?, address = ?, max_guests = ?, budget = ?, theme = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateSql, [
      title, description, event_type, start_date, end_date,
      location, address, max_guests, budget, theme, notes, id
    ]);
    
    // Get the updated event
    const updatedEvent = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Event updated successfully',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Update event status (managers only)
router.patch('/:id/status', [
  authenticateToken,
  requireRole(['manager']),
  body('status').isIn(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('manager_id').optional().isUUID().withMessage('Invalid manager ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { status, manager_id } = req.body;
    
    // Check if event exists
    const event = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Update status and optionally assign manager
    const updateSql = `
      UPDATE events SET
        status = ?,
        manager_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateSql, [status, manager_id || req.user.id, id]);
    
    // Get the updated event
    const updatedEvent = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Event status updated successfully',
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists and user has access
    const event = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.profile_type === 'customer' && event.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile_type === 'manager' && event.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow deletion if event is in planning stage
    if (event.status !== 'planning') {
      return res.status(400).json({ error: 'Cannot delete event that is not in planning stage' });
    }
    
    await runQuery('DELETE FROM events WHERE id = ?', [id]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get event statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists and user has access
    const event = await getRow('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check permissions
    if (req.user.profile_type === 'customer' && event.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile_type === 'manager' && event.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get booking statistics
    const bookingStats = await getRow(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_cost) as total_cost,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings
      FROM bookings 
      WHERE event_id = ?
    `, [id]);
    
    // Get vendor count
    const vendorCount = await getRow(`
      SELECT COUNT(DISTINCT vendor_id) as total_vendors
      FROM bookings 
      WHERE event_id = ?
    `, [id]);
    
    res.json({
      event_id: id,
      booking_stats: bookingStats,
      vendor_count: vendorCount.total_vendors
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: 'Failed to fetch event statistics' });
  }
});

module.exports = router;
