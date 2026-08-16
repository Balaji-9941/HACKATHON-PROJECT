import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { SocketProvider } from './context/SocketContext';
import HomeScreen from './components/consumer/HomeScreen';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';

function AppContent() {
  const [view, setView] = useState('consumer'); // 'consumer' or 'admin'
  const { isAuthenticated } = useAuth();

  if (view === 'admin') {
    if (!isAuthenticated) {
      return <AdminLogin onBackToConsumer={() => setView('consumer')} />;
    }
    return <AdminLayout onSwitchToConsumer={() => setView('consumer')} />;
  }

  return (
    <HomeScreen onSwitchToAdmin={() => setView('admin')} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomerProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </CustomerProvider>
    </AuthProvider>
  );
}
