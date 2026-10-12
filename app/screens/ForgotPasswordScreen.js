// screens/ForgotPasswordScreen.js - Màn hình Quên mật khẩu
import { useState } from 'react';
import {
  Alert,
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

export default function ForgotPasswordScreen({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP, 3: mật khẩu mới
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (text) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

  // ==========================================
  // BƯỚC 1: GỬI MÃ XÁC NHẬN ĐẾN EMAIL
  // ==========================================
  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email!');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Lỗi', 'Định dạng email không hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Thành công', data.message || 'Mã xác nhận đã được tạo và gửi!', [
          { text: 'Nhập mã', onPress: () => setStep(2) }
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi mã xác nhận!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BƯỚC 2: XÁC THỰC MÃ CODE
  // ==========================================
  const handleVerifyCode = async () => {
    const cleanCode = verificationCode.trim();
    if (!cleanCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã xác nhận 6 chữ số!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Xác thực thành công', 'Mã chính xác! Hãy đặt mật khẩu mới cho tài khoản của bạn.', [
          { text: 'Tiếp tục', onPress: () => setStep(3) }
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Mã xác nhận không đúng hoặc đã hết hạn!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BƯỚC 3: ĐẶT MẬT KHẨU MỚI
  // ==========================================
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin mật khẩu mới!');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp với mật khẩu mới!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: verificationCode.trim(),
          newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Thành công 🎉',
          'Mật khẩu của bạn đã được thay đổi thành công! Bạn có thể đăng nhập ngay.',
          [{ text: 'Đăng nhập', onPress: onBackToLogin }]
        );
        handleStartOver();
      } else {
        Alert.alert('Lỗi', data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server: ' + (error.message || ''));
    } finally {
      setLoading(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0B0F1A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nút quay lại đầu màn hình */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBackToLogin} activeOpacity={0.7}>
            <ThemedText style={styles.backButtonText}>← Đăng nhập</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Thanh tiến trình các bước */}
        <View style={styles.stepIndicatorContainer}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <ThemedText style={styles.stepDotText}>1</ThemedText>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <ThemedText style={styles.stepDotText}>2</ThemedText>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
            <ThemedText style={styles.stepDotText}>3</ThemedText>
          </View>
        </View>

        {/* Card nội dung chính */}
        <View style={styles.card}>
          {/* ==================== BƯỚC 1 ==================== */}
          {step === 1 && (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.headerIcon}>🔐</ThemedText>
                <ThemedText style={styles.title}>Quên mật khẩu?</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Nhập địa chỉ email đăng ký để nhận mã OTP khôi phục mật khẩu.
                </ThemedText>
              </View>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email của bạn</ThemedText>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputIcon}>✉️</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#8A8F9C"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </ThemedView>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {loading ? 'Đang gửi mã...' : '📨 Gửi mã xác nhận'}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}

          {/* ==================== BƯỚC 2 ==================== */}
          {step === 2 && (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.headerIcon}>📩</ThemedText>
                <ThemedText style={styles.title}>Nhập mã xác nhận</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Mã 6 chữ số đã được gửi đến:{'\n'}
                  <ThemedText style={styles.emailHighlight}>{email}</ThemedText>
                </ThemedText>
              </View>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Mã OTP 6 chữ số</ThemedText>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputIcon}>🔢</ThemedText>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#8A8F9C"
                    keyboardType="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                  />
                </View>
              </ThemedView>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {loading ? 'Đang xác thực...' : '✅ Xác nhận mã'}
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity onPress={handleSendCode} disabled={loading} style={styles.textAction}>
                  <ThemedText style={styles.linkText}>🔄 Gửi lại mã</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleStartOver} style={styles.textAction}>
                  <ThemedText style={styles.linkTextMuted}>✏️ Đổi email</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ==================== BƯỚC 3 ==================== */}
          {step === 3 && (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.headerIcon}>🛡️</ThemedText>
                <ThemedText style={styles.title}>Đặt mật khẩu mới</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Vui lòng tạo một mật khẩu mới an toàn cho tài khoản của bạn.
                </ThemedText>
              </View>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Mật khẩu mới</ThemedText>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputIcon}>🔒</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry
                    placeholderTextColor="#8A8F9C"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
              </ThemedView>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Nhập lại mật khẩu mới</ThemedText>
                <View style={styles.inputWrapper}>
                  <ThemedText style={styles.inputIcon}>🔒</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Khớp với mật khẩu trên"
                    secureTextEntry
                    placeholderTextColor="#8A8F9C"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                  />
                </View>
              </ThemedView>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {loading ? 'Đang cập nhật...' : '💾 Lưu mật khẩu mới'}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1E2433',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2433',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#4A90E2',
  },
  card: {
    backgroundColor: '#151A26',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
  },
  emailHighlight: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#C9CDD6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2433',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#FFFFFF',
  },
  otpInput: {
    letterSpacing: 6,
    fontWeight: '700',
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 8,
  },
  textAction: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#4A90E2',
    fontSize: 13,
    fontWeight: '600',
  },
  linkTextMuted: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
});
