import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export default function PublicHomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Text style={styles.markText}>AJ.A</Text>
        </View>
        <Text style={styles.title}>AUTHENTIC J.A. CONSTRUCTION LTD.</Text>
        <Text style={styles.subtitle}>Construction · Engineering · Real Estate · Building Materials</Text>
        <Text style={styles.note}>
          The full public experience and the authenticated mobile portals arrive in Phase 19
          (Native Expo application).
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  hero: { alignItems: 'center', gap: Spacing.three, maxWidth: 440 },
  mark: {
    width: 88,
    height: 88,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.green,
  },
  markText: { color: '#ffffff', fontSize: 26, fontWeight: '700', fontFamily: 'serif' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: Colors.light.text },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center' },
  note: { fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 18 },
});