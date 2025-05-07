import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PrivateRegisterPage } from './privateRegister';
import { LandingPage } from './landingPage';
import { SelectCredentialsPage } from './selectCredentials';
import { DashboardPage } from './dashboard';
import { TailwindTest } from './TailwindTest';
import { ContractProvider } from '../context/ContractContext';

export function Home() {
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
    </ContractProvider>
  );
}
