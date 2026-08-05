import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';

/**
 * Root navigator. Public web hangar is (public); authenticated experiences live
 * in role groups (auth)/(client)/(employee)/(staff)/(admin). Role-based access
 * control on routes ships in Phase 19 (Native Expo application).
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
          contentStyle: { backgroundColor: Colors.light.background },
          headerShadowVisible: false,
        }}
      />
    </>
  );
}