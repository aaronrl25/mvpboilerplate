import { Redirect } from 'expo-router';

import { useAppSelector } from '@/hooks/useRedux';

export default function Index() {
  const { user } = useAppSelector((state) => state.auth);

  // Redirect based on authentication status
  return user ? <Redirect href="/home" /> : <Redirect href="/auth" />;
}