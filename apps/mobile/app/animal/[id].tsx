import {
  ANIMAL_STATUS_LABELS,
  AnimalSpecies,
  AnimalStatus,
  InteractionTargetType,
  InteractionType,
  PaymentRefType,
} from '@pet/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusStepper } from '@/components/animal/StatusStepper';
import { statusLabel } from '@/components/map/AnimalMarker';
import { TipSheet } from '@/components/payments/TipSheet';
import { Button } from '@/components/ui/Button';
import {
  fetchAnimalComments,
  fetchAnimalDetail,
  fetchAnimalTimeline,
  fetchCrowdfundingProjects,
  postInteraction,
  subscribeAnimal,
  unsubscribeAnimal,
  updateAnimalStatus,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { tokens } from '@/theme/tokens';

const SPECIES_LABEL: Record<AnimalSpecies, string> = {
  [AnimalSpecies.CAT]: '猫',
  [AnimalSpecies.DOG]: '狗',
  [AnimalSpecies.OTHER]: '其他',
};

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof fetchAnimalDetail>
  >['data'] | null>(null);
  const [timeline, setTimeline] = useState<
    Awaited<ReturnType<typeof fetchAnimalTimeline>>['data']
  >([]);
  const [comments, setComments] = useState<
    Awaited<ReturnType<typeof fetchAnimalComments>>['data']
  >([]);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [crowdfunding, setCrowdfunding] = useState<
    Awaited<ReturnType<typeof fetchCrowdfundingProjects>>['data']
  >([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detailRes, timelineRes, commentsRes, crowdfundingRes] =
        await Promise.all([
          fetchAnimalDetail(id),
          fetchAnimalTimeline(id),
          fetchAnimalComments(id),
          fetchCrowdfundingProjects(id),
        ]);
      setDetail(detailRes.data);
      setSubscribed(Boolean(detailRes.data.subscribed));
      setTimeline(timelineRes.data);
      setComments(commentsRes.data);
      setCrowdfunding(crowdfundingRes.data);
    } catch (err) {
      Alert.alert('加载失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLike() {
    if (!id || !detail) return;
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('请先登录');
      return;
    }

    const prevLiked = liked;
    const prevCount = detail.likeCount;
    setLiked(!liked);
    setDetail({ ...detail, likeCount: liked ? prevCount - 1 : prevCount + 1 });

    try {
      const res = await postInteraction({
        targetType: InteractionTargetType.ANIMAL,
        targetId: id,
        type: InteractionType.LIKE,
      });
      if ('liked' in res.data) {
        setLiked(res.data.liked);
        setDetail({ ...detail, likeCount: res.data.likeCount });
      }
    } catch {
      setLiked(prevLiked);
      setDetail({ ...detail, likeCount: prevCount });
      Alert.alert('点赞失败');
    }
  }

  async function handleComment() {
    if (!id || !commentText.trim()) return;
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('请先登录');
      return;
    }

    setSubmitting(true);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      type: InteractionType.COMMENT as const,
      content: commentText.trim(),
      userId: 'me',
      userNickname: '我',
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setCommentText('');

    try {
      const res = await postInteraction({
        targetType: InteractionTargetType.ANIMAL,
        targetId: id,
        type: InteractionType.COMMENT,
        content: optimistic.content,
      });
      if ('id' in res.data) {
        setComments((prev) => [
          res.data as typeof optimistic,
          ...prev.filter((c) => c.id !== optimistic.id),
        ]);
        if (detail) {
          setDetail({ ...detail, commentCount: detail.commentCount + 1 });
        }
      }
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      Alert.alert('评论失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubscribe() {
    if (!id) return;
    const token = await getAccessToken();
    if (!token) {
      Alert.alert('请先登录');
      return;
    }

    setSubscribing(true);
    const prev = subscribed;
    setSubscribed(!prev);
    try {
      if (prev) {
        await unsubscribeAnimal(id);
      } else {
        await subscribeAnimal(id);
      }
    } catch (err) {
      setSubscribed(prev);
      Alert.alert('操作失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setSubscribing(false);
    }
  }

  async function handleAdvanceStatus() {
    if (!id || !detail) return;
    const nextMap: Partial<Record<AnimalStatus, AnimalStatus>> = {
      [AnimalStatus.DISCOVERED]: AnimalStatus.CONTACTING,
      [AnimalStatus.CONTACTING]: AnimalStatus.RESCUED,
      [AnimalStatus.RESCUED]: AnimalStatus.AT_VET,
      [AnimalStatus.AT_VET]: AnimalStatus.FOSTERING,
      [AnimalStatus.FOSTERING]: AnimalStatus.ADOPTED,
    };
    const next = nextMap[detail.status];
    if (!next) return;

    try {
      await updateAnimalStatus(id, { status: next });
      await load();
      Alert.alert('状态已更新');
    } catch (err) {
      Alert.alert('更新失败', err instanceof Error ? err.message : '请重试');
    }
  }

  if (loading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} size="large" />
      </View>
    );
  }

  const hero = detail.media[0]?.url;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>

        {hero ? (
          <Image source={{ uri: hero }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>
            {SPECIES_LABEL[detail.species]} · {statusLabel(detail.status)}
          </Text>
          {detail.description ? (
            <Text style={styles.desc}>{detail.description}</Text>
          ) : null}

          {detail.tipCount > 0 ? (
            <Text style={styles.tipStats}>
              已收到 {detail.tipCount} 笔打赏，共 ¥
              {(detail.tipTotalCents / 100).toFixed(2)}
            </Text>
          ) : null}

          <StatusStepper status={detail.status} />

          <Text style={styles.section}>位置</Text>
          <Text style={styles.muted}>
            {detail.addressText ?? detail.cityName ?? '位置已模糊处理'}
            {!detail.locationPrecise ? '（模糊）' : ''}
          </Text>

          {crowdfunding.length > 0 ? (
            <>
              <Text style={styles.section}>众筹项目</Text>
              {crowdfunding.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => router.push(`/crowdfunding/${project.id}`)}
                  style={styles.crowdfundingCard}
                >
                  <Text style={styles.crowdfundingTitle}>{project.title}</Text>
                  <Text style={styles.muted}>
                    {project.progressPercent}% · ¥
                    {(project.raisedAmountCents / 100).toFixed(0)} / ¥
                    {(project.goalAmountCents / 100).toFixed(0)}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Text style={styles.section}>救助时间轴</Text>
          {timeline.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              <Text style={styles.timelineTitle}>
                {ANIMAL_STATUS_LABELS[item.toStatus]} ·{' '}
                {item.operatorName ?? '救助者'}
              </Text>
              {item.note ? (
                <Text style={styles.muted}>{item.note}</Text>
              ) : null}
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.interactRow}>
            <Text style={styles.section}>评论 ({detail.commentCount})</Text>
            <Pressable onPress={() => void handleLike()}>
              <Text style={styles.likeBtn}>
                {liked ? '♥' : '♡'} {detail.likeCount}
              </Text>
            </Pressable>
          </View>

          <View style={styles.commentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="写下你的留言…"
              value={commentText}
              onChangeText={setCommentText}
            />
            <Button
              title={submitting ? '发送中' : '发送'}
              onPress={() => void handleComment()}
              disabled={submitting || !commentText.trim()}
            />
          </View>

          {comments.map((item) => (
            <View key={item.id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>
                {item.userNickname ?? '用户'}
              </Text>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="打赏"
          variant="secondary"
          onPress={() => setTipVisible(true)}
          style={{ flex: 1 }}
        />
        <Button
          title={subscribed ? '已订阅' : '订阅动态'}
          variant={subscribed ? 'secondary' : 'primary'}
          onPress={() => void handleSubscribe()}
          disabled={subscribing}
          style={{ flex: 1 }}
        />
        <Button
          title="更新状态"
          onPress={() => void handleAdvanceStatus()}
          style={{ flex: 1 }}
        />
      </View>

      {id ? (
        <TipSheet
          visible={tipVisible}
          onClose={() => setTipVisible(false)}
          targetType={PaymentRefType.ANIMAL}
          targetId={id}
          onSuccess={() => void load()}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: tokens.spacing[4] },
  backText: { fontSize: 16, color: tokens.color.primary },
  hero: { width: '100%', height: 220, backgroundColor: tokens.color.border },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: tokens.spacing[4] },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  desc: {
    marginTop: tokens.spacing[2],
    fontSize: 15,
    lineHeight: 22,
    color: tokens.color.foreground,
  },
  tipStats: {
    marginTop: tokens.spacing[2],
    fontSize: 14,
    color: tokens.color.secondary,
    fontWeight: '600',
  },
  crowdfundingCard: {
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.spacing[2],
  },
  crowdfundingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  section: {
    marginTop: tokens.spacing[4],
    marginBottom: tokens.spacing[2],
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  muted: { fontSize: 14, color: tokens.color.muted, lineHeight: 20 },
  timelineItem: {
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: tokens.color.foreground },
  time: { fontSize: 12, color: tokens.color.muted, marginTop: 4 },
  interactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeBtn: { fontSize: 16, color: tokens.color.secondary, fontWeight: '600' },
  commentBox: { marginTop: tokens.spacing[2], gap: tokens.spacing[2] },
  commentInput: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    minHeight: 44,
  },
  commentItem: {
    marginTop: tokens.spacing[3],
    padding: tokens.spacing[3],
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
  },
  commentAuthor: { fontWeight: '600', fontSize: 13, color: tokens.color.foreground },
  commentContent: { marginTop: 4, fontSize: 14, color: tokens.color.foreground },
  footer: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    padding: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
});
