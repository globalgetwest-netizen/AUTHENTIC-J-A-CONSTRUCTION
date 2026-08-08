import { Spinner } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { Redirect } from 'expo-router';

/**
 * Root gate: while the stored session is being loaded we show a splash; once
 * resolved, send the user to the portal (signed in) or the login screen.
 */
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') return <Spinner label="Loading session…" />;
  if (status === 'authed') return <Redirect href="/portal" />;
  return <Redirect href="/login" />;
}