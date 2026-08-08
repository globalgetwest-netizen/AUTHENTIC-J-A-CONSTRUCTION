import { Redirect, Stack } from 'expo-router';

import { Spinner } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/state/auth';

/**
 * Guarded portal. Guests are bounced to `/login`; the session-gated experience
 * lives here. The tab bar lives in the `(tabs)` group; pushed screens (payslip
 * and quotation detail, admin employee records) get a native header + back.
 */
export default function PortalLayout() {
  const { status } = useAuth();

  if (status === 'loading') return <Spinner label="Loading…" />;
  if (status === 'guest') return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="payslips/[id]"
        options={{
          headerShown: true,
          title: 'Payslip',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="quotations/[id]"
        options={{
          headerShown: true,
          title: 'Quotation',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="employees/[id]"
        options={{
          headerShown: true,
          title: 'Employee',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="employee-id"
        options={{
          headerShown: true,
          title: 'Employee ID',
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}