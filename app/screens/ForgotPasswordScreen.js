import axios from 'axios';
import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ForgotPasswordScreen({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập code, 3: đặt mật khẩu mới
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Step 1: gửi mã về email
  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập email!');
    if (!isValidEmail(email)) return Alert.alert('Lỗi', 'Email không hợp lệ!');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/send-reset-code`, {
        email: email.trim()
      });

      if (response.data.success) {
        Alert.alert('Thành công', 'Mã xác nhận đã được gửi đến email!', [
          { text: 'OK', onPress: () => setStep(2) }
        ]);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Không thể gửi mã!');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || error.message);
    }
  };

  // Step 2: xác thực code
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mã xác nhận!');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/verify-reset-code`, {
        email: email.trim(),
        code: verificationCode.trim()
      });

      if (response.data.success) {
        setStep(3);
      } else {
        Alert.alert('Lỗi', response.data.message || 'Mã xác nhận không đúng!');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || error.message);
    }
  };

  // Step 3: đặt mật khẩu mới
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword)
      return Alert.alert('Lỗi', 'Vui lòng điền đầy đủ mật khẩu mới!');
    if (newPassword.length < 6)
      return Alert.alert('Lỗi', 'Mật khẩu mới phải ít nhất 6 ký tự!');
    if (newPassword !== confirmNewPassword)
      return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/reset-password`, {
        email: email.trim(),
        code: verificationCode.trim(),
        newPassword
      });

      if (response.data.success) {
        Alert.alert(
          'Thành công',
          'Mật khẩu đã được thay đổi. Bạn có thể đăng nhập với mật khẩu mới.',
          [{ text: 'Đăng nhập', onPress: onBackToLogin }]
        );
        setStep(1);
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        Alert.alert('Lỗi', response.data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || error.message);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.card}>
        {/* Step 1 */}
        {step === 1 && (
          <>
            <ThemedText style={styles.title}>Nhập Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.button} onPress={handleSendCode}>
              <ThemedText style={styles.buttonText}>Gửi Mã Xác Nhận</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <ThemedText style={styles.title}>Nhập Mã Xác Nhận</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Mã 6 chữ số"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={verificationCode}
              onChangeText={setVerificationCode}
              maxLength={6}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
              <ThemedText style={styles.buttonText}>Xác Nhận</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleStartOver} style={{ marginTop: 12 }}>
              <ThemedText style={{ color: '#007AFF', textAlign: 'center' }}>🔄 Bắt đầu lại</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <ThemedText style={styles.title}>Đặt Mật Khẩu Mới</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              secureTextEntry
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry
              placeholderTextColor="#999"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <ThemedText style={styles.buttonText}>Đặt Lại Mật Khẩu</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#0a0a0a', flexGrow: 1 },
  card: { backgroundColor: '#1a1a2e', padding: 24, borderRadius: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1.5, borderColor: '#333', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#0f0f1e', color: '#fff', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
