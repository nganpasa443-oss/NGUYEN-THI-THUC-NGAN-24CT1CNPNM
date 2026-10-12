// Hook dùng để tạo state và side effect
import { useState, useEffect } from 'react';

// Các module giao diện
import { Alert, StyleSheet, View } from 'react-native';

// Import API config
import { API_BASE_URL } from '../config/api';

// Import các screen của ứng dụng
import AccountScreen from './screens/AccountScreen';
import AdminScreen from './screens/AdminScreen';
import CreateNoteScreen from './screens/CreateNoteScreen';
import EditNoteScreen from './screens/EditNoteScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

export default function App() {

  // currentScreen: màn hình đang hiển thị
  const [currentScreen, setCurrentScreen] = useState('login');

  // user: thông tin người dùng đã đăng nhập (null nếu chưa đăng nhập)
  const [user, setUser] = useState(null);

  // notes: danh sách ghi chú
  const [notes, setNotes] = useState([]);

  // editingNote: ghi chú đang chỉnh sửa
  const [editingNote, setEditingNote] = useState(null);

  const fetchNotes = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data || []);
      }
    } catch (error) {
      console.log('Lỗi tải ghi chú từ server:', error);
    }
  };

  // Tải ghi chú từ server mỗi khi vào màn hình Home
  useEffect(() => {
    if (user && user.id && currentScreen === 'home') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotes(user.id);
    }
  }, [user, currentScreen]);

  // ============================
  // CHUYỂN MÀN HÌNH
  // ============================
  const navigateToScreen = (screen, data = null) => {

    // Kiểm tra quyền truy cập Admin
    if (screen === 'admin' && (!user || user.role !== 'admin')) {
      Alert.alert('Không có quyền', 'Bạn không có quyền truy cập trang Admin.');
      return;
    }

    // Nếu chuyển sang EditNote thì lưu ghi chú cần sửa
    if (data) setEditingNote(data);

    // Cập nhật màn hình hiện tại
    setCurrentScreen(screen);
  };

  // ============================
  // XỬ LÝ ĐĂNG NHẬP
  // ============================
  const handleLoginSuccess = (userData) => {
    console.log('Đăng nhập thành công:', userData);

    // Lưu user
    setUser(userData);

    // Nếu role = admin thì chuyển vào trang admin
    if (userData.role && userData.role.toLowerCase() === 'admin') {
      setCurrentScreen('admin');
      console.log('userData', userData);
    } else {
      // Còn lại là người dùng thường
      setCurrentScreen('home');
    }
  };

  // ============================
  // XỬ LÝ ĐĂNG KÝ
  // ============================
  const handleRegisterSuccess = (userData) => {
    setUser(userData);        
    setCurrentScreen('home');

    Alert.alert(
      'Chào mừng!',
      `Xin chào ${userData.name}! Bạn đã đăng ký thành công.`
    );
  };

  // ============================
  // ĐĂNG XUẤT
  // ============================
  const handleLogout = () => {
    setUser(null);
    setNotes([]);
    setCurrentScreen('login');
  };

  // ============================
  // THÊM GHI CHÚ
  // ============================
  const handleSaveNote = (noteData) => {
    const newNote = {
      id: Date.now(),                   // Tạo id bằng timestamp
      ...noteData,                      // Tiêu đề + nội dung
      createdAt: new Date().toLocaleDateString(),
    };

    setNotes([...notes, newNote]);
    setCurrentScreen('home');
  };

  // ============================
  // CẬP NHẬT GHI CHÚ
  // ============================
  const handleUpdateNote = async (noteData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
      if (!response.ok) {
        Alert.alert('Lỗi', 'Không thể cập nhật ghi chú trên server!');
      }
    } catch (error) {
      console.log('Lỗi cập nhật note:', error);
    }

    setNotes(
      notes.map(note =>
        note.id === editingNote.id
          ? { ...note, ...noteData }
          : note
      )
    );

    setCurrentScreen('home');
  };

  // ============================
  // XÓA GHI CHÚ
  // ============================
  const handleDeleteNote = (noteId) => {
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
                method: 'DELETE'
              });
              if (!response.ok) {
                Alert.alert('Lỗi', 'Không thể xóa ghi chú trên server!');
              }
            } catch (error) {
              console.log('Lỗi xóa note:', error);
            }
            setNotes(notes.filter(note => note.id !== noteId));
          }
        }
      ]
    );
  };

  // ============================
  // CẬP NHẬT TÀI KHOẢN
  // ============================
  const handleUpdateAccount = (newData) => {
    setUser({ ...user, ...newData });
    Alert.alert('Thành công', 'Cập nhật tài khoản thành công!');
  };

  // ============================
  // XÓA TÀI KHOẢN
  // ============================
  const handleDeleteAccount = async () => {
    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin tài khoản!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/delete_user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      });
      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert('Thành công', 'Tài khoản của bạn đã được xóa!');
        handleLogout();
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể xóa tài khoản!');
      }
    } catch (error) {
      console.log('Lỗi xóa tài khoản:', error);
      Alert.alert('Lỗi', 'Không thể kết nối server để xóa tài khoản!');
    }
  };

  // ============================
  // HIỂN THỊ MÀN HÌNH TƯƠNG ỨNG
  // ============================
  const renderScreen = () => {
    switch (currentScreen) {

      case 'login':
        return (
          <LoginScreen
            onLogin={handleLoginSuccess}
            onRegister={() => navigateToScreen('register')}
            onForgotPassword={() => navigateToScreen('forgotPassword')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onRegister={handleRegisterSuccess}
            onBackToLogin={() => navigateToScreen('login')}
          />
        );

      case 'forgotPassword':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => navigateToScreen('login')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            notes={notes}
            onCreateNote={() => navigateToScreen('createNote')}
            onEditNote={(note) => navigateToScreen('editNote', note)}
            onDeleteNote={handleDeleteNote}
            onAccount={() => navigateToScreen('account')}
            user={user}
          />
        );

      case 'account':
        return (
          <AccountScreen
            user={user}
            onBack={() => navigateToScreen('home')}
            onLogout={handleLogout}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        );

      case 'admin':
        return (
          <AdminScreen
            currentUser={user}
            onBack={() => navigateToScreen('home')}
          />
        );

      case 'createNote':
  return <CreateNoteScreen 
            userId={user?.id}        // FIX: truyền userId xuống màn tạo note
            onSave={handleSaveNote} 
            onBack={() => navigateToScreen('home')} 
         />;

      case 'editNote':
        return (
          <EditNoteScreen
            note={editingNote}
            onSave={handleUpdateNote}
            onBack={() => navigateToScreen('home')}
          />
        );

      default:
        return (
          <LoginScreen
            onLogin={handleLoginSuccess}
            onRegister={() => navigateToScreen('register')}
            onForgotPassword={() => navigateToScreen('forgotPassword')}
          />
        );
    }
  };

  // ============================
  // RENDER APP
  // ============================
  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
