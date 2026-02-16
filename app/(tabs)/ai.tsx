import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { aiService, ChatMessage } from '@/services/aiService';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SUGGESTIONS = [
  "Review my resume",
  "Interview tips",
  "Salary negotiation",
  "Career path advice",
  "Job fit analysis",
];

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Career Coach. How can I help you with your job search today?",
      createdAt: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!text) setInputText('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const aiResponse = await aiService.sendMessage(apiMessages);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}. Please check your configuration.`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <IconSymbol name="sparkles" size={14} color={theme.primary} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            {
              backgroundColor: isUser
                ? theme.primary
                : theme.surface,
              ...Shadows.sm,
              borderColor: isUser ? theme.primary : theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isUser ? '#fff' : theme.text },
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.timestamp,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textTertiary },
            ]}
          >
            {item.createdAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primary + '15' }]}>
          <IconSymbol name="sparkles" size={20} color={theme.primary} />
        </View>
        <View>
          <ThemedText type="title" style={[styles.headerTitle, { color: theme.text }]}>
            Career Coach
          </ThemedText>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <ThemedText style={[styles.statusText, { color: theme.textTertiary }]}>AI Active</ThemedText>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToBottom}
        ListHeaderComponent={() => (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.suggestionChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => handleSend(suggestion)}
                >
                  <ThemedText style={[styles.suggestionText, { color: theme.textSecondary }]}>{suggestion}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={[
            styles.inputArea,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                },
              ]}
              placeholder="Ask anything about your career..."
              placeholderTextColor={theme.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.primary,
                  opacity: !inputText.trim() || loading ? 0.6 : 1,
                },
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="arrow.up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  suggestionsContainer: {
    marginBottom: Spacing.lg,
  },
  suggestionsScroll: {
    paddingRight: Spacing.xl,
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
    opacity: 0.8,
  },
  inputArea: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
