// screens/HomeScreen.js
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ notes, onCreateNote, onEditNote, onDeleteNote, onAccount, user }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0202ff' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.homeHeader}>
        <ThemedText style={styles.homeTitle}>📝 My Notes</ThemedText>
        <ThemedText style={styles.homeSubtitle}>
          Xin chào, {user?.name || 'Người dùng'}!
        </ThemedText>
      </View>

      {/* Nút tạo note & tài khoản */}
      <View style={styles.homeButtonContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.createButton]} onPress={onCreateNote} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>➕ Tạo ghi chú</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.accountButton]} onPress={onAccount} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>👤 Tài khoản</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách notes */}
      <ThemedView style={styles.notesContainer}>
        <ThemedText style={styles.notesTitle}>Ghi chú của bạn ({notes.length})</ThemedText>

        {notes.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>Chưa có ghi chú nào</ThemedText>
            <ThemedText style={styles.emptySubtext}>Hãy tạo ghi chú đầu tiên của bạn!</ThemedText>
          </ThemedView>
        ) : (
          notes.map(note => (
            <ThemedView key={note.id} style={styles.noteItem}>
              <TouchableOpacity onPress={() => onEditNote(note)} style={styles.noteContent} activeOpacity={0.7}>
                <ThemedText style={styles.noteTitle}>{note.title}</ThemedText>
                <ThemedText style={styles.notePreview} numberOfLines={2}>{note.content}</ThemedText>
                <ThemedText style={styles.noteDate}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteNote(note.id)} style={styles.deleteButton} activeOpacity={0.7}>
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  homeHeader: {
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,   // hạ tiêu đề xuống để không bị cắt chữ ở đầu màn hình
    paddingBottom: 10,
  },
  homeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,   // tránh chữ bị cắt trên/dưới
    includeFontPadding: false,
  },
  homeSubtitle: {
    fontSize: 15,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  homeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#2e7d32',
  },
  accountButton: {
    backgroundColor: '#1565c0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 6,
  },
  notesTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  noteItem: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#2a2a2c',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  notePreview: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  deleteButtonText: {
    fontSize: 20,
  },
});