import { HashRouter } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes';
import { isSupabaseConfigured } from './data/supabaseClient';
import { ConfigMissing } from './ui/screens/ConfigMissing';

export function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
