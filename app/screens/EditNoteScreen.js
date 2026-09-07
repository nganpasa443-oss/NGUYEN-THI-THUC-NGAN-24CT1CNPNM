// screens/EditNoteScreen.js - Trang chỉnh sửa ghi chú
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function EditNoteScreen({ note, onSave, onBack }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  
  const originalTitle = note?.title || '';
  const originalContent = note?.content || '';

  const hasChanges = title !== originalTitle || content !== originalContent;

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề ghi chú!');
      return;
    }
    if (!hasChanges) {
      Alert.alert('Thông báo', 'Không có thay đổi nào để lưu!');
      return;
    }
    
    const noteData = {
      title: title.trim(),
      content: content.trim()
    };
    
    Alert.alert(
      'Cập nhật ghi chú',
      'Bạn có muốn lưu các thay đổi?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Lưu', 
          onPress: () => {
            onSave(noteData);
            Alert.alert('Thành công', 'Ghi chú đã được cập nhật!');
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Quay lại',
        'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn quay lại?',
        [
          { text: 'Ở lại', style: 'cancel' },
          { text: 'Quay lại', onPress: onBack }
        ]
      );
    } else {
      onBack();
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Khôi phục',
      'Bạn có chắc chắn muốn khôi phục nội dung gốc?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Khôi phục', 
          onPress: () => {
            setTitle(originalTitle);
            setContent(originalContent);
            Alert.alert('Thành công', 'Đã khôi phục nội dung gốc!');
          }
        }
      ]
    );
  };

  return (
    <ScrollView // ✅ thay thế ParallaxScrollView
      style={{ flex: 1, backgroundColor: '#0a0202ff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Nút điều hướng - đưa lên đầu, hạ xuống một chút để không bị cắt */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        {hasChanges && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.resetButtonText}>🔄 Khôi phục</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Header */}
      <View style={styles.editHeader}>
        <ThemedText style={styles.editTitle}>✏️ Sửa ghi chú</ThemedText>
        <ThemedText style={styles.editSubtitle}>ID: #{note?.id}</ThemedText>
      </View>

      {/* Thông tin ghi chú */}
      <ThemedView style={styles.noteInfoContainer}>
        <ThemedText style={styles.noteInfoText}>
          📅 Ngày tạo: {note?.createdAt}
        </ThemedText>
        {hasChanges && (
          <ThemedText style={styles.changesText}>
            ⚠️ Có thay đổi chưa lưu
          </ThemedText>
        )}
      </ThemedView>

      {/* Form sửa ghi chú */}
      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.label}>Tiêu đề ghi chú:</ThemedText>
        <TextInput 
          style={styles.input}
          placeholder="Nhập tiêu đề ghi chú..."
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.label}>Nội dung ghi chú:</ThemedText>
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Nhập nội dung ghi chú..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
      </ThemedView>

      <ThemedView style={styles.helpContainer}>
        <ThemedText style={styles.helpText}>
          💡 Mẹo: Nhấn &quot;Khôi phục&quot; để trở về nội dung gốc
        </ThemedText>
      </ThemedView>

      {/* Nút cập nhật */}
      <TouchableOpacity
        style={[styles.updateButton, { backgroundColor: hasChanges ? '#28a745' : '#007AFF' }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.updateButtonText}>
          {hasChanges ? "💾 Lưu thay đổi" : "💾 Cập nhật ghi chú"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,     // hạ xuống để không bị dính mép/status bar
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  backButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a1414',
    borderWidth: 1,
    borderColor: '#5c2020',
  },
  resetButtonText: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '600',
  },
  editHeader: {
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
  },
  editTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,     // tránh chữ "Sửa ghi chú" bị cắt trên/dưới
    includeFontPadding: false,
  },
  editSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  noteInfoContainer: {
    backgroundColor: '#1c1c1e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  noteInfoText: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  changesText: {
    fontSize: 12,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  inputContainer: { 
    marginBottom: 20, 
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#3a3a3c', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#1c1c1e',
    color: '#fff',
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  helpContainer: {
    backgroundColor: '#0d2f38',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1a4a56',
  },
  helpText: {
    fontSize: 14,
    color: '#7fd4e8',
    textAlign: 'center',
  },
  updateButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});