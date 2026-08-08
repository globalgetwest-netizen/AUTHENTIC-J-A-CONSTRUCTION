import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { Badge, EmptyState, ErrorState, ListRow, Screen, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useAsyncData } from '@/lib/use-async-data';
import type { EmployeeListItem } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function EmployeesScreen() {
  const router = useRouter();
  const { request } = useAuth();

  const load = useMemo(
    () => () => request<{ data: EmployeeListItem[]; meta: { total: number } }>('/employees?page=1&pageSize=200').then((view) => view.data),
    [request],
  );
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      <Text style={styles.title}>Team directory</Text>
      <Text style={styles.lead}>
        Everyone at AUTHENTIC J.A. Construction. Tap a record for the full profile.
      </Text>

      {status === 'loading' ? <Spinner label="Loading employees…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load employees.'} onRetry={reload} /> : null}
      {status === 'success' ? (
        data && data.length > 0 ? (
          <View style={styles.list}>
            {data.map((e) => (
              <ListRow
                key={e.id}
                title={`${e.firstName} ${e.lastName}`}
                subtitle={`${e.employeeCode} · ${e.department?.name ?? 'No department'}`}
                trailing={
                  <View style={styles.trailing}>
                    <Badge value={e.status} />
                    <Text style={styles.muted}>{e.position?.title ?? ''}</Text>
                  </View>
                }
                onPress={() => router.push(`/portal/employees/${e.id}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No employees yet" subtitle="Add staff members to build the directory." />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: Type.xl, fontWeight: '800', color: Colors.light.text },
  lead: { fontSize: Type.sm, color: Colors.light.textSecondary, marginTop: Spacing.half, marginBottom: Spacing.two },
  list: { marginTop: Spacing.one },
  trailing: { alignItems: 'flex-end', gap: Spacing.one },
  muted: { fontSize: Type.xs, color: Colors.light.textSecondary },
});