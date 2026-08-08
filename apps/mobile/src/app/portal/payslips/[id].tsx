import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { Badge, Card, ErrorState, Row, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { formatDate, formatMoney, label } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { Payslip } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function PayslipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useAuth();

  const load = useMemo(() => () => request<Payslip>(`/staff/payslips/${id}`), [request, id]);
  const { data: payslip, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      {status === 'loading' ? <Spinner label="Loading payslip…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load this payslip.'} onRetry={reload} /> : null}
      {status === 'success' && payslip ? (
        <View style={styles.gap}>
          <View>
            <Text style={styles.muted}>Period · {payslip.payslipNo}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.kicker}>{payslip.period?.name ?? label(payslip.status)}</Text>
              <Badge value={payslip.status} />
            </View>
            <Text style={styles.net}>
              Net pay {formatMoney(payslip.netPay)}
            </Text>
          </View>

          <SectionTitle>Earnings & taxes</SectionTitle>
          <Card>
            <Row label="Gross pay">
              <Text style={styles.value}>{formatMoney(payslip.grossPay)}</Text>
            </Row>
            {payslip.deductions ? (
              <>
                <Row label="SSNIT">
                  <Text style={styles.value}>{formatMoney(payslip.deductions.ssnit)}</Text>
                </Row>
                <Row label="PAYE / TITES">
                  <Text style={styles.value}>{formatMoney(payslip.deductions.paye)}</Text>
                </Row>
                {payslip.deductions.lines?.map((line, index) => (
                  <Row key={`${line.label ?? index}`} label={label(line.label ?? `Deduction ${index + 1}`)}>
                    <Text style={styles.value}>{formatMoney(line.amount)}</Text>
                  </Row>
                ))}
                <Row label="Total deductions">
                  <Text style={styles.mutedValue}>{formatMoney(payslip.deductions.total)}</Text>
                </Row>
              </>
            ) : null}
            <Row label="Net pay">
              <Text style={styles.net}>{formatMoney(payslip.netPay)}</Text>
            </Row>
          </Card>

          <Card>
            <Row label="Issued">
              <Text style={styles.value}>{formatDate(payslip.issuedAt)}</Text>
            </Row>
            {payslip.employee ? (
              <Row label="Employee">
                <Text style={styles.value}>
                  {payslip.employee.firstName} {payslip.employee.lastName}
                </Text>
              </Row>
            ) : null}
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
  net: { fontSize: Type.xl, fontWeight: '800', color: Colors.brand.blue },
  value: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
  mutedValue: { fontSize: Type.base, fontWeight: '600', color: Colors.light.textSecondary },
});