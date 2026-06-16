import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchConversationMessages,
  sendConversationMessage,
} from '@/lib/api';
import { tokens } from '@/theme/tokens';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<
    Awaited<ReturnType<typeof fetchConversationMessages>>['data']
  >([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchConversationMessages(id);
      setMessages(res.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend() {
    if (!id || !text.trim()) return;
    setSending(true);
    try {
      const res = await sendConversationMessage(id, text.trim());
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.isMine ? styles.mine : styles.theirs,
            ]}
          >
            <Text style={item.isMine ? styles.mineText : styles.theirText}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>暂无消息，发一句打个招呼吧</Text>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="输入消息…"
          multiline
        />
        <Pressable
          style={[styles.sendBtn, sending && { opacity: 0.6 }]}
          disabled={sending}
          onPress={() => void handleSend()}
        >
          <Text style={styles.sendText}>发送</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.back()} style={styles.backWrap}>
        <Text style={styles.back}>返回</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: tokens.spacing[4], gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: tokens.radius.md,
    marginBottom: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.color.primary,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  mineText: { color: tokens.color.onPrimary },
  theirText: { color: tokens.color.foreground },
  empty: { textAlign: 'center', color: tokens.color.muted, marginTop: 24 },
  inputRow: {
    flexDirection: 'row',
    padding: tokens.spacing[3],
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: tokens.color.surface,
  },
  sendBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendText: { color: tokens.color.onPrimary, fontWeight: '600' },
  backWrap: { paddingBottom: tokens.spacing[3] },
  back: { textAlign: 'center', color: tokens.color.muted },
});
