# Notes App 📝 - Hệ thống Quản lý Ghi chú Đa nền tảng

Ứng dụng quản lý ghi chú hiện đại được xây dựng với kiến trúc **Fullstack**: Frontend Mobile kết nối Backend RESTful API và Cơ sở dữ liệu **MySQL**.

---

## 🏗️ Kiến trúc hệ thống (System Architecture)

```mermaid
flowchart TD
    subgraph Client ["📱 Frontend (Mobile App)"]
        ExpoApp["React Native / Expo SDK 54\n(iOS & Android)"]
    end

    subgraph Server ["⚡ Backend API"]
        NodeServer["Node.js / Express Serverless\n(REST API on Vercel)"]
    end

    subgraph Database ["🗄️ Database Layer"]
        MySQL[("MySQL Database\n(Aiven Cloud MySQL 8.0)")]
    end

    subgraph ThirdParty ["☁️ External Services"]
        Cloudinary["Cloudinary CDN\n(Lưu trữ Avatar)"]
        GmailSMTP["Gmail SMTP / Nodemailer\n(Gửi mã OTP khôi phục mật khẩu)"]
    end

    ExpoApp -->|HTTPS / JSON REST API| NodeServer
    NodeServer -->|mysql2 Connection Pool SSL| MySQL
    NodeServer -->|Upload / Fetch Avatars| Cloudinary
    NodeServer -->|Gửi mã xác thực OTP| GmailSMTP
```

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend:**
  - [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 54)
  - React Navigation, Vector Icons, Print (PDF Export), Notifications
- **Backend:**
  - [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
  - Thư viện kết nối CSDL: `mysql2` (Connection Pool Serverless)
  - Mã hóa bảo mật: MD5 / Crypto
  - Dịch vụ email: `nodemailer` (Gmail SMTP)
- **Cơ sở dữ liệu (Database):**
  - **MySQL 8.0** lưu trữ trên [Aiven Cloud Database](https://aiven.io/)
  - File lược đồ CSDL: [`schema.sql`](./schema.sql)
- **Lưu trữ đám mây & Triển khai:**
  - [Vercel](https://vercel.com/) (Serverless Deployment)
  - [Cloudinary](https://cloudinary.com/) (Quản lý hình ảnh đại diện)

---

## 🗄️ Lược đồ Cơ sở dữ liệu MySQL (Database Schema)

Dự án sử dụng cơ sở dữ liệu quan hệ **MySQL** với các bảng chính:

```mermaid
erDiagram
    users ||--o{ notes : "sở hữu (1:N)"
    users ||--o{ password_resets : "yêu cầu OTP"
    
    users {
        int id PK "Khóa chính tự tăng"
        string name "Họ và tên"
        string email UK "Email duy nhất"
        string password "Mật khẩu mã hóa"
        enum role "user / admin"
        enum status "active / inactive"
        text profile_image "URL Cloudinary"
        datetime last_login "Lần đăng nhập cuối"
    }

    notes {
        int id PK "Khóa chính tự tăng"
        int user_id FK "Khóa ngoại tham chiếu users(id)"
        string title "Tiêu đề ghi chú"
        text content "Nội dung ghi chú"
        datetime reminder_time "Thời gian nhắc nhở"
        timestamp created_at "Thời gian tạo"
    }

    password_resets {
        string email PK "Email người dùng"
        string code "Mã OTP 6 số"
        datetime expires_at "Thời hạn mã OTP"
    }
```

Chi tiết các câu lệnh DDL và Stored Procedures nằm trong file [`schema.sql`](./schema.sql).

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Khởi chạy ứng dụng Mobile (Expo)
```bash
npx expo start
```

### 3. Khởi chạy Backend cục bộ (Tùy chọn)
```bash
node backend/server.js
```
*(Backend hiện tại đã được triển khai tự động trực tuyến 24/7 trên Vercel).*
