import { HashRouter } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes';
import { isSupabaseConfigured } from './data/supabaseClient';
import { ConfigMissing } from './ui/screens/ConfigMissing';
import { ToastHost } from './ui/components/ToastHost';

export function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastHost />
      </AuthProvider>
    </HashRouter>
  );
}
