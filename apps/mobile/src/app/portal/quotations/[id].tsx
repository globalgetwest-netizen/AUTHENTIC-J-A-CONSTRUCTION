import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { Badge, Card, ErrorState, Row, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { formatDate, formatMoney, label } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { Quotation } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function QuotationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useAuth();

  const load = useMemo(() => () => request<Quotation>(`/client/quotations/${id}`), [request, id]);
  const { data: quotation, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      {status === 'loading' ? <Spinner label="Loading quotation…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load this quotation.'} onRetry={reload} /> : null}
      {status === 'success' && quotation ? (
        <View style={styles.gap}>
          <View>
            <Text style={styles.muted}>{quotation.quotationNo}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.kicker}>{quotation.title}</Text>
              <Badge value={quotation.status} />
            </View>
            <Text style={styles.total}>{formatMoney(quotation.total)}</Text>
          </View>

          <SectionTitle>Line items</SectionTitle>
          <Card>
            {quotation.items?.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  <Text style={styles.muted}>
                    {item.quantity} × {formatMoney(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.value}>{formatMoney(item.amount)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{formatMoney(quotation.total)}</Text>
            </View>
          </Card>

          <Card>
            {quotation.client ? (
              <Row label="Client">
                <Text style={styles.value}>{quotation.client.name}</Text>
              </Row>
            ) : null}
            {quotation.project ? (
              <Row label="Project">
                <Text style={styles.value}>
                  {quotation.project.title ?? quotation.project.name ?? label(quotation.project.id)}
                </Text>
              </Row>
            ) : null}
            <Row label="Validity">
              <Text style={styles.value}>{quotation.validUntil ? formatDate(quotation.validUntil) : '—'}</Text>
            </Row>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.three },
  muted: { fontSize: Type.sm, color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  kicker: { fontSize: Type['2xl'], fontWeight: '800', color: Colors.light.text },
  total: { fontSize: Type.xl, fontWeight: '800', color: Colors.brand.blue },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  itemMain: { flex: 1, gap: Spacing.half },
  itemTitle: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.three },
  totalLabel: { fontSize: Type.sm, fontWeight: '700', color: Colors.light.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
});