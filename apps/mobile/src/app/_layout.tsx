import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/state/auth';

/**
 * Root navigator for the AUTHENTIC J.A. mobile app.
 *
 * The AuthProvider loads the stored token on launch (Keychain on native,
 * localStorage on web) and hands `status` to every route. `(auth)` holds the
 * login screen; `/portal` is the guarded, signed-in experience.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });