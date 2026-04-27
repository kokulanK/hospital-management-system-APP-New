import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../Final_app/src/api/axios';
import { useLanguage } from '../../../../Final_app/src/contexts/LanguageContext';

export default function Chatbot() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const flatListRef = useRef(null);

  // Fetch chat history when opened
  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/chat/history');
      const withDates = data.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      setMessages(withDates);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  const sendMessageContent = async (content) => {
    if (!content.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content, timestamp: new Date() }]);
    setLoading(true);
    try {
      const { data } = await api.post('/chat', { message: content });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        id: Date.now(),
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Send message error', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t.chatbot?.errorGeneric || 'Sorry, something went wrong. Please try again.',
        id: Date.now(),
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    sendMessageContent(input.trim());
  };

  const clearChat = async () => {
    try {
      await api.delete('/chat');
      setMessages([]);
      if (Speech.isSpeakingAsync()) Speech.stop();
    } catch (err) {
      console.error('Failed to clear chat', err);
      alert(t.chatbot?.clearFailed || 'Failed to clear chat.');
    }
  };

  const speak = (text, messageId) => {
    if (speakingId === messageId) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    Speech.speak(text, {
      language: 'en',
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
    setSpeakingId(messageId);
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    const messageId = item.id || index;
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          {!isUser && (
            <TouchableOpacity
              onPress={() => speak(item.content, messageId)}
              style={styles.speakButton}
            >
              <Ionicons
                name={speakingId === messageId ? 'volume-high' : 'volume-mute'}
                size={14}
                color={speakingId === messageId ? '#3b82f6' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
        </View>
        {item.timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    );
  };

  // Stats
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setIsOpen(true)}>
        <Ionicons name="chatbubbles" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.chatWindow}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>
                    {t.chatbot?.hospitalAssistant || 'Health Assistant'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {t.chatbot?.assistantSubtitle || 'AI-powered medical assistant'}
                  </Text>
                </View>
                <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Stats & Guide */}
              <View style={styles.statsContainer}>
                <View style={styles.statBadge}>
                  <Ionicons name="time-outline" size={12} color="#6b7280" />
                  <Text style={styles.statText}>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Ionicons name="chatbubbles-outline" size={12} color="#6b7280" />
                  <Text style={styles.statText}>{userMessages} you · {assistantMessages} AI</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.guideButton} onPress={() => setShowGuide(!showGuide)}>
                <Ionicons name="information-circle-outline" size={14} color="#8b5cf6" />
                <Text style={styles.guideButtonText}>
                  {showGuide ? 'Hide guide' : 'Show guide'}
                </Text>
                <Ionicons name={showGuide ? 'chevron-up' : 'chevron-down'} size={12} color="#8b5cf6" />
              </TouchableOpacity>
              {showGuide && (
                <View style={styles.guideContent}>
                  <Text>💬 Ask me about appointments, symptoms, or hospital services.</Text>
                  <Text>🔊 Click the speaker icon on my replies to hear them aloud.</Text>
                  <Text>🗑️ Use the trash icon to clear the conversation.</Text>
                </View>
              )}

              {/* Messages */}
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#e5e7eb" />
                    <Text style={styles.emptyText}>
                      {t.chatbot?.emptyChat || 'No messages yet. Start a conversation!'}
                    </Text>
                  </View>
                }
              />
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.loadingText}>{t.chatbot?.typing || 'Typing...'}</Text>
                </View>
              )}

              {/* Input Area */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t.chatbot?.placeholder || 'Type your message...'}
                  value={input}
                  onChangeText={setInput}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
                  onPress={sendMessage}
                  disabled={loading || !input.trim()}
                >
                  <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatWindow: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#bfdbfe', fontSize: 12, marginTop: 2 },
  clearButton: { marginHorizontal: 12 },
  closeButton: { padding: 4 },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statText: { fontSize: 10, color: '#6b7280' },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  guideButtonText: { fontSize: 12, color: '#8b5cf6' },
  guideContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 12,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: '#1f2937',
  },
  speakButton: {
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
  },
  userTimestamp: {
    color: '#9ca3af',
  },
  assistantTimestamp: {
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});