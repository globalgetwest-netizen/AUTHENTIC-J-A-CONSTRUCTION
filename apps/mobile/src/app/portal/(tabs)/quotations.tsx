import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { Badge, EmptyState, ErrorState, ListRow, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { formatDate, formatMoney } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { Quotation } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function QuotationsScreen() {
  const router = useRouter();
  const { request } = useAuth();

  const load = useMemo(
    () => () =>
      request<{ data: Quotation[]; meta: { total: number } }>('/client/quotations').then((view) => view.data),
    [request],
  );
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      <SectionTitle>Quotations</SectionTitle>
      <Text style={styles.lead}>
        The quotes we&apos;ve prepared for you. Tap one to review the line items and totals.
      </Text>

      {status === 'loading' ? <Spinner label="Loading quotations…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load quotations.'} onRetry={reload} /> : null}
      {status === 'success' ? (
        data && data.length > 0 ? (
          <View style={styles.list}>
            {data.map((q) => (
              <ListRow
                key={q.id}
                title={q.title || q.quotationNo}
                subtitle={`${formatDate(q.issuedAt)} · ${q.quotationNo}`}
                trailing={
                  <View style={styles.trailing}>
                    <Text style={styles.amount}>{formatMoney(q.total)}</Text>
                    <Badge value={q.status} />
                  </View>
                }
                onPress={() => router.push(`/portal/quotations/${q.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No quotations yet" subtitle="When we prepare a quote for you it will appear here." />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: Type.sm, color: Colors.light.textSecondary, marginBottom: Spacing.two },
  list: { marginTop: Spacing.one },
  trailing: { alignItems: 'flex-end', gap: Spacing.one },
  amount: { fontSize: Type.base, fontWeight: '700', color: Colors.light.text },
});