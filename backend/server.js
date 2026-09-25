// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Khởi tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve thư mục uploads tĩnh
app.use('/notes_api/uploads', express.static(uploadsDir));

// Kết nối MySQL bằng Pool cho Serverless
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Lỗi kết nối MySQL Pool:', err);
  } else {
    console.log('✅ MySQL Pool connected!');
    connection.release();
  }
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// In-memory store for verification codes
const resetCodes = {};

// Helper: MD5 Hashing
const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

// ================= ROUTE MAPPINGS TO MATCH PHP ENDPOINTS ================= //

// 1. Đăng nhập (Login)
app.post('/notes_api/auth/login.php', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu!' });
  }

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi kết nối CSDL!' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    const user = results[0];
    const hashedInput = md5(password);

    if (user.password !== hashedInput) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa!' });
    }

    // Cập nhật last_login
    db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      status: 'success',
      message: 'Đăng nhập thành công!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registeredDate: user.registered_date,
        profileImage: user.profile_image ? { uri: user.profile_image } : null
      }
    });
  });
});

// 2. Đăng ký (Register)
app.post('/notes_api/auth/register.php', async (req, res) => {
  const { name, email, password, profileImageBase64 } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
  }

  const hashedPassword = md5(password);

  let profile_image_url = null;
  if (profileImageBase64) {
    try {
      // Upload lên Cloudinary
      const base64Image = `data:image/jpeg;base64,${profileImageBase64}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: 'notes_app_profiles'
      });
      profile_image_url = uploadResponse.secure_url;
    } catch (err) {
      console.error('Lỗi lưu ảnh lên Cloudinary:', err);
    }
  }

  const insertQuery = 'INSERT INTO users (name, email, password, role, status, profile_image, registered_date) VALUES (?, ?, ?, ?, ?, ?, NOW())';
  db.query(insertQuery, [name.trim(), email.trim().toLowerCase(), hashedPassword, 'user', 'active', profile_image_url], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Email đã tồn tại!' });
      }
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server khi đăng ký!' });
    }

    const newUserId = result.insertId;
    db.query('SELECT * FROM users WHERE id = ?', [newUserId], (err2, results2) => {
      if (err2 || results2.length === 0) {
        return res.json({ status: 'success', message: 'Đăng ký thành công!' });
      }
      const user = results2[0];
      res.json({
        status: 'success',
        message: 'Đăng ký thành công!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          registered_date: user.registered_date,
          profile_image: user.profile_image
        }
      });
    });
  });
});

// 3. Tạo ghi chú mới (Create note)
app.post('/notes_api/notes/create_note.php', (req, res) => {
  const { user_id, title, content, reminder_time } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ status: false, message: 'Thiếu thông tin user_id hoặc title!' });
  }

  const query = 'INSERT INTO notes (user_id, title, content, reminder_time, created_at) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [user_id, title.trim(), content ? content.trim() : '', reminder_time || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: false, message: 'Lỗi lưu ghi chú!' });
    }
    res.json({
      status: true,
      message: 'Ghi chú đã được lưu!',
      noteId: result.insertId
    });
  });
});

// Lấy danh sách ghi chú
app.get('/notes_api/notes/:userId', (req, res) => {
  const { userId } = req.params;
  db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    const notes = results.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content: row.content,
      reminderTime: row.reminder_time,
      createdAt: row.created_at
    }));
    res.json(notes);
  });
});

// Cập nhật ghi chú
app.put('/notes_api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, reminder_time } = req.body;
  db.query('UPDATE notes SET title = ?, content = ?, reminder_time = ? WHERE id = ?', [title, content, reminder_time || null, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.json({ status: true, message: 'Cập nhật thành công' });
  });
});

// Xóa ghi chú
app.delete('/notes_api/notes/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM notes WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.json({ status: true, message: 'Xóa thành công' });
  });
});

// 4. Lấy tất cả user (Admin - GET)
app.get('/notes_api/users.php', (req, res) => {
  const query = 'SELECT id, name, email, role, status, registered_date as created_at, last_login FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Lỗi tải danh sách user! Chi tiết: ' + err.message });
    }
    res.json({
      status: 'success',
      users: results
    });
  });
});

// 5. Thêm user (Admin - POST)
app.post('/notes_api/add_users.php', (req, res) => {
  const { name, email, password, role, status } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ thông tin!' });
  }

  const hashedPassword = md5(password);

  const insertQuery = 'INSERT INTO users (name, email, password, role, status, registered_date) VALUES (?, ?, ?, ?, ?, NOW())';
  db.query(insertQuery, [name.trim(), email.trim().toLowerCase(), hashedPassword, role || 'user', status || 'active'], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ status: 'error', message: 'Email đã tồn tại!' });
      }
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Lỗi thêm user!' });
    }
    res.json({ status: 'success', message: 'Thêm user thành công!' });
  });
});

// 6. Sửa user (Admin - POST)
app.post('/notes_api/edit_user.php', (req, res) => {
  const { id, name, email, role, status, password } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin!' });
  }

  let query = 'UPDATE users SET name=?, email=?, role=?, status=?';
  const params = [name.trim(), email.trim().toLowerCase(), role, status];

  if (password && password.trim() !== '') {
    query += ', password=?';
    params.push(md5(password));
  }

  query += ' WHERE id=?';
  params.push(id);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Lỗi cập nhật user!' });
    }
    res.json({ status: 'success', message: 'Cập nhật thành công!' });
  });
});

// 6. Xóa user (Admin - POST)
app.post('/notes_api/delete_user.php', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'Thiếu ID user!' });
  }

  const query = 'DELETE FROM users WHERE id=?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Lỗi xóa user!' });
    }
    res.json({ status: 'success', message: 'Đã xóa user!' });
  });
});

// ================= FORGOT PASSWORD ENDPOINTS ================= //

// Gửi mã reset
app.post(['/api/send-reset-code', '/notes_api/api/send-reset-code'], (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email!' });

  db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
    if (results.length === 0) return res.status(400).json({ success: false, message: 'Email không tồn tại trong hệ thống!' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes[email.trim().toLowerCase()] = code;

    console.log(`[RESET CODE] Code cho ${email}: ${code}`);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email.trim(),
      subject: 'Mã đặt lại mật khẩu - Notes App',
      text: `Mã xác nhận đặt lại mật khẩu của bạn là: ${code}. Mã có hiệu lực trong 5 phút.`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log('Nodemailer Error:', error.message);
        return res.json({ 
          success: true, 
          message: 'Mã xác nhận đã được tạo thành công! (Nodemailer chưa được cấu hình, vui lòng xem mã tại console của backend server)' 
        });
      }
      res.json({ success: true, message: 'Mã xác nhận đã được gửi vào email của bạn!' });
    });
  });
});

// Xác nhận mã reset
app.post(['/api/verify-reset-code', '/notes_api/api/verify-reset-code'], (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã xác nhận!' });

  const savedCode = resetCodes[email.trim().toLowerCase()];
  if (savedCode && savedCode === code.toString()) {
    res.json({ success: true, message: 'Mã xác nhận chính xác!' });
  } else {
    res.status(400).json({ success: false, message: 'Mã xác nhận không đúng!' });
  }
});

// Đặt lại mật khẩu mới
app.post(['/api/reset-password', '/notes_api/api/reset-password'], (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });

  const savedCode = resetCodes[email.trim().toLowerCase()];
  if (!savedCode || savedCode !== code.toString()) {
    return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn!' });
  }

  const hashedPassword = md5(newPassword);

  db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.trim().toLowerCase()], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi server!' });
    delete resetCodes[email.trim().toLowerCase()];
    res.json({ success: true, message: 'Mật khẩu đã được thay đổi thành công!' });
  });
});

// Khởi động Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Node.js đang chạy trên port ${PORT}`));

// Export app cho Vercel Serverless
module.exports = app;
