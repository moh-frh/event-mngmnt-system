const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all vendor profiles (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, vendor_type, search, available } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE vp.is_available = 1';
    const params = [];
    
    if (vendor_type && vendor_type !== 'all') {
      whereClause += ' AND vp.vendor_type = ?';
      params.push(vendor_type);
    }
    
    if (search) {
      whereClause += ' AND (vp.business_name LIKE ? OR vp.description LIKE ? OR vp.vendor_type LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (available === 'true') {
      whereClause += ' AND vp.is_available = 1';
    }
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM vendor_profiles vp 
      ${whereClause}
    `;
    const countResult = await getRow(countSql, params);
    const total = countResult.total;
    
    // Get vendors with pagination
    const vendorsSql = `
      SELECT vp.*, 
             u.first_name, 
             u.last_name,
             u.email as user_email,
             u.phone as user_phone
      FROM vendor_profiles vp
      LEFT JOIN users u ON vp.user_id = u.id
      ${whereClause}
      ORDER BY vp.rating DESC, vp.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const vendors = await getAll(vendorsSql, [...params, limit, offset]);
    
    res.json({
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get single vendor profile with services (public route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vendor profile
    const vendorSql = `
      SELECT vp.*, 
             u.first_name, 
             u.last_name,
             u.email as user_email,
             u.phone as user_phone
      FROM vendor_profiles vp
      LEFT JOIN users u ON vp.user_id = u.id
      WHERE vp.id = ?
    `;
    
    const vendor = await getRow(vendorSql, [id]);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Get vendor services
    const servicesSql = `
      SELECT * FROM vendor_services 
      WHERE vendor_id = ? AND is_available = 1
      ORDER BY service_name
    `;
    
    const services = await getAll(servicesSql, [id]);
    
    res.json({ 
      vendor,
      services 
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Get vendor profile for authenticated vendor
router.get('/profile', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const vendorProfile = await getRow(
      'SELECT * FROM vendor_profiles WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({ profile: vendorProfile });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({ error: 'Failed to fetch vendor profile' });
  }
});

// Create vendor profile
router.post('/profile', authenticateToken, requireRole(['vendor']), [
  body('business_name').notEmpty().withMessage('Business name is required'),
  body('vendor_type').isIn(['caterer', 'photographer', 'decorator', 'musician', 'transport', 'other']).withMessage('Invalid vendor type'),
  body('contact_person').notEmpty().withMessage('Contact person is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if profile already exists
    const existingProfile = await getRow(
      'SELECT id FROM vendor_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (existingProfile) {
      return res.status(400).json({ error: 'Vendor profile already exists' });
    }

    const {
      business_name,
      description,
      vendor_type,
      contact_person,
      phone,
      email,
      address
    } = req.body;

    const profileId = uuidv4();

    await runQuery(
      `INSERT INTO vendor_profiles (
        id, user_id, business_name, description, vendor_type, 
        contact_person, phone, email, address, is_available, 
        rating, total_reviews, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [profileId, req.user.id, business_name, description, vendor_type, contact_person, phone, email, address]
    );

    const newProfile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ?',
      [profileId]
    );

    res.status(201).json({
      message: 'Vendor profile created successfully',
      profile: newProfile
    });
  } catch (error) {
    console.error('Error creating vendor profile:', error);
    res.status(500).json({ error: 'Failed to create vendor profile' });
  }
});

// Update vendor profile
router.put('/profile', authenticateToken, requireRole(['vendor']), [
  body('business_name').notEmpty().withMessage('Business name is required'),
  body('vendor_type').isIn(['caterer', 'photographer', 'decorator', 'musician', 'transport', 'other']).withMessage('Invalid vendor type'),
  body('contact_person').notEmpty().withMessage('Contact person is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if profile exists
    const existingProfile = await getRow(
      'SELECT id FROM vendor_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (!existingProfile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const {
      business_name,
      description,
      vendor_type,
      contact_person,
      phone,
      email,
      address
    } = req.body;

    await runQuery(
      `UPDATE vendor_profiles SET
        business_name = ?, description = ?, vendor_type = ?, 
        contact_person = ?, phone = ?, email = ?, address = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [business_name, description, vendor_type, contact_person, phone, email, address, req.user.id]
    );

    const updatedProfile = await getRow(
      'SELECT * FROM vendor_profiles WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Vendor profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({ error: 'Failed to update vendor profile' });
  }
});

// Toggle vendor availability
router.patch('/profile/availability', authenticateToken, requireRole(['vendor']), async (req, res) => {
  try {
    const { is_available } = req.body;
    
    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ error: 'is_available must be a boolean' });
    }

    await runQuery(
      'UPDATE vendor_profiles SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [is_available, req.user.id]
    );

    res.json({
      message: `Vendor profile ${is_available ? 'activated' : 'deactivated'} successfully`,
      is_available
    });
  } catch (error) {
    console.error('Error updating vendor availability:', error);
    res.status(500).json({ error: 'Failed to update vendor availability' });
  }
});



// Add vendor service
router.post('/:id/services', [
  authenticateToken,
  requireRole(['vendor']),
  body('service_name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('base_price').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('price_type').isIn(['per_person', 'per_hour', 'per_event', 'per_meal']).withMessage('Invalid price type'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('unit').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    // Check if profile exists and belongs to user
    const profile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    
    const {
      service_name,
      description,
      base_price,
      price_type,
      capacity,
      unit
    } = req.body;
    
    const serviceId = uuidv4();
    
    const insertSql = `
      INSERT INTO vendor_services (
        id, vendor_id, service_name, description, base_price,
        price_type, capacity, unit, is_available, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await runQuery(insertSql, [
      serviceId, id, service_name, description, base_price,
      price_type, capacity, unit
    ]);
    
    // Get the created service
    const service = await getRow('SELECT * FROM vendor_services WHERE id = ?', [serviceId]);
    
    res.status(201).json({ 
      message: 'Service added successfully',
      service 
    });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Update vendor service
router.put('/:id/services/:serviceId', [
  authenticateToken,
  requireRole(['vendor']),
  body('service_name').optional().trim().isLength({ min: 1 }).withMessage('Service name cannot be empty'),
  body('base_price').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('price_type').optional().isIn(['per_person', 'per_hour', 'per_event', 'per_meal']).withMessage('Invalid price type'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('unit').optional().trim(),
  body('description').optional().trim(),
  body('is_available').optional().isBoolean().withMessage('Availability must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id, serviceId } = req.params;
    
    // Check if profile exists and belongs to user
    const profile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    
    // Check if service exists and belongs to vendor
    const service = await getRow(
      'SELECT * FROM vendor_services WHERE id = ? AND vendor_id = ?', 
      [serviceId, id]
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const {
      service_name,
      description,
      base_price,
      price_type,
      capacity,
      unit,
      is_available
    } = req.body;
    
    const updateSql = `
      UPDATE vendor_services SET
        service_name = COALESCE(?, service_name),
        description = COALESCE(?, description),
        base_price = COALESCE(?, base_price),
        price_type = COALESCE(?, price_type),
        capacity = COALESCE(?, capacity),
        unit = COALESCE(?, unit),
        is_available = COALESCE(?, is_available),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateSql, [
      service_name, description, base_price, price_type,
      capacity, unit, is_available, serviceId
    ]);
    
    // Get the updated service
    const updatedService = await getRow('SELECT * FROM vendor_services WHERE id = ?', [serviceId]);
    
    res.json({ 
      message: 'Service updated successfully',
      service: updatedService 
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete vendor service
router.delete('/:id/services/:serviceId', [
  authenticateToken,
  requireRole(['vendor'])
], async (req, res) => {
  try {
    const { id, serviceId } = req.params;
    
    // Check if profile exists and belongs to user
    const profile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    
    // Check if service exists and belongs to vendor
    const service = await getRow(
      'SELECT * FROM vendor_services WHERE id = ? AND vendor_id = ?', 
      [serviceId, id]
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check if service has any bookings
    const bookings = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = ?', 
      [serviceId]
    );
    
    if (bookings.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete service with existing bookings. Consider setting it as unavailable instead.' 
      });
    }
    
    await runQuery('DELETE FROM vendor_services WHERE id = ?', [serviceId]);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get vendor's bookings
router.get('/:id/bookings', [
  authenticateToken,
  requireRole(['vendor'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if profile exists and belongs to user
    const profile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    
    let whereClause = 'WHERE b.vendor_id = ?';
    const params = [id];
    
    if (status && status !== 'all') {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM bookings b 
      ${whereClause}
    `;
    const countResult = await getRow(countSql, params);
    const total = countResult.total;
    
    // Get bookings with event and customer details
    const bookingsSql = `
      SELECT b.*, 
             e.title as event_title,
             e.start_date as event_date,
             e.location as event_location,
             u.first_name as customer_first_name,
             u.last_name as customer_last_name,
             vs.service_name,
             vs.price_type
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN vendor_services vs ON b.service_id = vs.id
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
    console.error('Error fetching vendor bookings:', error);
    res.status(500).json({ error: 'Failed to fetch vendor bookings' });
  }
});

// Get vendor statistics
router.get('/:id/stats', [
  authenticateToken,
  requireRole(['vendor'])
], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if profile exists and belongs to user
    const profile = await getRow(
      'SELECT * FROM vendor_profiles WHERE id = ? AND user_id = ?', 
      [id, req.user.id]
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    
    // Get booking statistics
    const bookingStats = await getRow(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(total_cost) as total_revenue,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
      FROM bookings 
      WHERE vendor_id = ?
    `, [id]);
    
    // Get service statistics
    const serviceStats = await getRow(`
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN is_available = 1 THEN 1 END) as available_services
      FROM vendor_services 
      WHERE vendor_id = ?
    `, [id]);
    
    res.json({
      vendor_id: id,
      booking_stats: bookingStats,
      service_stats: serviceStats
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ error: 'Failed to fetch vendor statistics' });
  }
});

module.exports = router;
