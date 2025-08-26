const jwt = require('jsonwebtoken');
const { getRow } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await getRow('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.profile_type)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Check if user owns the resource or is admin/manager
const requireOwnership = (resourceTable, resourceIdField = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin and managers can access all resources
    if (['admin', 'manager'].includes(req.user.profile_type)) {
      return next();
    }

    const resourceId = req.params[resourceIdField];
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID required' });
    }

    try {
      // Check if user owns the resource
      const resource = await getRow(
        `SELECT * FROM ${resourceTable} WHERE ${resourceIdField} = ? AND customer_id = ?`,
        [resourceId, req.user.id]
      );

      if (!resource) {
        return res.status(403).json({ error: 'Access denied to this resource' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error checking resource ownership' });
    }
  };
};

// Optional authentication (for public routes that can show different content for authenticated users)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await getRow('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth
};

