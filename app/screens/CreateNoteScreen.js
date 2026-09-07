// screens/CreateNoteScreen.js
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { API_BASE_URL } from '../../config/api';

export default function CreateNoteScreen({ userId, onBack }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const API_URL = `${API_BASE_URL}/notes/create_note.php`;

  // Log kiểm tra userId
  useEffect(() => {
    console.log("📌 USER ID NHẬN VÀO:", userId);
  }, [userId]);

  // Gửi API tạo note
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề!");
      return;
    }

    // Chặn gửi API khi userId không hợp lệ
    if (!userId) {
      Alert.alert("Lỗi", "Không xác định được User ID! Không thể lưu ghi chú.");
      console.log("❌ userId bị thiếu:", userId);
      return;
    }

    Alert.alert(
      "Lưu ghi chú",
      "Bạn chắc chắn muốn lưu?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Lưu",
          onPress: async () => {
            try {
              const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  user_id: userId,
                  title: title.trim(),
                  content: content.trim()
                })
              });

              const text = await res.text();
              console.log("Server trả về:", text);

              let data;
              try {
                data = JSON.parse(text);
              } catch {
                Alert.alert("Lỗi", "Phản hồi không hợp lệ từ server!");
                return;
              }

              if (data.status === true) {
                Alert.alert("Thành công", data.message || "Ghi chú đã được lưu!");
                onBack();
                } else {
                Alert.alert("Lỗi", data.message || "Không thể lưu ghi chú.");
                }

            } catch (error) {
              console.log("Lỗi tạo note:", error);
              Alert.alert("Lỗi kết nối", "Không thể kết nối server!");
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Quay lại",
        "Bạn có thay đổi chưa lưu. Thoát?",
        [
          { text: "Ở lại", style: "cancel" },
          { text: "Quay lại", onPress: onBack }
        ]
      );
    } else onBack();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0202ff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <View style={styles.backButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createHeader}>
        <ThemedText style={styles.createTitle}>✍️ Tạo ghi chú mới</ThemedText>
      </View>

      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.label}>Tiêu đề ghi chú:</ThemedText>
        <TextInput 
          style={styles.input}
          placeholder="Nhập tiêu đề..."
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.label}>Nội dung ghi chú:</ThemedText>
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Nhập nội dung..."
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
          💡 Bạn có thể viết bất cứ điều gì!
        </ThemedText>
      </ThemedView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveButtonText}>💾 Lưu ghi chú</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButtonContainer: {
    marginBottom: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  backButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '600',
  },
  createHeader: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  createTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,
    includeFontPadding: false,
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
    backgroundColor: '#3a2f0d',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#5c4a12',
  },
  helpText: {
    fontSize: 14,
    color: '#ffd76a',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});