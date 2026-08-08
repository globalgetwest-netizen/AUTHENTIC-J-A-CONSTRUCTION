import { Tabs } from 'expo-router';

import { Colors, Type } from '@/constants/theme';
import { useAuth } from '@/state/auth';

/**
 * Bottom tab bar for the portal. Tabs are scoped to the signed-in role:
 * staff/admins see Payslips, clients see Quotations; everyone gets Home,
 * Alerts and Profile. Role-gated tabs are hidden via `href: null` so they
 * never appear (or aren't navigable) for the wrong audience.
 */
export default function PortalTabsLayout() {
  const { isStaff, isClient, isAdmin } = useAuth();
  const showPayslips = isStaff || isAdmin;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.green,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopColor: Colors.light.backgroundSelected,
        },
        tabBarLabelStyle: { fontSize: Type.xs, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="payslips"
        options={{ title: 'Payslips', href: showPayslips ? '/portal/payslips' : null }}
      />
      <Tabs.Screen
        name="quotations"
        options={{ title: 'Quotations', href: isClient ? '/portal/quotations' : null }}
      />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}