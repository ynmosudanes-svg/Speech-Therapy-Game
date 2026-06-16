import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { TherapyProvider } from './hooks/useTherapyStore';
import AppRoutes from './routes/AppRoutes';
import Footer from './components/Footer';

function AppShell() {
  const location = useLocation();

  const hideFooter =
    location.pathname === '/' ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/trial') ||
    location.pathname.startsWith('/library') ||
    location.pathname.startsWith('/play') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/student');


  return (
    <TherapyProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 min-h-0">
          <AppRoutes />
        </div>
        {!hideFooter && <Footer />}
      </div>
    </TherapyProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
