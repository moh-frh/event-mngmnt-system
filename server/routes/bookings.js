const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all bookings (role-based access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, event_id, vendor_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // Role-based filtering
    if (req.user.profile_type === 'customer') {
      whereClause += ' AND b.customer_id = ?';
      params.push(req.user.id);
    } else if (req.user.profile_type === 'vendor') {
      whereClause += ' AND b.vendor_id = ?';
      params.push(req.user.id);
    }
    
    // Additional filters
    if (status && status !== 'all') {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }
    
    if (event_id) {
      whereClause += ' AND b.event_id = ?';
      params.push(event_id);
    }
    
    if (vendor_id) {
      whereClause += ' AND b.vendor_id = ?';
      params.push(vendor_id);
    }
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM bookings b 
      ${whereClause}
    `;
    const countResult = await getRow(countSql, params);
    const total = countResult.total;
    
    // Get bookings with related data
    const bookingsSql = `
      SELECT b.*, 
             e.title as event_title,
             e.start_date as event_date,
             e.location as event_location,
             vp.business_name as vendor_name,
             vp.vendor_type,
             vs.service_name,
             vs.price_type,
             u.first_name as customer_first_name,
             u.last_name as customer_last_name
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN vendor_profiles vp ON b.vendor_id = vp.id
      LEFT JOIN vendor_services vs ON b.service_id = vs.id
      LEFT JOIN users u ON b.customer_id = u.id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const bookings = await getAll(bookingsSql, [...params, limit, offset]);
    
    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bookingSql = `
      SELECT b.*, 
             e.title as event_title,
             e.start_date as event_date,
             e.location as event_location,
             vp.business_name as vendor_name,
             vp.vendor_type,
             vs.service_name,
             vs.price_type,
             u.first_name as customer_first_name,
             u.last_name as customer_last_name
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN vendor_profiles vp ON b.vendor_id = vp.id
      LEFT JOIN vendor_services vs ON b.service_id = vs.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.id = ?
    `;
    
    const booking = await getRow(bookingSql, [id]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check access permissions
    let isAuthorized = false;
    if (req.user.profile_type === 'customer' && booking.customer_id === req.user.id) {
      isAuthorized = true;
    }
    if (req.user.profile_type === 'vendor' && booking.vendor_id === req.user.id) {
      isAuthorized = true;
    }
    if (!isAuthorized && req.user.profile_type === 'manager') {
      const event = await getRow('SELECT manager_id FROM events WHERE id = ?', [booking.event_id]);
      if (event && event.manager_id === req.user.id) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Create booking (customers only)
router.post('/', [
  authenticateToken,
  requireRole(['customer']),
  body('event_id').isUUID().withMessage('Valid event ID is required'),
  body('vendor_id').isUUID().withMessage('Valid vendor ID is required'),
  body('service_id').isUUID().withMessage('Valid service ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('booking_date').isISO8601().withMessage('Valid booking date is required'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
  body('special_requirements').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      event_id,
      vendor_id,
      service_id,
      quantity,
      booking_date,
      start_time,
      end_time,
      special_requirements
    } = req.body;
    
    // Check if event exists and belongs to customer
    const event = await getRow(
      'SELECT * FROM events WHERE id = ? AND customer_id = ?', 
      [event_id, req.user.id]
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Check if vendor exists and is available
    const vendor = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND is_available = 1', 
      [vendor_id]
    );
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found or unavailable' });
    }
    
    // Check if service exists and belongs to vendor
    const service = await getRow(
      'SELECT * FROM vendor_services WHERE id = ? AND vendor_id = ? AND is_available = 1', 
      [service_id, vendor_id]
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found or unavailable' });
    }
    
    // Check if service has sufficient capacity
    if (service.capacity && quantity > service.capacity) {
      return res.status(400).json({ 
        error: `Service capacity exceeded. Maximum: ${service.capacity}` 
      });
    }
    
    // Calculate total cost
    let totalCost;
    switch (service.price_type) {
      case 'per_person':
        totalCost = service.base_price * quantity;
        break;
      case 'per_hour':
        const hours = start_time && end_time ? 
          (new Date(`2000-01-01T${end_time}`) - new Date(`2000-01-01T${start_time}`)) / (1000 * 60 * 60) : 1;
        totalCost = service.base_price * hours;
        break;
      case 'per_event':
        totalCost = service.base_price;
        break;
      case 'per_meal':
        totalCost = service.base_price * quantity;
        break;
      default:
        totalCost = service.base_price;
    }
    
    // Check for booking conflicts
    const conflictSql = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE vendor_id = ? AND service_id = ? AND booking_date = ? 
      AND status IN ('pending', 'confirmed', 'in_progress')
      AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))
    `;
    
    if (start_time && end_time) {
      const conflicts = await getRow(conflictSql, [
        vendor_id, service_id, booking_date, 
        start_time, start_time, end_time, end_time, start_time, end_time
      ]);
      
      if (conflicts.count > 0) {
        return res.status(400).json({ error: 'Time slot conflict with existing booking' });
      }
    }
    
    const bookingId = uuidv4();
    
    const insertSql = `
      INSERT INTO bookings (
        id, event_id, vendor_id, service_id, customer_id, quantity,
        unit_price, total_cost, booking_date, start_time, end_time,
        special_requirements, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await runQuery(insertSql, [
      bookingId, event_id, vendor_id, service_id, req.user.id, quantity,
      service.base_price, totalCost, booking_date, start_time, end_time, special_requirements
    ]);
    
    // Get the created booking
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    
    res.status(201).json({ 
      message: 'Booking created successfully',
      booking 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking status (vendors, customers, and managers of the event)
router.patch('/:id/status', [
  authenticateToken,
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if booking exists
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check permissions
    let isAuthorized = false;
    if (req.user.profile_type === 'customer' && booking.customer_id === req.user.id) {
      isAuthorized = true;
    }
    if (req.user.profile_type === 'vendor' && booking.vendor_id === req.user.id) {
      isAuthorized = true;
    }
    // Managers can act on bookings for events they manage
    if (!isAuthorized && req.user.profile_type === 'manager') {
      const event = await getRow('SELECT manager_id FROM events WHERE id = ?', [booking.event_id]);
      if (event && event.manager_id === req.user.id) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Status transition validation
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    
    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot transition from ${booking.status} to ${status}` 
      });
    }
    
    // Update status
    await runQuery(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    // Get the updated booking
    const updatedBooking = await getRow('SELECT * FROM bookings WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Booking status updated successfully',
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Update booking details
router.put('/:id', [
  authenticateToken,
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('start_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('end_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
  body('special_requirements').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    // Check if booking exists
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check permissions
    if (req.user.profile_type === 'customer' && booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile_type === 'vendor' && booking.vendor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow updates for pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot update booking that is not pending' 
      });
    }
    
    const {
      quantity,
      start_time,
      end_time,
      special_requirements
    } = req.body;
    
    // Recalculate total cost if quantity changes
    let totalCost = booking.total_cost;
    if (quantity && quantity !== booking.quantity) {
      const service = await getRow('SELECT * FROM vendor_services WHERE id = ?', [booking.service_id]);
      if (service) {
        switch (service.price_type) {
          case 'per_person':
          case 'per_meal':
            totalCost = service.base_price * quantity;
            break;
          default:
            totalCost = service.base_price;
        }
      }
    }
    
    const updateSql = `
      UPDATE bookings SET
        quantity = COALESCE(?, quantity),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        special_requirements = COALESCE(?, special_requirements),
        total_cost = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateSql, [
      quantity, start_time, end_time, special_requirements, totalCost, id
    ]);
    
    // Get the updated booking
    const updatedBooking = await getRow('SELECT * FROM bookings WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Booking updated successfully',
      booking: updatedBooking 
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking (only pending bookings)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if booking exists
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [id]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check permissions
    if (req.user.profile_type === 'customer' && booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile_type === 'vendor' && booking.vendor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow deletion of pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot delete booking that is not pending' 
      });
    }
    
    await runQuery('DELETE FROM bookings WHERE id = ?', [id]);
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Get booking statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // Role-based filtering
    if (req.user.profile_type === 'customer') {
      whereClause += ' AND customer_id = ?';
      params.push(req.user.id);
    } else if (req.user.profile_type === 'vendor') {
      whereClause += ' AND vendor_id = ?';
      params.push(req.user.id);
    }
    
    // Get booking statistics
    const statsSql = `
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_cost) as total_spent,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings 
      ${whereClause}
    `;
    
    const stats = await getRow(statsSql, params);
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch booking statistics' });
  }
});

module.exports = router;
