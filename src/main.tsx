import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initClientErrorMonitoring } from './services/errorMonitoringService.ts';
import './index.css';

initClientErrorMonitoring();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <LanguageProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </LanguageProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

