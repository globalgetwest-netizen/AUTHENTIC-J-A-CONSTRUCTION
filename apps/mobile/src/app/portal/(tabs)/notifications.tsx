import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { EmptyState, ErrorState, ListRow, Screen, SectionTitle, Spinner } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { formatDateTime, label } from '@/lib/format';
import { useAsyncData } from '@/lib/use-async-data';
import type { NotificationItem } from '@/api/types';
import { useAuth } from '@/state/auth';

export default function NotificationsScreen() {
  const { request } = useAuth();

  const load = useMemo(
    () => () =>
      request<{ data: NotificationItem[]; meta: { totalUnread: number } }>('/staff/notifications').then((view) => view.data),
    [request],
  );
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <Screen scroll>
      <SectionTitle>Alerts</SectionTitle>
      <Text style={styles.lead}>Payroll, quotes and account activity.</Text>

      {status === 'loading' ? <Spinner label="Loading alerts…" /> : null}
      {status === 'error' ? <ErrorState message={error ?? 'Could not load notifications.'} onRetry={reload} /> : null}
      {status === 'success' ? (
        data && data.length > 0 ? (
          <View style={styles.list}>
            {data.map((n) => (
              <ListRow
                key={n.id}
                title={n.title}
                subtitle={`${label(n.type)} · ${formatDateTime(n.createdAt)}${n.body ? `\n${n.body}` : ''}`}
                trailing={n.readAt ? null : <View style={styles.unreadDot} />}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No notifications" subtitle="You're all caught up." />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: Type.sm, color: Colors.light.textSecondary, marginBottom: Spacing.two },
  list: { marginTop: Spacing.one },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand.blue },
});