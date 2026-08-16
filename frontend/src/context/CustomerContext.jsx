import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCustomer = async (customerId = 'CUST-1001') => {
    try {
      const cust = await fetchAPI(`/customers/${customerId}`);
      setActiveCustomer(cust);
    } catch (err) {
      console.error('[CustomerContext] Failed to load customer:', err.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [custList, merchList] = await Promise.all([
        fetchAPI('/customers'),
        fetchAPI('/merchants')
      ]);
      setCustomers(custList);
      setMerchants(merchList);
      const defaultCust = custList.find(c => c.customerId === 'CUST-1001') || custList[0];
      setActiveCustomer(defaultCust);
    } catch (err) {
      console.error('[CustomerContext] Init error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <CustomerContext.Provider value={{
      activeCustomer,
      setActiveCustomer,
      customers,
      merchants,
      loading,
      refreshCustomer,
      loadData
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
