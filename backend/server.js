// server.js
const path = require('path');
const dotenv = require('dotenv');

// Nạp biến môi trường từ backend/.env hoặc root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
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
  timezone: '+07:00',
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Đảm bảo mọi kết nối đến MySQL đều dùng múi giờ chuẩn Việt Nam (UTC+7)
db.on('connection', (connection) => {
  connection.query("SET time_zone = '+07:00';");
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

// Email SMTP credentials (được nạp từ file .env hoặc Vercel Environment Variables)
const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

// Nodemailer setup (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  }
});

// Kiểm tra kết nối SMTP
if (process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_email')) {
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️ Cảnh báo xác thực SMTP:', error.message);
    } else {
      console.log(`✅ Kết nối SMTP thành công! Sẵn sàng gửi email qua ${process.env.EMAIL_USER}`);
    }
  });
} else {
  console.log('ℹ️ SMTP chưa được cấu hình (Cần cập nhật EMAIL_USER và EMAIL_PASS trong .env)');
}

// In-memory store for verification codes
const resetCodes = {};

// Helper: MD5 Hashing
const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

// Helper: Lấy thời gian chuẩn Việt Nam (UTC+7) định dạng 'YYYY-MM-DD HH:mm:ss'
const getVietnamDateTime = () => {
  const now = new Date();
  const vnTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const yyyy = vnTime.getFullYear();
  const mm = String(vnTime.getMonth() + 1).padStart(2, '0');
  const dd = String(vnTime.getDate()).padStart(2, '0');
  const hh = String(vnTime.getHours()).padStart(2, '0');
  const mi = String(vnTime.getMinutes()).padStart(2, '0');
  const ss = String(vnTime.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

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

    const vnNow = getVietnamDateTime();
    // Cập nhật last_login trong database bằng giờ Việt Nam (UTC+7)
    db.query('UPDATE users SET last_login = ? WHERE id = ?', [vnNow, user.id]);

    res.json({
      status: 'success',
      message: 'Đăng nhập thành công!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registeredDate: user.registered_date,
        lastLogin: vnNow,
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

  const vnNow = getVietnamDateTime();
  const insertQuery = 'INSERT INTO users (name, email, password, role, status, profile_image, registered_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(insertQuery, [name.trim(), email.trim().toLowerCase(), hashedPassword, 'user', 'active', profile_image_url, vnNow, vnNow, vnNow], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Email đã tồn tại!' });
      }
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server khi đăng ký!', error: err.message });
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
          registered_date: user.registered_date || vnNow,
          created_at: user.created_at || vnNow,
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

  const vnNow = getVietnamDateTime();
  const query = 'INSERT INTO notes (user_id, title, content, reminder_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [user_id, title.trim(), content ? content.trim() : '', reminder_time || null, vnNow, vnNow], (err, result) => {
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
  const vnNow = getVietnamDateTime();
  db.query('UPDATE notes SET title = ?, content = ?, reminder_time = ?, updated_at = ? WHERE id = ?', [title, content, reminder_time || null, vnNow, id], (err) => {
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
  const vnNow = getVietnamDateTime();
  const insertQuery = 'INSERT INTO users (name, email, password, role, status, registered_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(insertQuery, [name.trim(), email.trim().toLowerCase(), hashedPassword, role || 'user', status || 'active', vnNow, vnNow, vnNow], (err, result) => {
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

  const vnNow = getVietnamDateTime();
  let query = 'UPDATE users SET name=?, email=?, role=?, status=?, updated_at=?';
  const params = [name.trim(), email.trim().toLowerCase(), role, status, vnNow];

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

  const cleanEmail = email.trim().toLowerCase();
  db.query('SELECT id FROM users WHERE email = ?', [cleanEmail], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi server CSDL!' });
    if (results.length === 0) return res.status(400).json({ success: false, message: 'Email không tồn tại trong hệ thống!' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã vào bảng password_resets (hạn 10 phút)
    const saveQuery = 'REPLACE INTO password_resets (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))';
    db.query(saveQuery, [cleanEmail, code], (errDb) => {
      if (errDb) {
        console.error('Lỗi lưu mã OTP vào DB:', errDb);
      }

      console.log(`[RESET CODE] Code cho ${cleanEmail}: ${code}`);

      const mailOptions = {
        from: `"Notes App Support" <${EMAIL_USER}>`,
        to: cleanEmail,
        subject: 'Mã xác nhận đặt lại mật khẩu - Notes App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4A90E2; text-align: center; margin-bottom: 8px;">Notes App</h2>
            <p style="color: #64748b; text-align: center; font-size: 14px; margin-top: 0;">Khôi phục mật khẩu tài khoản</p>
            <hr style="border: none; border-top: 1px solid #edf2f7; margin: 16px 0;" />
            <p style="color: #1e293b; font-size: 15px; line-height: 1.5;">Xin chào,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Bạn vừa yêu cầu mã xác nhận để đặt lại mật khẩu cho tài khoản: <strong>${cleanEmail}</strong>.</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #4A90E2; background-color: #F0F7FF; padding: 12px 28px; border-radius: 8px; border: 1.5px dashed #4A90E2;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Mã xác nhận này có hiệu lực trong vòng <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo đảm an toàn.</p>
            <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          </div>
        `,
        text: `Mã xác nhận đặt lại mật khẩu của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Lỗi gửi email qua SMTP:', error.message);
          return res.status(500).json({ 
            success: false, 
            message: `Không thể gửi email: ${error.message}. Vui lòng kiểm tra lại cấu hình SMTP!` 
          });
        }
        console.log(`✅ Đã gửi mã OTP đến ${cleanEmail}: ${info.messageId}`);
        res.json({ success: true, message: 'Mã xác nhận đã được gửi vào hộp thư email của bạn!' });
      });
    });
  });
});

// Xác nhận mã reset
app.post(['/api/verify-reset-code', '/notes_api/api/verify-reset-code'], (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã xác nhận!' });

  const cleanEmail = email.trim().toLowerCase();
  const verifyQuery = 'SELECT * FROM password_resets WHERE email = ? AND code = ? AND expires_at > NOW()';
  db.query(verifyQuery, [cleanEmail, code.toString().trim()], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi server CSDL!' });
    if (results.length > 0) {
      res.json({ success: true, message: 'Mã xác nhận chính xác!' });
    } else {
      res.status(400).json({ success: false, message: 'Mã xác nhận không đúng hoặc đã hết hạn!' });
    }
  });
});

// Đặt lại mật khẩu mới
app.post(['/api/reset-password', '/notes_api/api/reset-password'], (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });

  const cleanEmail = email.trim().toLowerCase();
  const verifyQuery = 'SELECT * FROM password_resets WHERE email = ? AND code = ? AND expires_at > NOW()';
  db.query(verifyQuery, [cleanEmail, code.toString().trim()], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi server CSDL!' });
    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn!' });
    }

    const hashedPassword = md5(newPassword);

    db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, cleanEmail], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu!' });
      db.query('DELETE FROM password_resets WHERE email = ?', [cleanEmail]);
      res.json({ success: true, message: 'Mật khẩu đã được thay đổi thành công!' });
    });
  });
});

// Khởi động Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Node.js đang chạy trên port ${PORT}`));

// Export app cho Vercel Serverless
module.exports = app;
