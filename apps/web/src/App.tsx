import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './components/ui/Toast.js';
import { EmailVerificationBanner } from './components/common/EmailVerificationBanner.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.js';
import { SessionsPage } from './pages/auth/SessionsPage.js';
import { DesignSystemPage } from './pages/DesignSystemPage.js';
import { LandingPage } from './pages/LandingPage.js';

const queryClient = new QueryClient();

export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <EmailVerificationBanner />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/design" element={<DesignSystemPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
