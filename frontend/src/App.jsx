import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TherapyProvider } from './hooks/useTherapyStore';
import AppRoutes from './routes/AppRoutes';

function AppShell() {
  return (
    <TherapyProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 min-h-0">
          <AppRoutes />
        </div>
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
