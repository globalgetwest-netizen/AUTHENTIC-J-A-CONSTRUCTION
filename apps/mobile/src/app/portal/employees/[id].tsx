import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { Badge, Card, ErrorState, Row, Screen, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useAsyncData } from '@/lib/use-async-data';
import type { EmployeeListItem } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useAuth();

  const load = useMemo(() => () => request<EmployeeListItem>(`/employees/${id}`), [request, id]);
  const { data: employee, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      {status === 'loading' ? <Spinner label="Loading employee…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load this employee.'} onRetry={reload} /> : null}
      {status === 'success' && employee ? (
        <View style={styles.gap}>
          <View>
            <Text style={styles.muted}>{employee.employeeCode}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.kicker}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Badge value={employee.status} />
            </View>
          </View>

          <Card>
            <Row label="Department">
              <Text style={styles.value}>{employee.department?.name ?? '—'}</Text>
            </Row>
            <Row label="Position">
              <Text style={styles.value}>{employee.position?.title ?? '—'}</Text>
            </Row>
            <Row label="Branch">
              <Text style={styles.value}>{employee.branch?.name ?? '—'}</Text>
            </Row>
            <Row label="Phone">
              <Text style={styles.value}>{employee.phone ?? '—'}</Text>
            </Row>
            <Row label="Email">
              <Text style={styles.value}>{employee.email ?? '—'}</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  kicker: { fontSize: Type['2xl'], fontWeight: '800', color: Colors.light.text },
  value: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
});