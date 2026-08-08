import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { Badge, EmptyState, ErrorState, ListRow, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { Payslip } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function PayslipsScreen() {
  const router = useRouter();
  const { request } = useAuth();

  const load = useMemo(() => () => request<Payslip[]>('/staff/payslips'), [request]);
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      <SectionTitle>Payslips</SectionTitle>
      <Text style={styles.lead}>
        Your latest salary records. Tap a payslip to see the full breakdown.
      </Text>

      {status === 'loading' ? <Spinner label="Loading payslips…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load payslips.'} onRetry={reload} /> : null}
      {status === 'success' ? (
        data && data.length > 0 ? (
          <View style={styles.list}>
            {data.map((p) => (
              <ListRow
                key={p.id}
                title={p.period?.name ?? `Payslip ${p.payslipNo}`}
                subtitle={`${formatDate(p.issuedAt)} · ${p.payslipNo}`}
                trailing={<Badge value={p.status} />}
                onPress={() => router.push(`/portal/payslips/${p.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No payslips yet" subtitle="Payslips appear here once payroll is processed." />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: Type.sm, color: Colors.light.textSecondary, marginBottom: Spacing.two },
  list: { marginTop: Spacing.one },
});