const sqlite3 = require('sqlite3');
const path = require('path');

// Create database instance
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

/**
 * Initialize the database with required tables
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create agents table
      db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          repo_url TEXT NOT NULL,
          branch_name TEXT NOT NULL,
          branch_hash TEXT NOT NULL UNIQUE,
          agent_address TEXT,
          status TEXT DEFAULT 'deploying',
          pid INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating agents table:', err);
          reject(err);
          return;
        }
        console.log('✅ Agents table created/verified');
      });

      // Create secrets table
      db.run(`
        CREATE TABLE IF NOT EXISTS secrets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id INTEGER NOT NULL,
          key TEXT NOT NULL,
          encrypted_value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating secrets table:', err);
          reject(err);
          return;
        }
        console.log('✅ Secrets table created/verified');
      });

      // Create index on branch_hash for faster lookups
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_agents_branch_hash ON agents(branch_hash)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          reject(err);
          return;
        }
        console.log('✅ Database index created/verified');
      });

      // Create index on agent_id for secrets table
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_secrets_agent_id ON secrets(agent_id)
      `, (err) => {
        if (err) {
          console.error('Error creating secrets index:', err);
          reject(err);
          return;
        }
        console.log('✅ Secrets index created/verified');
        resolve();
      });
    });
  });
}

/**
 * Get database instance
 */
function getDatabase() {
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      resolve();
    });
  });
}

module.exports = {
  getDatabase,
  closeDatabase
};

/**
 * Initialize database on startup
 */
initializeDatabase()
  .then(() => {
    console.log('🎉 Database initialization completed successfully');
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });

