import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './ui/components/AppShell';
import { Account } from './ui/screens/Account';
import { Home } from './ui/screens/Home';
import { Landing } from './ui/screens/Landing';
import { LearnDeck } from './ui/screens/LearnDeck';
import { ModePicker } from './ui/screens/ModePicker';
import { Practice } from './ui/screens/Practice';
import { Privacy } from './ui/screens/Privacy';
import { Progress } from './ui/screens/Progress';
import { RoundScreen, UnitRoundScreen } from './ui/screens/RoundScreen';
import { ResetPassword } from './ui/screens/ResetPassword';
import { Results } from './ui/screens/Results';
import { UnitScreen } from './ui/screens/UnitScreen';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/unit/:unitId" element={<UnitScreen />} />
          <Route path="/unit/:unitId/learn" element={<LearnDeck />} />
          <Route path="/unit/:unitId/practice" element={<UnitRoundScreen kind="practice" />} />
          <Route path="/unit/:unitId/check" element={<UnitRoundScreen kind="check" />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/play/:level" element={<ModePicker />} />
          <Route path="/play/:level/:mode" element={<RoundScreen />} />
          <Route path="/results/:roundId" element={<Results />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>
    </Routes>
  );
}
