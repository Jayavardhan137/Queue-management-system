/**
 * QueueFlow AI - Production Reference Backend Server
 * Node.js & Express.js with PostgreSQL & JWT Authentication
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'queueflow_secret_key_1298471923';

// Database Pool Connection (PostgreSQL)
const pool = require("./config/db");

app.use(cors());
app.use(express.json());

// ==========================================
// MIDDLEWARES
// ==========================================

// Authenticate JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Authorize Roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};

// Check Tenant Isolation (Organization Admin / Staff only access their own data)
const checkTenantAccess = (req, res, next) => {
  const { orgId } = req.params;
  if (req.user.role !== 'Super Admin' && req.user.organizationId !== orgId) {
    return res.status(403).json({ error: 'Access Denied: Organization isolation violation' });
  }
  next();
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Organization Registration
app.post('/api/auth/register', async (req, res) => {
  const { 
    name, businessType, ownerName, email, phone, businessAddress, password,
    registrationDocUrl, identityProofUrl
  } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create organization with Pending Verification status
      const orgQuery = `
        INSERT INTO organizations (name, business_type, owner_name, email, phone, business_address, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Pending Verification')
        RETURNING *;
      `;
      const orgResult = await client.query(orgQuery, [
        name, businessType, ownerName, email, phone, businessAddress
      ]);
      const newOrg = orgResult.rows[0];

      // Insert Verification Documents
      const docQuery = `
        INSERT INTO organization_documents (organization_id, document_type, file_url)
        VALUES ($1, 'Business Registration Document', $2),
               ($1, 'Identity Proof', $3);
      `;
      await client.query(docQuery, [newOrg.id, registrationDocUrl || 'pending-upload', identityProofUrl || 'pending-upload']);

      // Create Settings
      await client.query(`
        INSERT INTO business_settings (organization_id) VALUES ($1);
      `, [newOrg.id]);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create Owner User Account
      const userQuery = `
        INSERT INTO users (email, password_hash, role, name, phone, organization_id)
        VALUES ($1, $2, 'Organization Admin', $3, $4, $5)
        RETURNING id, email, role, name;
      `;
      const userResult = await client.query(userQuery, [
        email, hashedPassword, ownerName, phone, newOrg.id
      ]);

      await client.query('COMMIT');

      const payload = {
        id: userResult.rows[0].id,
        name: userResult.rows[0].name,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role,
        organizationId: newOrg.id
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

      res.status(201).json({
        message: 'Registration successful. Pending verification by Super Admin.',
        organization: newOrg,
        user: { ...userResult.rows[0], organizationId: newOrg.id },
        token
      });
    } catch (err) {
    console.error(err);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    console.error(err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login (All Roles)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // If Org Admin or Staff, check if organization is active
    if (user.role !== 'Super Admin') {
      const orgQuery = 'SELECT status FROM organizations WHERE id = $1';
      const orgResult = await pool.query(orgQuery, [user.organization_id]);
      const org = orgResult.rows[0];

      if (!org) return res.status(404).json({ error: 'Organization not found' });
      if (org.status === 'Pending Verification') {
        return res.status(403).json({ error: 'Organization is pending verification by Super Admin' });
      }
      if (org.status === 'Suspended') {
        return res.status(403).json({ error: 'Organization account is suspended. Contact support.' });
      }
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      }
    });
  } catch (err) {
    console.error(err);
    console.error(err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// Get All Organizations (Pending, Active, Suspended)
app.get('/api/superadmin/organizations', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  try {
    const query = `
      SELECT o.*, 
             (SELECT COUNT(*) FROM queue_tokens WHERE organization_id = o.id) as total_tokens
      FROM organizations o
      ORDER BY o.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve organizations' });
  }
});

// Approve/Update Org Status
app.patch('/api/superadmin/organizations/:orgId/status', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  const { orgId } = req.params;
  const { status } = req.body; // 'Active', 'Suspended'

  try {
    const query = 'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update organization status' });
  }
});

// Analytics Overview
app.get('/api/superadmin/analytics', authenticateToken, authorizeRoles('Super Admin'), async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_orgs,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_orgs,
        COUNT(CASE WHEN status = 'Pending Verification' THEN 1 END) as pending_orgs,
        (SELECT COUNT(*) FROM queue_tokens) as total_tokens,
        (SELECT COUNT(*) FROM queue_tokens WHERE created_at >= CURRENT_DATE) as daily_customers
      FROM organizations;
    `;
    const statsResult = await pool.query(statsQuery);
    res.json(statsResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve super admin analytics' });
  }
});

// ==========================================
// ORGANIZATION ADMIN & QUEUE CONTROL ENDPOINTS
// ==========================================

// Get Organization Active Queue Metrics
app.get('/api/organizations/:orgId/dashboard', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;

  try {
    const tokensQuery = `
      SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN status = 'Waiting' THEN 1 END) as waiting,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Skipped' THEN 1 END) as skipped,
        (SELECT token_number FROM queue_tokens WHERE organization_id = $1 AND status = 'Serving' ORDER BY sequence_number ASC LIMIT 1) as current_token
      FROM queue_tokens 
      WHERE organization_id = $1 AND created_at >= CURRENT_DATE;
    `;
    
    const settingsQuery = 'SELECT avg_service_time_minutes, is_queue_paused FROM business_settings WHERE organization_id = $1';
    
    const tokensResult = await pool.query(tokensQuery, [orgId]);
    const settingsResult = await pool.query(settingsQuery, [orgId]);

    const metrics = tokensResult.rows[0];
    const settings = settingsResult.rows[0];

    res.json({
      todayQueue: parseInt(metrics.total_today || 0),
      currentToken: metrics.current_token || 'None',
      waitingCustomers: parseInt(metrics.waiting || 0),
      completedCustomers: parseInt(metrics.completed || 0),
      skippedCustomers: parseInt(metrics.skipped || 0),
      avgWaitingTime: (metrics.waiting * (settings ? settings.avg_service_time_minutes : 15)),
      isQueuePaused: settings ? settings.is_queue_paused : false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

// Advance/Next Customer in Queue
app.post('/api/organizations/:orgId/queue/next', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Current serving tokens should be marked Completed
      await client.query(`
        UPDATE queue_tokens 
        SET status = 'Completed', updated_at = NOW() 
        WHERE organization_id = $1 AND status = 'Serving';
      `, [orgId]);

      // 2. Fetch the next Waiting token
      const nextTokenQuery = `
        SELECT * FROM queue_tokens 
        WHERE organization_id = $1 AND status = 'Waiting' 
        ORDER BY sequence_number ASC LIMIT 1;
      `;
      const nextTokenRes = await client.query(nextTokenQuery, [orgId]);
      const nextToken = nextTokenRes.rows[0];

      if (nextToken) {
        // Update its status to Serving
        await client.query(`
          UPDATE queue_tokens SET status = 'Serving', updated_at = NOW() WHERE id = $1;
        `, [nextToken.id]);

        // Trigger SMS notification for Current Serving Turn
        await logNotification(orgId, nextToken.id, nextToken.customer_phone, `It is now your turn (Token ${nextToken.token_number}). Please proceed to the service counter.`, 'current_turn');

        // Alert next waiting customers (e.g. notify customer at position 2 and position 5)
        await notifyApproachingCustomers(client, orgId);
      }

      await client.query('COMMIT');
      res.json({ message: 'Queue updated successfully', nextToken: nextToken || null });
    } catch (err) {
    console.error(err);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to advance queue' });
  }
});

// Skip Current Customer
app.post('/api/organizations/:orgId/queue/skip', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;

  try {
    const updateResult = await pool.query(`
      UPDATE queue_tokens 
      SET status = 'Skipped', updated_at = NOW() 
      WHERE id = (
        SELECT id FROM queue_tokens 
        WHERE organization_id = $1 AND status = 'Serving' 
        ORDER BY sequence_number ASC LIMIT 1
      ) RETURNING *;
    `, [orgId]);

    res.json({ message: 'Token skipped successfully', skippedToken: updateResult.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to skip customer' });
  }
});

// Update Settings (Pause/Resume Queue)
app.patch('/api/organizations/:orgId/settings', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;
  const { isQueuePaused, avgServiceTimeMinutes } = req.body;

  try {
    const query = `
      UPDATE business_settings 
      SET is_queue_paused = COALESCE($1, is_queue_paused),
          avg_service_time_minutes = COALESCE($2, avg_service_time_minutes),
          updated_at = NOW()
      WHERE organization_id = $3 RETURNING *;
    `;
    const result = await pool.query(query, [isQueuePaused, avgServiceTimeMinutes, orgId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business settings' });
  }
});

// Get Full Token List For Org (Admin queue view - today's tokens)
app.get('/api/organizations/:orgId/queue/tokens', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM queue_tokens
      WHERE organization_id = $1 AND created_at >= CURRENT_DATE
      ORDER BY sequence_number ASC;
    `, [orgId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve queue tokens' });
  }
});

// Recall / Re-notify a Customer
app.post('/api/organizations/:orgId/queue/:tokenId/recall', authenticateToken, checkTenantAccess, async (req, res) => {
  const { tokenId } = req.params;
  try {
    const tokenRes = await pool.query('SELECT * FROM queue_tokens WHERE id = $1', [tokenId]);
    const token = tokenRes.rows[0];
    if (!token) return res.status(404).json({ error: 'Token not found' });

    await logNotification(
      token.organization_id, token.id, token.customer_phone,
      `Re-calling Token ${token.token_number}: Please proceed to the service counter. Your turn is currently active!`,
      'current_turn'
    );
    res.json({ message: 'Customer re-notified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to recall customer' });
  }
});

// Update Subscription (after simulated payment)
app.patch('/api/organizations/:orgId/subscription', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;
  const { subscriptionPlan, paymentStatus, trialStatus, subscriptionExpiry } = req.body;
  try {
    const query = `
      UPDATE organizations
      SET subscription_plan = COALESCE($1, subscription_plan),
          payment_status = COALESCE($2, payment_status),
          trial_status = COALESCE($3, trial_status),
          subscription_expiry = COALESCE($4, subscription_expiry),
          updated_at = NOW()
      WHERE id = $5 RETURNING *;
    `;
    const result = await pool.query(query, [subscriptionPlan, paymentStatus, trialStatus, subscriptionExpiry, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get Own Organization Profile (Org Admin)
app.get('/api/organizations/:orgId/profile', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve organization profile' });
  }
});

// Update Business Profile
app.patch('/api/organizations/:orgId/profile', authenticateToken, checkTenantAccess, async (req, res) => {
  const { orgId } = req.params;
  const { name, phone, businessAddress, logoUrl } = req.body;
  try {
    const query = `
      UPDATE organizations
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          business_address = COALESCE($3, business_address),
          logo_url = COALESCE($4, logo_url),
          updated_at = NOW()
      WHERE id = $5 RETURNING *;
    `;
    const result = await pool.query(query, [name, phone, businessAddress, logoUrl, orgId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update business profile' });
  }
});

// ==========================================
// CUSTOMER ENDPOINTS
// ==========================================

// Get Public Organization Info + Live Queue Status (QR landing page)
app.get('/api/public/organizations/:orgId', async (req, res) => {
  const { orgId } = req.params;
  try {
    const orgRes = await pool.query(
      'SELECT id, name, business_type, business_address, logo_url, status FROM organizations WHERE id = $1',
      [orgId]
    );
    if (orgRes.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
    const org = orgRes.rows[0];

    const settingsRes = await pool.query('SELECT is_queue_paused FROM business_settings WHERE organization_id = $1', [orgId]);
    const statsRes = await pool.query(`
      SELECT
        (SELECT token_number FROM queue_tokens WHERE organization_id = $1 AND status = 'Serving' ORDER BY sequence_number ASC LIMIT 1) as current_token,
        COUNT(CASE WHEN status = 'Waiting' THEN 1 END) as waiting
      FROM queue_tokens WHERE organization_id = $1 AND created_at >= CURRENT_DATE;
    `, [orgId]);

    res.json({
      id: org.id,
      name: org.name,
      businessType: org.business_type,
      address: org.business_address,
      logoUrl: org.logo_url,
      status: org.status,
      isQueuePaused: settingsRes.rows[0]?.is_queue_paused || false,
      currentToken: statsRes.rows[0]?.current_token || 'None',
      waitingCount: parseInt(statsRes.rows[0]?.waiting || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve organization info' });
  }
});

// Book Token (Customer scan QR landing page)
app.post('/api/public/queue/:orgId/book', async (req, res) => {
  const { orgId } = req.params;
  const { name, phone, email, purpose } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify organization is active
      const orgRes = await client.query('SELECT status, name FROM organizations WHERE id = $1', [orgId]);
      if (orgRes.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });
      if (orgRes.rows[0].status !== 'Active') return res.status(400).json({ error: 'Queue system currently closed/inactive' });

      // Generate incremental token code e.g. A001
      const countRes = await client.query(`
        SELECT COUNT(*) FROM queue_tokens 
        WHERE organization_id = $1 AND created_at >= CURRENT_DATE;
      `, [orgId]);
      const tokenIndex = parseInt(countRes.rows[0].count) + 1;
      const tokenNumber = `A${String(tokenIndex).padStart(3, '0')}`;

      // Insert Token
      const insertQuery = `
        INSERT INTO queue_tokens (organization_id, token_number, customer_name, customer_phone, customer_email, purpose_of_visit)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const tokenResult = await client.query(insertQuery, [
        orgId, tokenNumber, name, phone, email, purpose
      ]);
      const newToken = tokenResult.rows[0];

      await client.query('COMMIT');
      res.status(201).json(newToken);
    } catch (err) {
    console.error(err);
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    console.error(err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Track Queue (Get live position)
app.get('/api/public/tokens/:tokenId/track', async (req, res) => {
  const { tokenId } = req.params;

  try {
    // 1. Fetch ticket details
    const tokenQuery = 'SELECT * FROM queue_tokens WHERE id = $1';
    const tokenRes = await pool.query(tokenQuery, [tokenId]);
    const token = tokenRes.rows[0];

    if (!token) return res.status(404).json({ error: 'Token not found' });

    // 2. Compute serving token and wait times
    const statsQuery = `
      SELECT 
        (SELECT token_number FROM queue_tokens WHERE organization_id = $1 AND status = 'Serving' ORDER BY sequence_number ASC LIMIT 1) as current_serving,
        COUNT(*) as ahead
      FROM queue_tokens 
      WHERE organization_id = $1 
        AND status = 'Waiting' 
        AND sequence_number < $2 
        AND created_at >= CURRENT_DATE;
    `;
    const statsRes = await pool.query(statsQuery, [token.organization_id, token.sequence_number]);
    const stats = statsRes.rows[0];

    const aheadCount = parseInt(stats.ahead || 0);
    const serviceTime = 15; // default wait estimation metric
    
    res.json({
      tokenNumber: token.token_number,
      status: token.status,
      currentServingToken: stats.current_serving || 'None',
      peopleAhead: token.status === 'Waiting' ? aheadCount : 0,
      estimatedWaitMinutes: token.status === 'Waiting' ? (aheadCount + 1) * serviceTime : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to track token details' });
  }
});

// Search active ticket by Phone or Token Number
app.get('/api/public/search', async (req, res) => {
  const { query } = req.query; // phone or token

  try {
    const searchRes = await pool.query(`
      SELECT t.*, o.name as org_name
      FROM queue_tokens t
      JOIN organizations o ON t.organization_id = o.id
      WHERE (t.customer_phone = $1 OR t.token_number = $1)
        AND t.status IN ('Waiting', 'Serving')
      ORDER BY t.created_at DESC;
    `, [query]);

    res.json(searchRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==========================================
// HELPER METHODS
// ==========================================

// Helper: Log Notification in Database
async function logNotification(orgId, tokenId, phone, message, type) {
  try {
    // Under production, trigger Twilio API request here
    console.log(`[SMS Notification (${type}) to ${phone}]: "${message}"`);
    
    await pool.query(`
      INSERT INTO notifications (organization_id, token_id, customer_phone, message, notification_type, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, 'Sent', NOW());
    `, [orgId, tokenId, phone, message, type]);
  } catch (err) {
    console.error(err);
    console.error('Failed to log SMS notification', err);
  }
}

// Helper: Notify customers approaching their turn
async function notifyApproachingCustomers(client, orgId) {
  // Find all waiting customers in order
  const query = `
    SELECT id, token_number, customer_phone,
           ROW_NUMBER() OVER (ORDER BY sequence_number ASC) as position
    FROM queue_tokens
    WHERE organization_id = $1 AND status = 'Waiting'
    ORDER BY sequence_number ASC;
  `;
  const result = await client.query(query, [orgId]);
  const waitingList = result.rows;

  for (let customer of waitingList) {
    const pos = parseInt(customer.position);
    if (pos === 2) {
      await logNotification(orgId, customer.id, customer.customer_phone, `Please come near the service counter. Your turn (Token ${customer.token_number}) is extremely close.`, '2_ahead');
    } else if (pos === 5) {
      await logNotification(orgId, customer.id, customer.customer_phone, `Please get ready. Your turn (Token ${customer.token_number}) is approaching (5 people ahead).`, '5_ahead');
    }
  }
}

app.listen(PORT, () => {
  console.log(`QueueFlow AI API running on port ${PORT}`);
});
