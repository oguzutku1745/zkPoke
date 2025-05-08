import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ContractProvider } from './context/ContractContext';
import { LandingPage } from './pages/landingPage';
import { SelectCredentialsPage } from './pages/selectCredentials';
import { DashboardPage } from './pages/dashboard';
import { PrivateRegisterPage } from './pages/privateRegister';
import { TailwindTest } from './pages/TailwindTest';

export function App() {
  return (
    <ContractProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/select-credentials" element={<SelectCredentialsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contract" element={<PrivateRegisterPage />} />
          <Route path="/test" element={<TailwindTest />} />
        </Routes>
      </Router>
      <ToastContainer />
    </ContractProvider>
  );
} 