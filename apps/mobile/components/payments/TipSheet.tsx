import {
  PaymentChannel,
  PaymentOrderResult,
  PaymentRefType,
} from '@pet/shared';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { createTip, mockPayOrder } from '@/lib/api';
import { tokens } from '@/theme/tokens';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

interface TipSheetProps {
  visible: boolean;
  onClose: () => void;
  targetType: PaymentRefType.ANIMAL | PaymentRefType.CROWDFUNDING;
  targetId: string;
  onSuccess?: () => void;
}

export function TipSheet({
  visible,
  onClose,
  targetType,
  targetId,
  onSuccess,
}: TipSheetProps) {
  const [amountCents, setAmountCents] = useState(1000);
  const [channel, setChannel] = useState<PaymentChannel>(PaymentChannel.WECHAT);
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const idempotencyKey = `${targetId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const res = await createTip({
        targetType,
        targetId,
        amountCents,
        channel,
        idempotencyKey,
      });
      const order = res.data as PaymentOrderResult;

      if (order.mockPayPath) {
        await mockPayOrder(order.orderId);
        Alert.alert('打赏成功', `已捐赠 ¥${(amountCents / 100).toFixed(2)}`);
        onSuccess?.();
        onClose();
        return;
      }

      Alert.alert('订单已创建', '请在微信/支付宝中完成支付');
      onClose();
    } catch (err) {
      Alert.alert('支付失败', err instanceof Error ? err.message : '请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>支持救助</Text>
          <Text style={styles.subtitle}>选择打赏金额（元）</Text>

          <View style={styles.amountRow}>
            {PRESET_AMOUNTS.map((cents) => (
              <Pressable
                key={cents}
                onPress={() => setAmountCents(cents)}
                style={[
                  styles.amountChip,
                  amountCents === cents && styles.amountChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.amountText,
                    amountCents === cents && styles.amountTextActive,
                  ]}
                >
                  ¥{cents / 100}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.subtitle}>支付方式</Text>
          <View style={styles.channelRow}>
            {[PaymentChannel.WECHAT, PaymentChannel.ALIPAY].map((item) => (
              <Pressable
                key={item}
                onPress={() => setChannel(item)}
                style={[
                  styles.channelChip,
                  channel === item && styles.channelChipActive,
                ]}
              >
                <Text style={channel === item ? styles.channelActiveText : undefined}>
                  {item === PaymentChannel.WECHAT ? '微信' : '支付宝'}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={tokens.color.primary} style={{ marginTop: 16 }} />
          ) : (
            <Button
              title={`确认打赏 ¥${(amountCents / 100).toFixed(2)}`}
              onPress={() => void handlePay()}
              style={{ marginTop: tokens.spacing[4] }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.color.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    padding: tokens.spacing[5],
    paddingBottom: tokens.spacing[8],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.color.border,
    alignSelf: 'center',
    marginBottom: tokens.spacing[4],
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: tokens.color.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.color.muted,
    marginTop: tokens.spacing[3],
    marginBottom: tokens.spacing[2],
  },
  amountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  amountChip: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    minWidth: '22%',
    alignItems: 'center',
  },
  amountChipActive: {
    backgroundColor: tokens.color.accent,
    borderColor: tokens.color.accent,
  },
  amountText: { fontSize: 16, fontWeight: '600', color: tokens.color.foreground },
  amountTextActive: { color: '#fff' },
  channelRow: { flexDirection: 'row', gap: tokens.spacing[2] },
  channelChip: {
    flex: 1,
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    alignItems: 'center',
  },
  channelChipActive: {
    borderColor: tokens.color.primary,
    backgroundColor: `${tokens.color.primary}15`,
  },
  channelActiveText: { color: tokens.color.primary, fontWeight: '600' },
});
