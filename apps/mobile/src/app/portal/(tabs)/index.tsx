import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge, Card, Row, Screen, SectionTitle } from '@/components/ui';
import { Colors, Radii, Spacing, Type } from '@/constants/theme';
import { useAsyncData } from '@/lib/use-async-data';
import type { Payslip, Quotation } from '@/api/types';
import { useAuth } from '@/state/auth';

function QuickLink({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickLink, pressed && styles.quickLinkDim]}
    >
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <Text style={styles.quickLinkSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { firstName, isStaff, isClient, isAdmin, request } = useAuth();

  const payslips = useAsyncData(() =>
    isStaff || isAdmin ? request<Payslip[]>('/staff/payslips') : Promise.resolve([]),
  );
  const quotations = useAsyncData(() =>
    isClient
      ? request<{ data: Quotation[]; meta: { total: number } }>('/client/quotations')
      : Promise.resolve({ data: [], meta: { total: 0 } }),
  );

  const role = isAdmin ? 'Admin' : isStaff ? 'Staff' : isClient ? 'Client' : 'Member';

  return (
    <Screen scroll>
      <View style={styles.gap}>
        <View style={styles.hero}>
          <Text style={styles.greeting}>Good day, {firstName || 'there'} 👋</Text>
          <View style={styles.roleRow}>
            <Badge value={role} />
          </View>
          <Text style={styles.subtitle}>
            Your {role.toLowerCase()} workspace — everything you need at AUTHENTIC J.A. Construction.
          </Text>
        </View>

        {isStaff || isAdmin ? (
          <SectionTitle>Quick links</SectionTitle>
        ) : null}
        {isStaff || isAdmin ? (
          <View style={styles.quickGrid}>
            <QuickLink
              title="Payslips"
              subtitle={payslips.data ? `${payslips.data.length} available` : 'Your salary records'}
              onPress={() => router.push('/portal/payslips')}
            />
            {isAdmin ? (
              <QuickLink
                title="Employees"
                subtitle="View the team directory"
                onPress={() => router.push('/portal/employees')}
              />
            ) : null}
            {isStaff ? (
              <QuickLink
                title="Employee ID"
                subtitle="Your verification card"
                onPress={() => router.push('/portal/employee-id')}
              />
            ) : null}
          </View>
        ) : null}

        {isClient ? (
          <>
            <SectionTitle>Your quotations</SectionTitle>
            <QuickLink
              title={`${quotations.data?.meta.total ?? 0} quotation(s)`}
              subtitle="Review your project quotes"
              onPress={() => router.push('/portal/quotations')}
            />
          </>
        ) : null}

        {isAdmin ? (
          <>
            <SectionTitle>At a glance</SectionTitle>
            <Card>
              <Row label="Latest payslips">
                <Text style={styles.value}>{payslips.data?.length ?? '—'}</Text>
              </Row>
              <Row label="Team size">
                <Text style={styles.value}>{'—'}</Text>
              </Row>
            </Card>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.three },
  hero: { gap: Spacing.one },
  greeting: { fontSize: Type.lg, fontWeight: '700', color: Colors.light.text },
  roleRow: { flexDirection: 'row' },
  subtitle: { fontSize: Type.sm, color: Colors.light.textSecondary, lineHeight: 20 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  quickLink: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.light.backgroundElement,
    borderColor: Colors.light.backgroundSelected,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  quickLinkDim: { opacity: 0.6 },
  quickLinkTitle: { fontSize: Type.base, fontWeight: '700', color: Colors.light.text },
  quickLinkSubtitle: { fontSize: Type.sm, color: Colors.light.textSecondary },
  value: { fontSize: Type.base, fontWeight: '700', color: Colors.light.text },
});