const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelper } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username or email and password are required.' });
      }

      const input = username.trim().toLowerCase();
      const inputWithDomain = input.includes('@') ? input : `${input}@vnrvjiet.in`;

      const user = await dbHelper.get(`
        SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE LOWER(u.username) = LOWER(?) 
           OR LOWER(u.email) = LOWER(?) 
           OR LOWER(u.email) = LOWER(?)
      `, [input, input, inputWithDomain]);

      if (!user) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      if (user.status === 'disabled') {
        return res.status(403).json({ error: 'Your account is disabled. Please contact the college administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      // Generate JWT Token (valid for 7 days)
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Record session in DB
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await dbHelper.run(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user.id, token, expiresAt]
      );

      // Log activity
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [user.id, 'User Login', user.department_id, JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })]
      );

      const { password_hash, ...userProfile } = user;
      res.json({
        message: 'Login successful',
        token,
        user: userProfile
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  },

  async googleLogin(req, res) {
    try {
      const { email, full_name, avatar_url, google_id } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required for Google authentication.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const defaultUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');

      // Check if user already exists
      let user = await dbHelper.get(`
        SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?)
      `, [cleanEmail, defaultUsername]);

      if (!user) {
        // Auto-register faculty under CSE- (CYS, DS) and AI&DS (Dept ID 1)
        const defaultDept = await dbHelper.get("SELECT id FROM departments ORDER BY id ASC LIMIT 1");
        const deptId = defaultDept ? defaultDept.id : 1;
        const tempPassword = await bcrypt.hash(`VNRVJIET@${Date.now()}`, 10);

        const insertRes = await dbHelper.run(`
          INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status, avatar_url)
          VALUES (?, ?, ?, ?, 3, ?, 'active', ?)
        `, [
          full_name || defaultUsername,
          defaultUsername,
          tempPassword,
          cleanEmail,
          deptId,
          avatar_url || ''
        ]);

        user = await dbHelper.get(`
          SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
          FROM users u
          JOIN roles r ON u.role_id = r.id
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE u.id = ?
        `, [insertRes.lastID]);
      }

      if (user.status === 'disabled') {
        return res.status(403).json({ error: 'Your account is disabled. Please contact the administrator.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [user.id, 'Google SSO Login', user.department_id, JSON.stringify({ email: cleanEmail })]
      );

      const { password_hash, ...userProfile } = user;
      res.json({
        message: 'Google Sign In successful',
        token,
        user: userProfile
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ error: 'Failed to sign in with Google.' });
    }
  },

  async signup(req, res) {
    try {
      const { full_name, username, email, password, department_id } = req.body;

      if (!full_name || !username || !email || !password) {
        return res.status(400).json({ error: 'Full name, username, email, and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      let cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        cleanEmail = `${cleanUsername}@vnrvjiet.in`;
      }

      // Check collision
      const existingUser = await dbHelper.get(
        "SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
        [cleanUsername, cleanEmail]
      );

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists.' });
      }

      const defaultDept = await dbHelper.get("SELECT id FROM departments ORDER BY id ASC LIMIT 1");
      const targetDeptId = department_id || (defaultDept ? defaultDept.id : 1);
      const passwordHash = await bcrypt.hash(password, 10);

      const insertRes = await dbHelper.run(`
        INSERT INTO users (full_name, username, password_hash, email, role_id, department_id, status)
        VALUES (?, ?, ?, ?, 3, ?, 'active')
      `, [full_name.trim(), cleanUsername, passwordHash, cleanEmail, targetDeptId]);

      const user = await dbHelper.get(`
        SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `, [insertRes.lastID]);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [user.id, 'User Registered', user.department_id, JSON.stringify({ email: cleanEmail })]
      );

      const { password_hash, ...userProfile } = user;
      res.json({
        message: 'Account created successfully',
        token,
        user: userProfile
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { emailOrUsername } = req.body;
      if (!emailOrUsername || !emailOrUsername.trim()) {
        return res.status(400).json({ error: 'Please enter your username or VNR VJIET email address.' });
      }

      const input = emailOrUsername.trim().toLowerCase();
      const inputWithDomain = input.includes('@') ? input : `${input}@vnrvjiet.in`;

      const user = await dbHelper.get(`
        SELECT * FROM users 
        WHERE LOWER(username) = LOWER(?) 
           OR LOWER(email) = LOWER(?) 
           OR LOWER(email) = LOWER(?)
      `, [input, input, inputWithDomain]);

      if (!user) {
        return res.status(404).json({ error: 'No account found matching this username or email.' });
      }

      // Generate 6-digit numeric OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

      // Invalidate old OTPs for user
      await dbHelper.run("DELETE FROM password_resets WHERE user_id = ?", [user.id]);

      // Save new OTP
      await dbHelper.run(`
        INSERT INTO password_resets (user_id, email, otp, expires_at)
        VALUES (?, ?, ?, ?)
      `, [user.id, user.email, otp, expiresAt]);

      // Log notification
      await dbHelper.run(`
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (?, 'Password Reset OTP', ?, '/login')
      `, [user.id, `Your password reset OTP is: ${otp}. It expires in 15 minutes.`]);

      res.json({
        success: true,
        email: user.email,
        username: user.username,
        otp: otp, // Returned for instant simulated SMS/Email verification display
        message: `A 6-digit verification OTP has been sent to ${user.email}.`
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request.' });
    }
  },

  async verifyOtpAndResetPassword(req, res) {
    try {
      const { emailOrUsername, otp, newPassword } = req.body;

      if (!emailOrUsername || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const input = emailOrUsername.trim().toLowerCase();
      const inputWithDomain = input.includes('@') ? input : `${input}@vnrvjiet.in`;

      const user = await dbHelper.get(`
        SELECT * FROM users 
        WHERE LOWER(username) = LOWER(?) 
           OR LOWER(email) = LOWER(?) 
           OR LOWER(email) = LOWER(?)
      `, [input, input, inputWithDomain]);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const resetRecord = await dbHelper.get(`
        SELECT * FROM password_resets 
        WHERE user_id = ? AND otp = ?
        ORDER BY id DESC LIMIT 1
      `, [user.id, otp.trim()]);

      if (!resetRecord) {
        return res.status(400).json({ error: 'Invalid verification OTP code. Please check and try again.' });
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Verification OTP has expired. Please request a new OTP.' });
      }

      // Update password
      const newHash = await bcrypt.hash(newPassword, 10);
      await dbHelper.run(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newHash, user.id]
      );

      // Clean up used OTP
      await dbHelper.run("DELETE FROM password_resets WHERE user_id = ?", [user.id]);

      // Log activity
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [user.id, 'Password Reset via OTP', user.department_id, JSON.stringify({ email: user.email })]
      );

      res.json({
        success: true,
        message: 'Password has been reset successfully! You can now log in with your new password.'
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  },

  async me(req, res) {
    try {
      const user = await dbHelper.get(`
        SELECT u.id, u.full_name, u.username, u.email, u.status, u.avatar_url,
               u.role_id, r.name as role_name,
               u.department_id, d.name as department_name, d.code as department_code,
               u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `, [req.user.id]);

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { full_name, email, avatar_url } = req.body;
      const userId = req.user.id;

      if (!full_name || !email) {
        return res.status(400).json({ error: 'Full name and email are required.' });
      }

      // Check email collision
      const existing = await dbHelper.get(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
        [email.trim(), userId]
      );
      if (existing) {
        return res.status(400).json({ error: 'Email is already in use by another account.' });
      }

      await dbHelper.run(
        "UPDATE users SET full_name = ?, email = ?, avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [full_name.trim(), email.trim(), avatar_url || null, userId]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [userId, 'Profile Updated', req.user.department_id, JSON.stringify({ full_name, email })]
      );

      res.json({ message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      const user = await dbHelper.get("SELECT password_hash FROM users WHERE id = ?", [userId]);
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await dbHelper.run(
        "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newHash, userId]
      );

      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [userId, 'Password Changed', req.user.department_id, JSON.stringify({})]
      );

      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  },

  async logout(req, res) {
    try {
      await dbHelper.run(
        "INSERT INTO activity_logs (user_id, action, department_id, metadata) VALUES (?, ?, ?, ?)",
        [req.user.id, 'User Logout', req.user.department_id, JSON.stringify({})]
      );
      res.json({ message: 'Logged out successfully.' });
    } catch (error) {
      res.json({ message: 'Logged out successfully.' });
    }
  }
};

module.exports = authController;
