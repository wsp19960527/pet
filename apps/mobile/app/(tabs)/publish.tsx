import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { PublishWizard } from '@/components/publish/PublishWizard';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PublishScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [key, setKey] = useState(0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PublishWizard
        key={key}
        onSuccess={() => {
          setKey((value) => value + 1);
          router.push('/(tabs)');
        }}
        onRequireLogin={() => {
          Alert.alert('请先登录', '上报功能需要登录后使用', [
            { text: '取消', style: 'cancel' },
            { text: '去登录', onPress: () => router.push('/(tabs)/profile') },
          ]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
