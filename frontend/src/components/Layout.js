import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Box, QrCode, FileText } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { isOnline } = useInventory();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Shield },
    { path: '/inventory', label: 'Inventory', icon: Box },
    { path: '/scanner', label: 'QR Scanner', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 noise-overlay">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-600 text-black text-center py-2 font-mono text-sm uppercase tracking-wider font-bold" data-testid="offline-banner">
          ⚠ OFFLINE MODE - Changes will sync when connection is restored
        </div>
      )}

      {/* Header */}
      <header className="border-b-2 border-olive-500 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-olive-500" />
              <h1 className="text-xl md:text-2xl font-heading font-bold text-olive-500 tracking-tight uppercase" data-testid="app-title">
                Kalichindi QR Code Inventory Management System
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-indicator"></div>
              <span className="text-xs font-mono uppercase text-muted-foreground">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors duration-100 ${
                    isActive
                      ? 'border-olive-500 text-olive-500 bg-olive-500/10'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-900/50'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Kalichindi Inventory System &copy; 2026 | Military Grade Asset Management
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;