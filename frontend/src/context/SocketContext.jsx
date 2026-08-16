import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [tier2Update, setTier2Update] = useState(null);
  const [thresholdUpdate, setThresholdUpdate] = useState(null);
  const [autoflowStatus, setAutoflowStatus] = useState(null);

  useEffect(() => {
    // In Vite dev proxy, default origin connects directly to backend
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join:admin');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('admin:new_transaction', (txn) => {
      setLatestTransaction(txn);
    });

    s.on('admin:new_alert', (alert) => {
      setLatestAlert(alert);
    });

    s.on('admin:tier2_update', (update) => {
      setTier2Update(update);
    });

    s.on('admin:threshold_update', (update) => {
      setThresholdUpdate(update);
    });

    s.on('admin:autoflow_status', (status) => {
      setAutoflowStatus(status);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      latestTransaction,
      latestAlert,
      tier2Update,
      thresholdUpdate,
      autoflowStatus
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
