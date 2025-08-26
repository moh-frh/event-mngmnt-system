const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path - use absolute path to avoid issues
const dbPath = path.resolve(__dirname, '..', 'data', 'events.db');

// Create database connection
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          profile_type TEXT CHECK(profile_type IN ('customer', 'manager', 'vendor', 'admin')) NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Events table
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          event_type TEXT CHECK(event_type IN ('wedding', 'birthday', 'corporate', 'other')) NOT NULL,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          location TEXT,
          address TEXT,
          max_guests INTEGER,
          budget DECIMAL(10,2),
          theme TEXT,
          notes TEXT,
          status TEXT CHECK(status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planning',
          customer_id TEXT NOT NULL,
          manager_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES users (id),
          FOREIGN KEY (manager_id) REFERENCES users (id)
        )
      `);

      // Vendor profiles table
      db.run(`
        CREATE TABLE IF NOT EXISTS vendor_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          business_name TEXT NOT NULL,
          description TEXT,
          vendor_type TEXT CHECK(vendor_type IN ('caterer', 'photographer', 'decorator', 'musician', 'transport', 'other')) NOT NULL,
          contact_person TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          is_available BOOLEAN DEFAULT 1,
          rating DECIMAL(3,2) DEFAULT 0,
          total_reviews INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Vendor services table
      db.run(`
        CREATE TABLE IF NOT EXISTS vendor_services (
          id TEXT PRIMARY KEY,
          vendor_id TEXT NOT NULL,
          service_name TEXT NOT NULL,
          description TEXT,
          base_price DECIMAL(10,2) NOT NULL,
          price_type TEXT CHECK(price_type IN ('per_person', 'per_hour', 'per_event', 'per_meal')) NOT NULL,
          capacity INTEGER,
          unit TEXT,
          is_available BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vendor_id) REFERENCES vendor_profiles (id)
        )
      `);

      // Bookings table (customer bookings for vendor services)
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          vendor_id TEXT NOT NULL,
          service_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_cost DECIMAL(10,2) NOT NULL,
          booking_date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          special_requirements TEXT,
          status TEXT CHECK(status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events (id),
          FOREIGN KEY (vendor_id) REFERENCES vendor_profiles (id),
          FOREIGN KEY (service_id) REFERENCES vendor_services (id),
          FOREIGN KEY (customer_id) REFERENCES users (id)
        )
      `);

      // Calendar table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendar (
          id TEXT PRIMARY KEY,
          event_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          location TEXT,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Event tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS event_tasks (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          assigned_to TEXT,
          due_date DATETIME,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
          status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events (id),
          FOREIGN KEY (assigned_to) REFERENCES users (id)
        )
      `);

      // Guest list table
      db.run(`
        CREATE TABLE IF NOT EXISTS guest_list (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          guest_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          rsvp_status TEXT CHECK(rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')) DEFAULT 'pending',
          dietary_restrictions TEXT,
          plus_one BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES users (id)
        )
      `);

      console.log('Database initialized successfully');
      resolve();
    });
  });
};

// Helper functions for database operations
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  runQuery,
  getRow,
  getAll,
  initDatabase
};
