import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdventurePage from './features/adventure/AdventurePage';
import { ChronicleBook } from './features/chronicle/ChronicleBook';
import { ResetPasswordPage } from './features/chronicle/components/ResetPasswordPage';
import EncounterPage from './features/encounter/EncounterPage';
import PuzzlePage from './features/encounter/PuzzlePage';
import MathTestPage from './features/math/MathTestPage';
import Layout from './components/Layout';
import { useInitializeGame } from './hooks/useInitializeGame';
import { LoadingScreen } from './components/LoadingScreen';
import { AdventureGuard } from './components/guards/AdventureGuard';
import { BackgroundMusic } from './components/audio/BackgroundMusic';
import { RootRedirect } from './components/RootRedirect';
import { AccountPage } from './features/account/AccountPage';
import { FarewellPage } from './features/farewell/FarewellPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { TermsPage } from './features/legal/TermsPage';
import { AuthProvider } from './context/AuthContext';
import { useDisableContextMenu } from './hooks/useDisableContextMenu';

function AppContent() {
  const { isInitializing, error, retry } = useInitializeGame();
  useDisableContextMenu();

  return (
    <>
      <BackgroundMusic />
      {isInitializing || error ? (
        <LoadingScreen error={error} onRetry={retry} />
      ) : (
        <Routes>
        <Route element={<Layout />}>
          {/* Chronicle Routes */}
          <Route path="/chronicle" element={<ChronicleBook />} />
          <Route path="/chronicle/:pageId" element={<ChronicleBook />} />

          {/* Password Reset Route */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Account Management Route */}
          <Route path="/account" element={<AccountPage />} />

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
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — no game initialization required */}
          <Route path="/farewell" element={<FarewellPage />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/refund-policy" element={<Navigate to="/terms" replace />} />

          {/* All other routes go through AppContent (game initialization) */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
