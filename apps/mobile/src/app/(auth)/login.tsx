import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field, Kicker, PrimaryButton } from '@/components/ui';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/state/auth';

/**
 * Sign-in screen for the portal. Talks to `/auth/login` on the self-hosted
 * API and stores the returned session via the token store.
 */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.flex}>
          <View style={styles.content}>
            <View style={styles.brand}>
              <View style={styles.logoMark}>
                <Text style={styles.logoLetter}>A</Text>
              </View>
              <Kicker>AUTHENTIC J.A. Construction</Kicker>
              <Text style={styles.headline}>Sign in to the portal</Text>
              <Text style={styles.subhead}>
                Access payslips, quotations and your project workspace.
              </Text>
            </View>

            <View style={styles.form}>
              <Field
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@authenticja.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                title="Sign in"
                loading={submitting}
                disabled={!email || !password}
                onPress={() => void onSubmit()}
              />
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flexGrow: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
  },
  brand: { gap: Spacing.two, alignItems: 'center' },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  logoLetter: { color: '#ffffff', fontSize: Type.xl, fontWeight: '800' },
  headline: {
    fontSize: Type['2xl'],
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subhead: {
    fontSize: Type.base,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: { gap: Spacing.three },
  error: { fontSize: Type.sm, color: Colors.brand.red, textAlign: 'center' },
});