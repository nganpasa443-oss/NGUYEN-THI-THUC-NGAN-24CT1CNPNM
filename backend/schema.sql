-- notes_app.sql - Database Schema cho Notes App
-- Tạo database
-- DROP DATABASE IF EXISTS defaultdb;
-- CREATE DATABASE IF NOT EXISTS defaultdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE defaultdb;

-- Xóa tables cũ nếu có
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

-- =====================================================
-- Table: users - Quản lý người dùng
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    profile_image TEXT,
    registered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: notes - Quản lý ghi chú
-- =====================================================
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    reminder_time DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: password_resets - Lưu mã OTP khôi phục mật khẩu
-- =====================================================
CREATE TABLE IF NOT EXISTS password_resets (
    email VARCHAR(100) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert dữ liệu mẫu
-- =====================================================

-- Insert Users (password đã mã hóa MD5 đơn giản, thực tế nên dùng bcrypt)
INSERT INTO users (name, email, password, role, status, registered_date, last_login) VALUES
('Demo User', 'demo@example.com', MD5('123456'), 'user', 'active', NOW(), NOW()),
('Admin User', 'admin@example.com', MD5('admin123'), 'admin', 'active', NOW(), NOW()),
('Lan Hương', 'lanhuong23@gmail.com', MD5('lanhuong123456'), 'user', 'active', '2024-01-19 10:30:00', '2024-01-19 10:30:00'),
('Thục Ngân', 'tngan705@gmail.com', MD5('thucngan123456'), 'user', 'active', '2024-01-18 14:20:00', '2024-01-18 14:20:00'),
('Test 11', 'test@example.com', MD5('test123'), 'user', 'inactive', NOW(), NULL);

-- Insert Notes mẫu
INSERT INTO notes (user_id, title, content, created_at) VALUES
(1, 'Ghi chú đầu tiên', 'Đây là nội dung ghi chú đầu tiên của tôi. Rất đơn giản và dễ sử dụng!', '2024-01-15 09:00:00'),
(1, 'Danh sách mua sắm', 'Cần mua:\n- Sữa\n- Bánh mì\n- Trứng\n- Rau củ', '2024-01-16 10:30:00'),
(1, 'Ý tưởng dự án', 'Phát triển ứng dụng quản lý công việc với:\n1. Todo list\n2. Calendar\n3. Reminder\n4. Team collaboration', '2024-01-17 14:20:00'),
(2, 'Meeting Notes', 'Cuộc họp với team:\n- Deadline: 30/01\n- Tasks assigned\n- Next meeting: 25/01', '2024-01-18 11:00:00'),
(3, 'Travel Plan', 'Kế hoạch du lịch Đà Nẵng:\n- Khách sạn: Sea View Hotel\n- Thời gian: 3 ngày 2 đêm\n- Điểm tham quan: Bà Nà, Hội An, Bãi biển Mỹ Khê', '2024-01-19 16:45:00');

-- =====================================================
-- Views hữu ích
-- =====================================================

-- View: Thống kê users
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    role,
    status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_last_7_days,
    COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_last_30_days
FROM users
GROUP BY role, status;

-- View: Thống kê notes theo user
CREATE OR REPLACE VIEW notes_by_user AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    COUNT(n.id) as total_notes,
    MAX(n.created_at) as last_note_created
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.name, u.email;

-- View: Notes gần đây
CREATE OR REPLACE VIEW recent_notes AS
SELECT 
    n.id,
    n.title,
    n.content,
    n.created_at,
    n.updated_at,
    u.name as author_name,
    u.email as author_email
FROM notes n
INNER JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;

-- =====================================================
-- Stored Procedures
-- =====================================================

-- Procedure: Tạo user mới
DROP PROCEDURE IF EXISTS create_user;
DELIMITER //
CREATE PROCEDURE create_user(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_role ENUM('user', 'admin')
)
BEGIN
    INSERT INTO users (name, email, password, role, registered_date)
    VALUES (p_name, p_email, MD5(p_password), p_role, NOW());
    
    SELECT LAST_INSERT_ID() as user_id;
END //
DELIMITER ;

-- Procedure: Tạo note mới
DROP PROCEDURE IF EXISTS create_note;
DELIMITER //
CREATE PROCEDURE create_note(
    IN p_user_id INT,
    IN p_title VARCHAR(200),
    IN p_content TEXT
)
BEGIN
    INSERT INTO notes (user_id, title, content)
    VALUES (p_user_id, p_title, p_content);
    
    SELECT LAST_INSERT_ID() as note_id;
END //
DELIMITER ;

-- Procedure: Lấy notes của user
DROP PROCEDURE IF EXISTS get_user_notes;
DELIMITER //
CREATE PROCEDURE get_user_notes(IN p_user_id INT)
BEGIN
    SELECT 
        id,
        title,
        content,
        created_at,
        updated_at
    FROM notes
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END //
DELIMITER ;
