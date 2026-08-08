import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { Badge, Card, GhostButton, Row, Screen, SectionTitle } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useAsyncData } from '@/lib/use-async-data';
import type { ClientProfile, StaffProfile } from '@/api/types';
import { useAuth } from '@/state/auth';

function prefixed(seed: string): string {
  return `#${seed.slice(0, 6).toUpperCase()}`;
}

export default function ProfileScreen() {
  const { firstName, lastName, email, roles, isStaff, isClient, isAdmin, request, signOut } = useAuth();

  type IdentityProfile = StaffProfile | ClientProfile;

  const identity = useMemo(
    () => () =>
      request<IdentityProfile>(isStaff || isAdmin ? '/staff/profile' : '/client/profile'),
    [isStaff, isAdmin, request],
  );

  const { data, status, error } = useAsyncData(identity);

  function confirmSignOut() {
    Alert.alert('Sign out', 'Do you want to sign out of the portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  const roleLabel = isAdmin ? 'ADMIN' : isStaff ? 'STAFF' : isClient ? 'CLIENT' : 'MEMBER';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName?.[0] ?? 'A'}{lastName?.[0] ?? ''}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{firstName} {lastName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.roleRow}>
            <Badge value={roleLabel} />
          </View>
        </View>
      </View>

      <SectionTitle>Your account</SectionTitle>
      <Card>
        <Row label="Roles">
          <View style={styles.badgeRow}>
            {roles.map((r) => (
              <Badge key={r} value={r} />
            ))}
          </View>
        </Row>
      </Card>

      <SectionTitle>Identity</SectionTitle>
      {status === 'loading' ? <Text style={styles.muted}>Loading profile…</Text> : null}
      {status === 'error' ? <Text style={styles.error}>{error}</Text> : null}
      {status === 'success' && data ? (
        <Card>
          {'employee' in data ? (
            'employee' in data && data.employee ? (
              <>
                <Row label="Employee code">
                  <Text style={styles.value}>{data.employee.employeeCode}</Text>
                </Row>
                <Row label="Department">
                  <Text style={styles.value}>{data.employee.department?.name ?? '—'}</Text>
                </Row>
                <Row label="Position">
                  <Text style={styles.value}>{data.employee.position?.title ?? '—'}</Text>
                </Row>
                <Row label="Branch">
                  <Text style={styles.value}>{data.employee.branch?.name ?? '—'}</Text>
                </Row>
              </>
            ) : (
              <Text style={styles.muted}>No linked employee record.</Text>
            )
          ) : data.client ? (
            <>
              <Row label="Client">
                <Text style={styles.value}>{data.client.name}</Text>
              </Row>
              <Row label="Reference">
                <Text style={styles.value}>{prefixed(data.client.id)}</Text>
              </Row>
            </>
          ) : (
            <Text style={styles.muted}>No linked client record.</Text>
          )}
        </Card>
      ) : null}

      <View style={styles.actions}>
        <GhostButton title="Sign out" variant="danger" onPress={confirmSignOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: Type.xl, fontWeight: '800' },
  headerText: { flex: 1, gap: Spacing.half },
  roleRow: { flexDirection: 'row', marginTop: Spacing.half },
  name: { fontSize: Type.lg, fontWeight: '800', color: Colors.light.text },
  email: { fontSize: Type.sm, color: Colors.light.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'flex-end' },
  muted: { fontSize: Type.sm, color: Colors.light.textSecondary },
  error: { fontSize: Type.sm, color: Colors.brand.red },
  value: { fontSize: Type.base, fontWeight: '600', color: Colors.light.text },
  actions: { marginTop: Spacing.three },
});