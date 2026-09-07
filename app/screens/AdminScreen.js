import { ThemedText } from '@/components/themed-text';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_BASE_URL } from '../../config/api';

export default function AdminScreen({ onBack, currentUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' | 'edit'
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });

  const API_BASE = API_BASE_URL;

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.backButtonTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
            <ThemedText style={styles.backButtonText}>← Quay lại</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.deniedContainer}>
          <View style={styles.deniedIcon}><ThemedText style={styles.deniedIconText}>🚫</ThemedText></View>
          <ThemedText style={styles.deniedTitle}>Truy Cập Bị Từ Chối</ThemedText>
          <ThemedText style={styles.deniedSubtitle}>Bạn không có quyền truy cập trang này</ThemedText>
        </View>
      </ScrollView>
    );
  }


  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users.php`);
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Data:', data);
      if (data.status === 'success') {
        setUsers(data.users);
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể tải danh sách user');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối server!');
      console.log('Fetch error:', err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' });
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    if (type === 'edit' && user) setFormData({ ...user, password: '' });
    else resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Lỗi', 'Điền đầy đủ thông tin!');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/add_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        Alert.alert('Thành công', 'Đã thêm user mới!');
        fetchUsers();
        closeModal();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối server!');
    }
  };

  const handleEditUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/edit_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...formData })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Alert.alert('Thành công', 'Cập nhật user thành công!');
        fetchUsers();
        closeModal();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối server!');
    }
  };

  const handleDeleteUser = (user) => {
    if (user.email === currentUser.email) {
      Alert.alert('Lỗi', 'Không thể xóa chính mình!');
      return;
    }
    Alert.alert('Xác nhận', `Xóa user ${user.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE}/delete_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id })
          });
          const data = await res.json();
          if (data.status === 'success') {
            Alert.alert('Đã xóa user!');
            fetchUsers();
          } else {
            Alert.alert('Lỗi', data.message);
          }
        } catch {
          Alert.alert('Lỗi', 'Không thể kết nối server!');
        }
      }}
    ]);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header & Back Button */}
      <View style={styles.backButtonTop}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <ThemedText style={styles.backButtonText}>← Quay lại</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Admin Panel</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Quản lý hệ thống người dùng</ThemedText>
      </View>

      {/* Controls */}
      <View style={styles.controlsCard}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6B7280"
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal('add')} activeOpacity={0.85}>
          <ThemedText style={styles.addButtonText}>➕ Thêm User Mới</ThemedText>
        </TouchableOpacity>
      </View>

      {/* User count */}
      <View style={styles.countRow}>
        <ThemedText style={styles.countText}>{filteredUsers.length} người dùng</ThemedText>
      </View>

      {/* User list */}
      <View style={styles.usersSection}>
        {filteredUsers.map(u => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{u.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>{u.name}</ThemedText>
              <ThemedText style={styles.userEmail}>{u.email}</ThemedText>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser]}>
                  <Text style={[styles.badgeText, { color: u.role === 'admin' ? '#fbbf24' : '#60a5fa' }]}>
                    {u.role.toUpperCase()}
                  </Text>
                </View>
                {u.status && (
                  <View style={[styles.badge, u.status === 'active' ? styles.badgeActive : styles.badgeBanned]}>
                    <Text style={[styles.badgeText, { color: u.status === 'active' ? '#4ade80' : '#f87171' }]}>
                      {u.status === 'active' ? 'ACTIVE' : 'BANNED'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity onPress={() => openModal('edit', u)} style={styles.actionButton} activeOpacity={0.7}>
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteUser(u)}
                disabled={u.email === currentUser.email}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionButtonText, u.email === currentUser.email && { opacity: 0.3 }]}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>Không tìm thấy người dùng nào</ThemedText>
          </View>
        )}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalType === 'add' ? '➕ Thêm User' : '✏️ Sửa User'}</Text>

            <Text style={styles.fieldLabel}>Tên</Text>
            <TextInput style={styles.modalInput} placeholder="Nhập tên" value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} placeholderTextColor="#6B7280" />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.modalInput} placeholder="Nhập email" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} placeholderTextColor="#6B7280" autoCapitalize="none" />

            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput style={styles.modalInput} placeholder={modalType === 'edit' ? 'Để trống nếu không đổi' : 'Nhập password'} value={formData.password} onChangeText={t => setFormData({ ...formData, password: t })} placeholderTextColor="#6B7280" secureTextEntry />

            {/* Role select */}
            <View style={styles.dropdown}>
              <Text style={styles.dropdownLabel}>Quyền</Text>
              <TouchableOpacity
                style={styles.dropdownItem}
                activeOpacity={0.8}
                onPress={() =>
                  setFormData({
                    ...formData,
                    role: formData.role === 'admin' ? 'user' : 'admin'
                  })
                }
              >
                <Text style={styles.dropdownText}>
                  {formData.role === 'admin' ? '👑 Admin' : '👤 User'}
                </Text>
                <Text style={styles.dropdownHint}>Chạm để đổi</Text>
              </TouchableOpacity>
            </View>

            {/* Status select */}
            <View style={styles.dropdown}>
              <Text style={styles.dropdownLabel}>Trạng thái</Text>
              <TouchableOpacity
                style={styles.dropdownItem}
                activeOpacity={0.8}
                onPress={() =>
                  setFormData({
                    ...formData,
                    status: formData.status === 'active' ? 'banned' : 'active'
                  })
                }
              >
                <Text style={[styles.dropdownText, { color: formData.status === 'active' ? '#4ade80' : '#f87171' }]}>
                  {formData.status === 'active' ? '✓ Active' : '✕ Banned'}
                </Text>
                <Text style={styles.dropdownHint}>Chạm để đổi</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={modalType === 'add' ? handleAddUser : handleEditUser}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Styles giữ nguyên
