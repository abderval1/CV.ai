import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CurrencyProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CurrencyProvider>
  </AuthProvider>
);
