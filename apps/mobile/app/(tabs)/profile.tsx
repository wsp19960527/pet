import { MOCK_SMS_CODE, USER_TOKEN_KEY, type UserBadgeItem } from '@pet/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchMe, loginWithSms } from '@/lib/api';
import { clearAccessToken, setAccessToken } from '@/lib/auth';
import { tokens } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [phone, setPhone] = useState('13800000002');
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('小救助者');
  const [reportCount, setReportCount] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [cloudAdoptionCount, setCloudAdoptionCount] = useState(0);
  const [badges, setBadges] = useState<UserBadgeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
    if (!token) {
      setLoggedIn(false);
      return;
    }
    setLoggedIn(true);
    try {
      const res = await fetchMe();
      setNickname(res.data.nickname ?? `用户${res.data.phone.slice(-4)}`);
      setReportCount(res.data.reportCount);
      setSubscriptionCount(res.data.subscriptionCount);
      setCloudAdoptionCount(res.data.cloudAdoptionCount);
      setBadges(res.data.badges ?? []);
    } catch {
      // token may be expired
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleLogin() {
    setLoading(true);
    try {
      const result = await loginWithSms(phone, MOCK_SMS_CODE);
      await setAccessToken(result.accessToken);
      setNickname(result.user.nickname ?? `用户${phone.slice(-4)}`);
      setLoggedIn(true);
      await loadProfile();
      Alert.alert('登录成功');
    } catch (err) {
      Alert.alert('登录失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await clearAccessToken();
    setLoggedIn(false);
    setReportCount(0);
    setSubscriptionCount(0);
    setCloudAdoptionCount(0);
    setBadges([]);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 28 }}>🐾</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{nickname}</Text>
        <Text style={[styles.stats, { color: colors.muted }]}>
          {loggedIn
            ? `上报 ${reportCount} · 订阅 ${subscriptionCount} · 云领养 ${cloudAdoptionCount}`
            : '未登录'}
        </Text>
        {!loggedIn ? (
          <View style={styles.loginBox}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="手机号"
            />
            <Text style={styles.hint}>开发环境验证码：{MOCK_SMS_CODE}</Text>
            <Button
              title={loading ? '登录中…' : '手机号登录'}
              onPress={() => void handleLogin()}
              disabled={loading}
            />
          </View>
        ) : (
          <Pressable onPress={() => void handleLogout()}>
            <Text style={styles.logout}>退出登录</Text>
          </Pressable>
        )}
      </Card>

      {badges.length > 0 && (
        <View style={styles.badgeSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>我的勋章</Text>
          <View style={styles.badgeRow}>
            {badges.map((badge) => (
              <View key={badge.code} style={styles.badgeChip}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {[
        { label: '我的上报', path: null },
        { label: '我的云领养', path: '/cloud-adoption' as const },
        { label: '捐赠公示', path: '/donations' as const },
        { label: '设置', path: null },
      ].map((item) => (
        <Pressable
          key={item.label}
          onPress={() => item.path && router.push(item.path)}
          style={[styles.menuItem, { borderBottomColor: tokens.color.border }]}
        >
          <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
          <Text style={{ color: colors.muted }}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: tokens.spacing[4] },
  header: { alignItems: 'center', marginBottom: tokens.spacing[4] },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '600', marginTop: tokens.spacing[3] },
  stats: { fontSize: 14, marginTop: tokens.spacing[1], textAlign: 'center' },
  loginBox: { width: '100%', marginTop: tokens.spacing[4], gap: tokens.spacing[2] },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
  },
  hint: { fontSize: 12, color: tokens.color.muted, textAlign: 'center' },
  logout: {
    marginTop: tokens.spacing[3],
    color: tokens.color.destructive,
    fontSize: 14,
  },
  badgeSection: { marginBottom: tokens.spacing[4] },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: tokens.spacing[2] },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing[2] },
  badgeChip: {
    alignItems: 'center',
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    minWidth: 80,
  },
  badgeIcon: { fontSize: 24 },
  badgeName: { fontSize: 11, marginTop: 4, color: tokens.color.muted },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
  },
  menuText: { fontSize: 16 },
});
