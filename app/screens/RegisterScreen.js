import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { API_BASE_URL } from '../../config/api';

const BACKEND_URL = `${API_BASE_URL}/auth/register.php`;


export default function RegisterScreen({ onRegister, onBackToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh!');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });
    if (!result.canceled) setProfileImage(result.assets[0]);
  };

  const takePictureWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Lỗi', 'Cần quyền truy cập camera!');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });
    if (!result.canceled) setProfileImage(result.assets[0]);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Chọn ảnh profile',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: '📷 Chụp ảnh', onPress: takePictureWithCamera },
        { text: '🖼️ Thư viện', onPress: pickImageFromLibrary }
      ]
    );
  };

  const removeProfileImage = () => setProfileImage(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!');
    }
    if (name.trim().length < 2) return Alert.alert('Lỗi', 'Tên phải có ít nhất 2 ký tự!');
    if (!isValidEmail(email)) return Alert.alert('Lỗi', 'Email không hợp lệ!');
    if (password.length < 6) return Alert.alert('Lỗi', 'Mật khẩu phải ít nhất 6 ký tự!');
    if (password !== confirmPassword) return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);

      if (profileImage) {
        formData.append('profile_image', {
          uri: profileImage.uri,
          name: profileImage.uri.split('/').pop(),
          type: 'image/jpeg'
        });
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          profileImageBase64: profileImage ? profileImage.base64 : null
        })
      });

      const text = await response.text();
      console.log('📌Server trả về:', text);
      let data;
      try { data = JSON.parse(text); } 
      catch { throw new Error('Server trả về dữ liệu không hợp lệ:\n' + text); }

      if (data.status === 'success' && data.user) {
        // ⭐ Map profileImage và registeredDate để AccountScreen hiển thị đúng
        const userWithFullData = {
          ...data.user,
          profileImage: data.user.profile_image 
            ? { 
                uri: (() => {
                  const imgUri = data.user.profile_image;
                  return imgUri.startsWith('http') || imgUri.startsWith('file://') || imgUri.startsWith('data:')
                    ? imgUri
                    : `${API_BASE_URL}/${imgUri}`;
                })()
              } 
            : null,
          registeredDate: data.user.registered_date || null
        };

        Alert.alert('Thành công', data.message || 'Đăng ký thành công!', [
          { text: 'Đăng nhập ngay', onPress: () => onRegister(userWithFullData) }
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Đăng ký thất bại!');
      }

    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể kết nối server!');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setProfileImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0B0F1A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.mainTitle}>Đăng Ký Tài Khoản</ThemedText>
          <ThemedText style={styles.subtitle}>Tạo tài khoản mới để bắt đầu</ThemedText>
        </ThemedView>

        <View style={styles.card}>
          <ThemedView style={styles.imageContainer}>
            <View style={styles.imageUploadSection}>
              {profileImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: profileImage.uri }} style={styles.imagePreview} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.imageActionButton} onPress={showImagePickerOptions} activeOpacity={0.8}>
                      <ThemedText style={styles.imageActionText}>🔄 Thay đổi</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.imageActionButton, styles.removeButton]} onPress={removeProfileImage} activeOpacity={0.8}>
                      <ThemedText style={styles.imageActionText}>🗑️ Xóa</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.imageUploadButton} onPress={showImagePickerOptions} activeOpacity={0.8}>
                  <ThemedText style={styles.imageUploadText}>📷</ThemedText>
                  <ThemedText style={styles.imageUploadSubtext}>Thêm ảnh profile</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Họ và tên</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputIcon}>👤</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#8A8F9C"
                value={name}
                onChangeText={setName}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputIcon}>✉️</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                placeholderTextColor="#8A8F9C"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Mật khẩu</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputIcon}>🔒</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#8A8F9C"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Xác nhận mật khẩu</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputIcon}>🔒</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#8A8F9C"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.primaryButtonText}>
                {loading ? 'Đang xử lý...' : '🚀 Đăng ký'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.secondaryButtonText}>🔄 Làm mới</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBackToLogin} style={styles.backToLoginButton} activeOpacity={0.7}>
              <ThemedText style={styles.backToLoginText}>← Đã có tài khoản? Đăng nhập</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  titleContainer: {
    paddingTop: 50,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent'
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2
  },
  card: {
    backgroundColor: '#151A26',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6
  },
  imageContainer: {
    marginBottom: 22,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  imageUploadSection: {
    alignItems: 'center'
  },
  imageUploadButton: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(74,144,226,0.08)',
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageUploadText: {
    fontSize: 30,
    marginBottom: 4
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: '#4A90E2',
    textAlign: 'center',
    fontWeight: '500'
  },
  imagePreviewContainer: {
    alignItems: 'center'
  },
  imagePreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#4A90E2',
    marginBottom: 12
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  imageActionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14
  },
  removeButton: {
    backgroundColor: '#E5484D'
  },
  imageActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  inputContainer: {
    marginBottom: 16,
    backgroundColor: 'transparent'
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#C9CDD6'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2433',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#FFFFFF'
  },
  buttonContainer: {
    marginTop: 8
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  secondaryButtonText: {
    color: '#C9CDD6',
    fontSize: 15,
    fontWeight: '600'
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 8
  },
  backToLoginText: {
    fontSize: 14,
    color: '#4A90E2',
    textDecorationLine: 'underline'
  }
});