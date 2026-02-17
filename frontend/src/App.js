import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { InventoryProvider } from './contexts/InventoryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import './App.css';

function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/scanner" element={<Scanner />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              border: '2px solid #4B5320',
              color: '#e5e5e5',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </InventoryProvider>
  );
}

export default App;