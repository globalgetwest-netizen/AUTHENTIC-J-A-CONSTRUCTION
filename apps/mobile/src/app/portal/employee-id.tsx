import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { Badge, Card, EmptyState, ErrorState, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Radii, Spacing, Type } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { EmployeeIdCard } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function EmployeeIdScreen() {
  const { request } = useAuth();

  const load = useMemo(() => () => request<EmployeeIdCard | null>('/staff/employee-id'), [request]);
  const { data: card, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      <SectionTitle>My employee ID</SectionTitle>
      <Text style={styles.lead}>
        Your physical ID card is verified against this record at the gatehouse.
      </Text>

      {status === 'loading' ? <Spinner label="Loading ID card…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load your ID card.'} onRetry={reload} /> : null}
      {status === 'success' ? (
        card ? (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardBrand}>
                <Text style={styles.cardBrandText}>AUTHENTIC J.A.</Text>
                <Text style={styles.cardBrandSub}>CONSTRUCTION LTD</Text>
              </View>
              <Badge value={card.status} />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardCode}>{card.cardNumber}</Text>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {card.employee?.firstName?.[0] ?? 'A'}
                  {card.employee?.lastName?.[0] ?? ''}
                </Text>
              </View>
              <Text style={styles.cardName}>
                {card.employee?.firstName} {card.employee?.lastName}
              </Text>
              <Text style={styles.cardMeta}>
                {card.employee?.position?.title ?? 'Staff'}{card.employee?.department ? ` · ${card.employee.department.name}` : ''}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Verified staff · {card.employee?.branch?.name ?? 'Head Office'}</Text>
              {card.expiresAt ? (
                <Text style={styles.cardFooterText}>Valid until {formatDate(card.expiresAt)}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <EmptyState
            title="No ID card yet"
            subtitle="Your verified ID card will appear here once issued."
          />
        )
      ) : null}

      {card ? (
        <>
          <SectionTitle>Card details</SectionTitle>
          <Card>
            <Text style={styles.value}>
              Scan the QR by a guard at the gatehouse to confirm who you are on site.
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: Type.sm, color: Colors.light.textSecondary, marginBottom: Spacing.two },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.three,
    backgroundColor: Colors.brand.green,
  },
  cardBrand: { gap: Spacing.half },
  cardBrandText: { color: '#ffffff', fontWeight: '800', fontSize: Type.base, letterSpacing: 1 },
  cardBrandSub: { color: 'rgba(255,255,255,0.8)', fontSize: Type.xs, letterSpacing: 2 },
  cardBody: {
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardCode: { fontSize: Type.xs, color: Colors.light.textSecondary, letterSpacing: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: Type.xl, fontWeight: '800' },
  cardName: { fontSize: Type.lg, fontWeight: '800', color: Colors.light.text },
  cardMeta: { fontSize: Type.sm, color: Colors.light.textSecondary },
  cardFooter: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.backgroundSelected,
    alignItems: 'center',
    gap: Spacing.half,
  },
  cardFooterText: { fontSize: Type.xs, color: Colors.light.textSecondary },
  value: { fontSize: Type.sm, color: Colors.light.textSecondary, lineHeight: 20 },
});