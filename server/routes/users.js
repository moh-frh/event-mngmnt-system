const express = require('express');
const { body, validationResult } = require('express-validator');
const { runQuery, getRow, getAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { profile_type, is_active, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let whereParams = [];

    if (profile_type) {
      whereClause += ' AND profile_type = ?';
      whereParams.push(profile_type);
    }
    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      whereParams.push(is_active === 'true' ? 1 : 0);
    }

    const users = await getAll(
      `SELECT id, username, email, first_name, last_name, phone, profile_type, 
              profile_image, is_active, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await getRow(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      whereParams
    );

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get user by ID (admin or self)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only see their own profile unless they're admin
    if (req.user.id !== parseInt(id) && req.user.profile_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await getRow(
      `SELECT id, username, email, first_name, last_name, phone, profile_type, 
              profile_image, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Update user (admin or self)
router.put('/:id', authenticateToken, [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('profile_type').optional().isIn(['manager', 'customer', 'vendor', 'admin']).withMessage('Invalid profile type'),
  body('is_active').optional().isBoolean().withMessage('Active status must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.id !== parseInt(id) && req.user.profile_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Non-admin users cannot change profile_type or is_active
    if (req.user.profile_type !== 'admin') {
      delete updateData.profile_type;
      delete updateData.is_active;
    }

    // Check if user exists
    const existingUser = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
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

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await runQuery(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedUser = await getRow(
      `SELECT id, username, email, first_name, last_name, phone, profile_type, 
              profile_image, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    await runQuery(
      'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Error deactivating user' });
  }
});

// Reactivate user (admin only)
router.patch('/:id/reactivate', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await runQuery(
      'UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'User reactivated successfully' });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Error reactivating user' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [totalUsers, activeUsers, managers, customers, vendors] = await Promise.all([
      getRow('SELECT COUNT(*) as count FROM users'),
      getRow('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
      getRow('SELECT COUNT(*) as count FROM users WHERE profile_type = "manager" AND is_active = 1'),
      getRow('SELECT COUNT(*) as count FROM users WHERE profile_type = "customer" AND is_active = 1'),
      getRow('SELECT COUNT(*) as count FROM users WHERE profile_type = "vendor" AND is_active = 1')
    ]);

    res.json({
      stats: {
        total_users: totalUsers.count,
        active_users: activeUsers.count,
        managers: managers.count,
        customers: customers.count,
        vendors: vendors.count
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Error fetching user statistics' });
  }
});

module.exports = router;

