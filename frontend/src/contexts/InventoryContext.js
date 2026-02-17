import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  addItemToDB,
  getItemsFromDB,
  updateItemInDB,
  deleteItemFromDB,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
} from '../utils/db';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total_items: 0,
    serviceable: 0,
    pending_repair: 0,
    beyond_repair: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async (filters = {}) => {
    setLoading(true);
    try {
      if (isOnline) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.item_type) params.append('item_type', filters.item_type);
        if (filters.search) params.append('search', filters.search);

        const response = await axios.get(`${API}/items?${params}`);
        setItems(response.data);
        
        // Update IndexedDB
        for (const item of response.data) {
          await addItemToDB(item);
        }
      } else {
        // Load from IndexedDB
        const localItems = await getItemsFromDB();
        setItems(localItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      // Fallback to local DB
      const localItems = await getItemsFromDB();
      setItems(localItems);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (isOnline) {
        const response = await axios.get(`${API}/stats`);
        setStats(response.data);
      } else {
        // Calculate stats from local DB
        const localItems = await getItemsFromDB();
        setStats({
          total_items: localItems.length,
          serviceable: localItems.filter(i => i.status === 'Serviceable').length,
          pending_repair: localItems.filter(i => i.status === 'Pending Repair').length,
          beyond_repair: localItems.filter(i => i.status === 'Beyond Economic Repair').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createItem = async (itemData) => {
    try {
      if (isOnline) {
        const response = await axios.post(`${API}/items`, itemData);
        await addItemToDB(response.data);
        await fetchItems();
        await fetchStats();
        return response.data;
      } else {
        // Create item locally
        const newItem = {
          ...itemData,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await addItemToDB(newItem);
        await addToSyncQueue({ type: 'CREATE', data: itemData });
        await fetchItems();
        await fetchStats();
        return newItem;
      }
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (serialNumber, updateData) => {
    try {
      if (isOnline) {
        const response = await axios.put(`${API}/items/${serialNumber}`, updateData);
        await updateItemInDB(response.data);
        await fetchItems();
        await fetchStats();
        return response.data;
      } else {
        // Update item locally
        const localItems = await getItemsFromDB();
        const item = localItems.find(i => i.serial_number === serialNumber);
        if (item) {
          const updatedItem = { ...item, ...updateData, updated_at: new Date().toISOString() };
          await updateItemInDB(updatedItem);
          await addToSyncQueue({ type: 'UPDATE', serial_number: serialNumber, data: updateData });
          await fetchItems();
          await fetchStats();
          return updatedItem;
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteItem = async (serialNumber, itemId) => {
    try {
      if (isOnline) {
        await axios.delete(`${API}/items/${serialNumber}`);
        await deleteItemFromDB(itemId);
        await fetchItems();
        await fetchStats();
      } else {
        // Delete locally
        await deleteItemFromDB(itemId);
        await addToSyncQueue({ type: 'DELETE', serial_number: serialNumber });
        await fetchItems();
        await fetchStats();
      }
    } catch (error) {
      throw error;
    }
  };

  const syncData = async () => {
    if (!isOnline) return;

    try {
      const queue = await getSyncQueue();
      
      for (const action of queue) {
        try {
          if (action.type === 'CREATE') {
            await axios.post(`${API}/items`, action.data);
          } else if (action.type === 'UPDATE') {
            await axios.put(`${API}/items/${action.serial_number}`, action.data);
          } else if (action.type === 'DELETE') {
            await axios.delete(`${API}/items/${action.serial_number}`);
          }
        } catch (error) {
          console.error('Error syncing action:', error);
        }
      }

      await clearSyncQueue();
      await fetchItems();
      await fetchStats();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const value = {
    items,
    stats,
    isOnline,
    loading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    syncData,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};