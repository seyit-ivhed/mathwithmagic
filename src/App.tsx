import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdventurePage from './features/adventure/AdventurePage';
import { ChronicleBook } from './features/chronicle/ChronicleBook';
import { ResetPasswordPage } from './features/chronicle/components/ResetPasswordPage';
import EncounterPage from './features/encounter/EncounterPage';
import PuzzlePage from './features/encounter/PuzzlePage';
import MathTestPage from './features/math/MathTestPage';
import Layout from './components/Layout';
import { useInitializeGame } from './hooks/useInitializeGame';
import { useAnonymousLoginTrigger } from './hooks/useAnonymousLoginTrigger';
import { LoadingScreen } from './components/LoadingScreen';
import { AdventureGuard } from './components/guards/AdventureGuard';
import { BackgroundMusic } from './components/audio/BackgroundMusic';
import { RootRedirect } from './components/RootRedirect';
import { analyticsService } from './services/analytics.service';

function AppContent() {
  const { isInitializing, error, retry } = useInitializeGame();

  useAnonymousLoginTrigger();

  useEffect(() => {
    let ended = false;
    const handleSessionEnd = () => {
      if (ended) return;
      ended = true;
      analyticsService.trackEventBeacon('session_ended', {
        duration_ms: analyticsService.getSessionDurationMs(),
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSessionEnd();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleSessionEnd);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleSessionEnd);
    };
  }, []);

  if (isInitializing || error) {
    return <LoadingScreen error={error} onRetry={retry} />;
  }

  return (
    <>
      <BackgroundMusic />
      <Routes>
        <Route element={<Layout />}>
          {/* Unified Entry Point */}
          <Route path="/" element={<RootRedirect />} />

          {/* Chronicle Routes */}
          <Route path="/chronicle" element={<ChronicleBook />} />
          <Route path="/chronicle/:pageId" element={<ChronicleBook />} />

          {/* Password Reset Route */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Adventure Routes */}
          <Route path="/map/:adventureId" element={
            <AdventureGuard>
              <AdventurePage />
            </AdventureGuard>
          } />
          <Route path="/encounter/:adventureId/:nodeIndex" element={
            <AdventureGuard>
              <EncounterPage />
            </AdventureGuard>
          } />
          <Route path="/puzzle/:adventureId/:nodeIndex" element={
            <AdventureGuard>
              <PuzzlePage />
            </AdventureGuard>
          } />
          <Route path="/math-debug" element={<MathTestPage />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
