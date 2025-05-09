import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ContractProvider } from './context/ContractContext';
import { LandingPage } from './pages/landingPage';
import { SelectCredentialsPage } from './pages/selectCredentials';
import { DashboardPage } from './pages/dashboard';
import { PrivateRegisterPage } from './pages/privateRegister';
import { TailwindTest } from './pages/TailwindTest';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignalsDashboard } from './pages/signalsDashboard';
import { SendSignalPage } from './pages/sendSignal';
import { ProfilePage } from './pages/profile';
import { TempZkPassportPage } from './pages/TempZkPassport';

export function App() {
  return (
    <ContractProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/test" element={<TailwindTest />} />
          <Route path="/temp-zkpassport" element={<TempZkPassportPage />} />
          
          {/* Protected setup pages */}
          <Route path="/select-credentials" element={
            <ProtectedRoute>
              <SelectCredentialsPage />
            </ProtectedRoute>
          } />
          <Route path="/contract" element={
            <ProtectedRoute>
              <PrivateRegisterPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* New mobile app-style pages */}
          <Route path="/signals-dashboard" element={
            <ProtectedRoute>
              <SignalsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/send-signal" element={
            <ProtectedRoute>
              <SendSignalPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
      <ToastContainer />
    </ContractProvider>
  );
} 