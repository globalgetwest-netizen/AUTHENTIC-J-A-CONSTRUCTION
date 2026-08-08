/**
 * Branded React-Native primitives for the AUTHENTIC J.A. mobile app.
 * Styled from the canonical tokens (`@/constants/theme`) so screens stay
 * consistent with the web portals.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Spacing, Type } from '@/constants/theme';
import { label } from '@/lib/format';

export function Screen({ children, scroll }: { children: React.ReactNode; scroll?: boolean }) {
  const edges: Edge[] = ['top', 'left', 'right'];
  if (scroll) {
    return (
      <SafeAreaView style={styles.screen} edges={edges}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <View style={[styles.content, styles.flex]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        (pressed || inactive) && styles.primaryDim,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  variant = 'neutral',
}: {
  title: string;
  onPress: () => void;
  variant?: 'neutral' | 'danger';
}) {
  const border = variant === 'danger' ? Colors.brand.red : Colors.light.backgroundSelected;
  const text = variant === 'danger' ? Colors.brand.red : Colors.light.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, { borderColor: border }, pressed && styles.ghostDim]}
    >
      <Text style={[styles.ghostText, { color: text }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label: fieldLabel,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  keyboardType?: 'default' | 'email-address';
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{fieldLabel}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.brand.charcoal}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        editable={editable}
        style={[styles.input, !editable && styles.inputMuted]}
      />
    </View>
  );
}

const TONES: Record<string, string> = {
  VERIFIED: '#047857',
  ACTIVE: '#047857',
  PAID: '#047857',
  PROCESSED: '#1D4ED8',
  APPROVED: '#047857',
  PENDING: '#B45309',
  DRAFT: '#6B7280',
  REVOKED: '#B91C1C',
  EXPIRED: '#B45309',
  INVALID: '#6B7280',
  CANCELLED: '#6B7280',
  ISSUED: '#1D4ED8',
  COMPLETED: '#047857',
  IN_PROGRESS: '#1D4ED8',
  REJECTED: '#B91C1C',
};

/** Small colour-coded pill for status values (VERIFIED / PAID / PENDING …). */
export function Badge({ value }: { value: string }) {
  const color = TONES[value] ?? Colors.brand.blue;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label(value)}</Text>
    </View>
  );
}

export function Row({
  label: rowLabel,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{rowLabel}</Text>
      <View style={styles.rowValue}>{children}</View>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.listRowMain}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.listRowTrailing}>{trailing}</View> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && styles.listRowDim]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.listRow}>{content}</View>;
}

export function Spinner({ label: text }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.brand.green} size="large" />
      {text ? <Text style={styles.muted}>{text}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={styles.emptyCard}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <GhostButton title="Try again" onPress={onRetry} />
      ) : null}
    </Card>
  );
}

export function Stat({
  label: statLabel,
  value,
  tone = 'green',
}: {
  label: string;
  value: string;
  tone?: 'green' | 'blue' | 'red' | 'gold';
}) {
  const color =
    tone === 'blue' ? Colors.brand.blue : tone === 'gold' ? Colors.brand.gold : Colors.brand.green;
  return (
    <Card style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{statLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', padding: Spacing.three },
  flex: { flex: 1 },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.backgroundSelected,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: Type.xl,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: Fonts?.sans,
  },
  kicker: {
    fontSize: Type.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.brand.green600,
    textTransform: 'uppercase',
  },
  primary: {
    backgroundColor: Colors.brand.blue,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  primaryDim: { opacity: 0.7 },
  primaryText: { color: '#ffffff', fontSize: Type.base, fontWeight: '700' },
  ghost: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  ghostDim: { opacity: 0.6 },
  ghostText: { fontSize: Type.sm, fontWeight: '600' },
  field: { gap: Spacing.one },
  fieldLabel: { fontSize: Type.xs, color: Colors.light.textSecondary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: Type.base,
    color: Colors.light.text,
    backgroundColor: '#fff',
  },
  inputMuted: { opacity: 0.6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radii.full,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: Type.xs, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three },
  rowLabel: { fontSize: Type.sm, color: Colors.light.textSecondary },
  rowValue: { flexShrink: 1, alignItems: 'flex-end' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.backgroundSelected,
    gap: Spacing.three,
  },
  listRowDim: { opacity: 0.5 },
  listRowMain: { flex: 1, gap: Spacing.half },
  listRowTitle: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
  listRowSubtitle: { fontSize: Type.sm, color: Colors.light.textSecondary },
  listRowTrailing: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  muted: { fontSize: Type.sm, color: Colors.light.textSecondary, textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  emptyTitle: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
  errorText: { fontSize: Type.sm, color: Colors.brand.red, textAlign: 'center' },
  stat: { alignItems: 'center', flex: 1, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two },
  statValue: { fontSize: Type.xl, fontWeight: '800' },
  statLabel: { fontSize: Type.xs, color: Colors.light.textSecondary, marginTop: Spacing.half },
});