import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './ui/components/AppShell';
import ui from './ui/components/ui.module.css';
import { Account } from './ui/screens/Account';
import { Home } from './ui/screens/Home';
import { Kiwiana } from './ui/screens/Kiwiana';
import { Landing } from './ui/screens/Landing';
import { LearnDeck } from './ui/screens/LearnDeck';
import { ModePicker } from './ui/screens/ModePicker';
import { Practice } from './ui/screens/Practice';
import { Privacy } from './ui/screens/Privacy';
import { Progress } from './ui/screens/Progress';
import { ReviewScreen, RoundScreen, UnitRoundScreen } from './ui/screens/RoundScreen';
import { ResetPassword } from './ui/screens/ResetPassword';
import { Results } from './ui/screens/Results';
import { UnitScreen } from './ui/screens/UnitScreen';

// Reference screens are only needed now and then, so they load on demand.
const Reference = lazy(() => import('./ui/screens/Reference').then((m) => ({ default: m.Reference })));
const Grammar = lazy(() => import('./ui/screens/Grammar').then((m) => ({ default: m.Grammar })));
const Pronunciation = lazy(() => import('./ui/screens/Pronunciation').then((m) => ({ default: m.Pronunciation })));
const LittleWords = lazy(() => import('./ui/screens/LittleWords').then((m) => ({ default: m.LittleWords })));
const Glossary = lazy(() => import('./ui/screens/Glossary').then((m) => ({ default: m.Glossary })));

function Loading() {
  return (
    <main className={ui.page}>
      <p role="status">Loading...</p>
    </main>
  );
}

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
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/play/:level" element={<ModePicker />} />
          <Route path="/play/:level/:mode" element={<RoundScreen />} />
          <Route path="/results/:roundId" element={<Results />} />
          <Route
            path="/reference"
            element={
              <Suspense fallback={<Loading />}>
                <Reference />
              </Suspense>
            }
          />
          <Route
            path="/grammar"
            element={
              <Suspense fallback={<Loading />}>
                <Grammar />
              </Suspense>
            }
          />
          <Route
            path="/pronunciation"
            element={
              <Suspense fallback={<Loading />}>
                <Pronunciation />
              </Suspense>
            }
          />
          <Route
            path="/glossary"
            element={
              <Suspense fallback={<Loading />}>
                <Glossary />
              </Suspense>
            }
          />
          <Route
            path="/little-words"
            element={
              <Suspense fallback={<Loading />}>
                <LittleWords />
              </Suspense>
            }
          />
          <Route path="/kiwiana" element={<Kiwiana />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>
    </Routes>
  );
}
