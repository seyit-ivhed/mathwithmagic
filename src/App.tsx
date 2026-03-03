import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Capture the hash before any other scripts (like Supabase Auth) might strip it
const initialHash = typeof window !== 'undefined' ? window.location.hash : '';

const RootRedirect = () => {
  const location = useLocation();
  const hash = location.hash || initialHash;

  if (hash.includes('type=recovery')) {
    return <Navigate to={`/reset-password${hash}`} replace />;
  }

  return <Navigate to="/chronicle" replace />;
};

function AppContent() {
  const { isInitializing, error, retry } = useInitializeGame();

  useAnonymousLoginTrigger();

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
