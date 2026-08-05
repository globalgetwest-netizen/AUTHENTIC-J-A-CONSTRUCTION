import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

/**
 * Temporary, clearly-labelled placeholder for a portal experience.
 * Replaced with the real role experience in Phase 19 (Native Expo application).
 */
export function RolePlaceholder({ role }: { role: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{role.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>Portal placeholder</Text>
        <Text style={styles.subtitle}>
          Role-based navigation and full functionality ship in Phase 19 (Native Expo application).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
    borderRadius: Spacing.four,
    backgroundColor: Colors.brand.offWhite,
    borderColor: Colors.light.backgroundSelected,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    backgroundColor: Colors.brand.green,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.light.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: Colors.light.textSecondary, textAlign: 'center' },
});