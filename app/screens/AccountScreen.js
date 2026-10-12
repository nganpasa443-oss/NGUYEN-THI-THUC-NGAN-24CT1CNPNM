// screens/AccountScreen.js
import * as Print from 'expo-print';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AccountScreen({ 
  user, 
  onBack, 
  onLogout, 
  onUpdateAccount, 
  onDeleteAccount 
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Cập nhật giao diện mỗi giây để hiển thị thời gian chạy như đồng hồ
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRegisteredDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `(${day}/${month}/${year} - ${hours}:${minutes}:${seconds})`;
  };

  const calculateAccountAge = () => {
    let createdTime = null;

    if (user?.createdAt) {
      createdTime = new Date(user.createdAt).getTime();
    } else if (user?.registeredDate) {
      createdTime = new Date(user.registeredDate).getTime();
    }

    if (!createdTime) return { text: 'Không xác định', detailed: 'Thông tin ngày tạo không có sẵn' };

    const diffMs = currentTime - createdTime;
    if (diffMs < 0) return { text: 'Vừa xong', detailed: 'Vừa xong' };

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    let detailed = '';
    if (days > 0) detailed += `${days} ngày, `;
    detailed += `${hh} giờ, ${mm} phút, ${ss} giây`;

    const text = days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;

    return { text, detailed };
  };

  const accountAge = calculateAccountAge();
  const formattedRegisteredDate = formatRegisteredDate(user?.registeredDate);

  const handleUpdateAccount = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    onUpdateAccount({ name: editName.trim(), email: editEmail.trim() });
    setShowEditModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: onLogout }
      ]
    );
  };

  const convertImageToBase64 = async (imageUrl) => {
    if (!imageUrl) return null;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const createPDFContent = (profileImageBase64) => {
    const currentDate = new Date().toLocaleDateString('vi-VN');
    const currentTime = new Date().toLocaleTimeString('vi-VN');
    const accountAgeInfo = calculateAccountAge();

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thông tin tài khoản - ${user?.name}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    margin: 0;
    padding: 32px 16px;
    background: #f4f6fb;
    color: #2c2f36;
    line-height: 1.6;
  }
  .container { max-width: 640px; margin: 0 auto; }

  .header {
    text-align: center;
    margin-bottom: 24px;
  }
  .logo {
    font-size: 22px;
    font-weight: 700;
    color: #4a5cff;
  }
  .subtitle { color: #8a8f9c; font-size: 14px; margin-top: 4px; }

  .export-info {
    background: #eef1ff;
    color: #4a5cff;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 20px;
    text-align: center;
  }

  /* Hero card */
  .hero {
    background: linear-gradient(135deg, #6a7bff 0%, #8a5cf6 100%);
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
    color: white;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(106, 123, 255, 0.25);
  }
  .avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    margin: 0 auto 16px;
    border: 3px solid rgba(255,255,255,0.7);
    object-fit: cover;
    display: block;
  }
  .avatar-placeholder {
    width: 88px; height: 88px;
    border-radius: 50%;
    margin: 0 auto 16px;
    background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 34px;
    border: 3px solid rgba(255,255,255,0.7);
  }
  .hero-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .hero-email { font-size: 14px; opacity: 0.9; }

  .age-badge {
    display: inline-block;
    margin-top: 16px;
    padding: 8px 18px;
    background: rgba(255,255,255,0.18);
    border-radius: 999px;
    font-size: 14px;
  }
  .age-badge b { font-size: 16px; }

  /* Info cards */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .info-card {
    background: white;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .info-card .icon { font-size: 20px; margin-bottom: 6px; }
  .info-card .label { font-size: 12px; color: #8a8f9c; margin-bottom: 4px; }
  .info-card .value { font-size: 14px; font-weight: 600; color: #2c2f36; word-break: break-word; }

  .stats-section {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  .stat-item {
    flex: 1;
    text-align: center;
    padding: 18px 8px;
    background: white;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .stat-number { font-size: 22px; font-weight: 700; color: #4a5cff; display: block; }
  .stat-label { font-size: 12px; color: #8a8f9c; margin-top: 4px; }

  .footer {
    text-align: center;
    padding-top: 16px;
    font-size: 12px;
    color: #a0a4b0;
  }

  @media (max-width: 420px) {
    .info-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="logo">📝 Notes App</div>
    <div class="subtitle">Thông tin tài khoản của bạn</div>
  </div>

  <div class="export-info">
    Báo cáo được tạo lúc ${currentTime}, ${currentDate}
  </div>

  <div class="hero">
    ${profileImageBase64
      ? `<img src="${profileImageBase64}" class="avatar" alt="Profile">`
      : `<div class="avatar-placeholder">👤</div>`}
    <div class="hero-name">Xin chào, ${user?.name || 'bạn'}!</div>
    <div class="hero-email">${user?.email || 'Chưa cập nhật email'}</div>
    <div class="age-badge">🎉 Đồng hành cùng bạn <b>${accountAgeInfo.text}</b></div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="icon">🆔</div>
      <div class="label">ID tài khoản</div>
      <div class="value">${user?.id || 'N/A'}</div>
    </div>
    <div class="info-card">
      <div class="icon">📅</div>
      <div class="label">Ngày đăng ký</div>
      <div class="value">${formattedRegisteredDate}</div>
    </div>
    <div class="info-card">
      <div class="icon">⏱️</div>
      <div class="label">Thời gian sử dụng</div>
      <div class="value">${accountAgeInfo.detailed}</div>
    </div>
    <div class="info-card">
      <div class="icon">🖼️</div>
      <div class="label">Ảnh đại diện</div>
      <div class="value">${user?.profileImage ? 'Đã tải lên ✅' : 'Chưa có'}</div>
    </div>
  </div>

  <div class="stats-section">
    <div class="stat-item">
      <span class="stat-number">1</span>
      <div class="stat-label">Tài khoản</div>
    </div>
    <div class="stat-item">
      <span class="stat-number">${user?.profileImage ? '1' : '0'}</span>
      <div class="stat-label">Ảnh Profile</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>📝 Notes App</strong> · Quản lý ghi chú thông minh</p>
    <p>Cảm ơn bạn đã sử dụng ứng dụng!</p>
  </div>

</div>
</body>
</html>`;
  };

  const exportToPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      let profileImageBase64 = '';
      if (user?.profileImage?.uri) {
        profileImageBase64 = await convertImageToBase64(user.profileImage.uri);
      }
      const htmlContent = createPDFContent(profileImageBase64);
      setIsGeneratingPDF(false);

      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      setIsGeneratingPDF(false);
      Alert.alert('Lỗi', 'Không thể tạo file PDF: ' + (error.message || ''));
    }
  };

  const previewPDF = async () => {
    Alert.alert(
      'Xem trước PDF',
      'Bạn muốn xem nội dung PDF?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: '📄 Tạo & Xem', onPress: exportToPDF }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Nút quay lại đưa lên đầu, tách khỏi tiêu đề để đỡ rối */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.accountHeader}>
          <ThemedText style={styles.accountTitle}>👤 Tài khoản</ThemedText>
        </View>

        <ThemedView style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage.uri }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <ThemedText style={styles.profilePlaceholderText}>👤</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.name}</ThemedText>
            <ThemedText style={styles.profileEmail}>{user?.email}</ThemedText>
            <ThemedText style={styles.profileID}>ID: {user?.id}</ThemedText>
            {user?.profileImage && (
              <ThemedText style={styles.profileStatus}>✅ Có ảnh profile</ThemedText>
            )}
            <ThemedText style={styles.profileAccountAge}>
              ⏱️ Tài khoản được tạo: {accountAge.detailed}
            </ThemedText>
            <ThemedText style={styles.profileRegisteredDate}>
              Đăng ký từ: {formattedRegisteredDate}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.exportSection}>
          <ThemedText style={styles.exportTitle}>📄 Xuất thông tin</ThemedText>
          <ThemedText style={styles.exportDescription}>
            Xuất thông tin tài khoản (tên, email, ảnh profile, thời gian tài khoản được tạo) thành file PDF
          </ThemedText>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#17a2b8' }]}
              onPress={previewPDF}
              activeOpacity={0.8}
            >
              <Text style={styles.exportButtonText}>👁️ Xem trước PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#28a745', opacity: isGeneratingPDF ? 0.6 : 1 }]}
              onPress={exportToPDF}
              disabled={isGeneratingPDF}
              activeOpacity={0.8}
            >
              <Text style={styles.exportButtonText}>
                {isGeneratingPDF ? "⏳ Đang tạo..." : "📤 Xuất PDF"}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* ⭐ Nút Sửa / Xóa / Đăng xuất - hàng dọc dưới cùng */}
        <ThemedView style={styles.actionSection}>
          <TouchableOpacity
            style={styles.editAccountButton}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.actionButtonText}>✏️ Sửa tài khoản</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa tài khoản?', [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xóa', style: 'destructive', onPress: onDeleteAccount }
            ])}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.actionButtonText}>🗑️ Xóa tài khoản</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.logoutButtonText}>🚪 Đăng xuất</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Sửa tài khoản</ThemedText>
            
            <View style={styles.modalInputContainer}>
              <ThemedText style={styles.modalLabel}>Tên:</ThemedText>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập tên"
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <ThemedText style={styles.modalLabel}>Email:</ThemedText>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
            </View>

            <ThemedText style={styles.modalNote}>
              💡 Lưu ý: Ảnh profile không thể thay đổi từ đây
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleUpdateAccount}
              >
                <Text style={styles.modalButtonTextPrimary}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0202ff' },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 20 },

  backButtonContainer: { marginBottom: 10 },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  backButtonText: { color: '#4da6ff', fontSize: 15, fontWeight: '600' },

  accountHeader: { minHeight: 90, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  accountTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', lineHeight: 34 },

  profileSection: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  profileImageContainer: { marginRight: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#007AFF' },
  profilePlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#007AFF' },
  profilePlaceholderText: { fontSize: 32, color: '#666' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  profileEmail: { fontSize: 14, color: '#ccc', marginBottom: 5 },
  profileID: { fontSize: 14, color: '#ccc', marginBottom: 5 },
  profileStatus: { fontSize: 12, color: '#28a745', fontWeight: '500', marginBottom: 5 },
  profileAccountAge: { fontSize: 12, color: '#ffa500', fontWeight: '500', marginTop: 5 },
  profileRegisteredDate: { fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 3 },

  exportSection: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  exportTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  exportDescription: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  exportButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  exportButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  actionSection: { marginTop: 4, gap: 10 },
  editAccountButton: { backgroundColor: '#007AFF', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  deleteAccountButton: { backgroundColor: '#dc3545', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  logoutButton: { backgroundColor: '#ffc107', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logoutButtonText: { color: '#000', fontWeight: 'bold', fontSize: 15 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', margin: 20, borderRadius: 14, padding: 20, width: '85%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000000' },
  modalInputContainer: { marginBottom: 15 },
  modalLabel: { fontSize: 16, fontWeight: '500', marginBottom: 5, color: '#010101ff' },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fff' },
  modalNote: { fontSize: 12, color: '#666', fontStyle: 'italic', textAlign: 'center', marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  modalButton: { backgroundColor: '#f0f0f0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, minWidth: 80 },
  modalButtonPrimary: { backgroundColor: '#007AFF' },
  modalButtonText: { textAlign: 'center', color: '#333', fontWeight: '500' },
  modalButtonTextPrimary: { textAlign: 'center', color: 'white', fontWeight: '500' },
});