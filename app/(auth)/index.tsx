/**
 * Auth Index - Redirects to login
 */

import { Redirect } from 'expo-router';

export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}
