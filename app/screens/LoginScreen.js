// screens/LoginScreen.js
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

import { API_BASE_URL } from '../../config/api';

const BACKEND_URL = `${API_BASE_URL}/auth/login.php`;

export default function LoginScreen({ onLogin, onRegister = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu!');

    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const text = await response.text();
      console.log('Server trả về:', text);
      let data;
      try { data = JSON.parse(text); } 
      catch { throw new Error('Server trả về dữ liệu không hợp lệ:\n' + text); }

      if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại!');

      const userData = {
          id: data.user.id || null,
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || '',   // ⭐ thêm dòng này
          registeredDate: data.user.registeredDate || data.user.registered_date || '',
          profileImage: data.user.profileImage
            ? { 
                uri: (() => {
                  const imgUri = data.user.profileImage.uri || data.user.profileImage;
                  return imgUri.startsWith('http') || imgUri.startsWith('file://') || imgUri.startsWith('data:')
                    ? imgUri
                    : `${API_BASE_URL}/${imgUri}`;
                })()
              }
            : null
        };

      onLogin(userData);

    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối server!\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0B0F1A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/logodau.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.mainTitle}>Note App Xin chào!</ThemedText>
          <ThemedText style={styles.subtitle}>Đăng nhập để tiếp tục</ThemedText>
        </ThemedView>

        <View style={styles.card}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputIcon}>✉️</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                keyboardType="email-address"
                placeholderTextColor="#8A8F9C"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
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
                secureTextEntry
                placeholderTextColor="#8A8F9C"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </ThemedView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.primaryButtonText}>
                {loading ? 'Đang xử lý...' : '🔑 Đăng nhập'}
              </ThemedText>
            </TouchableOpacity>

            {onRegister && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onRegister}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.secondaryButtonText}>Tạo tài khoản mới</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12
  },
  logo: {
    width: 130,
    height: 130
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent'
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 4,
    color: '#FFFFFF',
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  secondaryButtonText: {
    color: '#C9CDD6',
    fontSize: 15,
    fontWeight: '600'
  }
});