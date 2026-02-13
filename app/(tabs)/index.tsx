import { Redirect } from 'expo-router';
import { useAppSelector } from '@/hooks/useRedux';

export default function Index() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)/jobs" />;
}
