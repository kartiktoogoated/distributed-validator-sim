import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from '@/pages/landing';
import AboutPage from '@/pages/about';
import DocsPage from '@/pages/docs';
import CryptoPage from '@/pages/crypto';
import ClientDashboard from '@/pages/client-dashboard';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import PricingPage from './pages/pricing';
import ValidatorDashboard from './pages/validator-dashboard';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/crypto" element={<CryptoPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/validator-dashboard/*" element={<ValidatorDashboard />} />
            <Route 
              path="/client-dashboard/*" 
              element={
                <ClientDashboard />
              } 
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;