import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './state/store.jsx';
import { EngineState, seedCOA } from './lib/engine.js';
import Splash from './components/Splash.jsx';
import Header from './components/Header.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Navigation from './components/Navigation.jsx';
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const JournalForm = lazy(() => import('./components/JournalForm.jsx'));
const Sales = lazy(() => import('./pages/Sales.jsx'));
const Purchase = lazy(() => import('./pages/Purchase.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Suppliers = lazy(() => import('./pages/Suppliers.jsx'));
const MultiCurrency = lazy(() => import('./pages/MultiCurrency.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Receivables = lazy(() => import('./pages/Receivables.jsx'));

import MorphTransition from './components/MorphTransition.jsx';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Haluskan transisi antar halaman: bungkus Routes dengan key berdasarkan pathname
function MainRoutes(){
  const location = useLocation();
  return (
    <main key={location.pathname} className="main-content animate-fade-scale">
      <Suspense fallback={<div className="loader">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/journal" element={<JournalForm />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/multi-currency" element={<MultiCurrency />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/receivables" element={<Receivables />} />
        </Routes>
      </Suspense>
    </main>
  );
}

function App() {
  const { state, dispatch } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize the engine
    seedCOA();
    const t = setTimeout(() => setReady(true), 6000); // tampilkan Splash 6 detik
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <Splash />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className="App app-3d">
          {/* Floating Background Elements */}
          <div className="floating-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
          
          {/* Particle Effects */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="particle" 
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${15 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
          
          <Header />
          
          {/* Theme Toggle - Centered bar to avoid overlapping Instagram link */}
          <div className="theme-toggle-bar">
            <ThemeToggle />
          </div>
          
          <div className="app-layout">
            <Navigation />
            {/* Overlay morph saat pindah halaman */}
            <MorphTransition />
            {/* Ganti main statis dengan MainRoutes ber-key pathname untuk animasi halus */}
            <MainRoutes />
          </div>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