const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#0B0F1A' },
  backButtonTop: { paddingHorizontal: 20, paddingTop: 20 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#1E2433', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  backButtonText: { color: '#4A90E2', fontWeight: '600' },
  header: { alignItems: 'center', paddingVertical: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  deniedContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 30 },
  deniedIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(229,72,77,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  deniedIconText: { fontSize: 40 },
  deniedTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  deniedSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  controlsCard: { marginHorizontal: 20, marginBottom: 6 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E2433', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, marginBottom: 14 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 12, fontSize: 15 },
  addButton: { backgroundColor: '#4A90E2', paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#4A90E2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  countRow: { paddingHorizontal: 22, marginBottom: 10 },
  countText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },

  usersSection: { paddingHorizontal: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151A26', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  userAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1E2433', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  userAvatarText: { color: '#4A90E2', fontWeight: '700', fontSize: 17 },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  userEmail: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeAdmin: { backgroundColor: 'rgba(251,191,36,0.12)' },
  badgeUser: { backgroundColor: 'rgba(96,165,250,0.12)' },
  badgeActive: { backgroundColor: 'rgba(74,222,128,0.12)' },
  badgeBanned: { backgroundColor: 'rgba(248,113,113,0.12)' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  userActions: { flexDirection: 'row', gap: 4 },
  actionButton: { padding: 10 },
  actionButtonText: { fontSize: 17 },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyStateText: { color: '#6B7280', fontSize: 14 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalCard: { backgroundColor: '#151A26', width: '88%', padding: 22, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16 },
  modalTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 18, textAlign: 'center' },
  fieldLabel: { color: '#C9CDD6', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  modalInput: { backgroundColor: '#1E2433', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', fontSize: 14 },
  dropdown: { marginBottom: 14 },
  dropdownLabel: { color: '#C9CDD6', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E2433', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dropdownText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dropdownHint: { color: '#6B7280', fontSize: 11 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  saveButton: { flex: 1, backgroundColor: '#4A90E2', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelButton: { flex: 1, backgroundColor: 'transparent', paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cancelButtonText: { color: '#C9CDD6', fontWeight: '700', fontSize: 15 },
});