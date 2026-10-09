import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { Account } from './ui/screens/Account';
import { Home } from './ui/screens/Home';
import { Landing } from './ui/screens/Landing';
import { Privacy } from './ui/screens/Privacy';
import { ResetPassword } from './ui/screens/ResetPassword';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireAuth />}>
        <Route path="/home" element={<Home />} />
        <Route path="/account" element={<Account />} />
      </Route>
    </Routes>
  );
}
