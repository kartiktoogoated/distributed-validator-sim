import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from '@/pages/landing';
import ClientDashboard from '@/pages/client-dashboard';
import ValidatorDashboard from '@/pages/validator-dashboard';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup'; 
import AboutPage from '@/pages/about';
import DocsPage from '@/pages/docs';
import PricingPage from './pages/pricing';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* directly render ValidatorDashboard (with its own nested <Routes>) */}
            <Route
              path="/validator-dashboard/*"
              element={<ValidatorDashboard />}
            />

            {/* client side is still protected */}
            <Route
              path="/client-dashboard/*"
              element={<ClientDashboard />}
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
