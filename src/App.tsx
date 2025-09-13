import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { IntlProvider } from '@progress/kendo-react-intl';
import { NotificationGroup } from '@progress/kendo-react-notification';
import { Loader } from '@progress/kendo-react-indicators';

// Components
import Layout from './components/Layout/Layout';
import ScanPage from './pages/ScanPage/ScanPage';
import ExpensesPage from './pages/ExpensesPage/ExpensesPage';
import AnalyticsPage from './pages/AnalyticsPage/AnalyticsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';

// Services
import { StorageService } from './services/storageService';
import { demoReceipts } from './data/demoData';

// Types
import { ReceiptData, AppSettings } from './types';

// Styles
import './App.css';

const App: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: 'IDR',
    autoCategorize: true,
    saveImages: true,
    ocrLanguage: 'ind'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Load saved receipts
      const savedReceipts = await StorageService.getReceipts();
      
      // If no saved receipts, load demo data
      if (savedReceipts.length === 0) {
        setReceipts(demoReceipts);
        await StorageService.saveReceipts(demoReceipts);
      } else {
        setReceipts(savedReceipts);
      }
      
      // Load settings
      const savedSettings = await StorageService.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
      showNotification('Error loading app data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const addReceipt = async (receipt: ReceiptData) => {
    try {
      const newReceipt = { ...receipt, id: Date.now().toString() };
      const updatedReceipts = [...receipts, newReceipt];
      
      setReceipts(updatedReceipts);
      await StorageService.saveReceipts(updatedReceipts);
      
      showNotification('Receipt added successfully!', 'success');
      return newReceipt;
    } catch (error) {
      console.error('Error adding receipt:', error);
      showNotification('Error adding receipt', 'error');
      throw error;
    }
  };

  const updateReceipt = async (id: string, updatedReceipt: Partial<ReceiptData>) => {
    try {
      const updatedReceipts = receipts.map(receipt => 
        receipt.id === id ? { ...receipt, ...updatedReceipt } : receipt
      );
      
      setReceipts(updatedReceipts);
      await StorageService.saveReceipts(updatedReceipts);
      
      showNotification('Receipt updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating receipt:', error);
      showNotification('Error updating receipt', 'error');
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      const updatedReceipts = receipts.filter(receipt => receipt.id !== id);
      
      setReceipts(updatedReceipts);
      await StorageService.saveReceipts(updatedReceipts);
      
      showNotification('Receipt deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      showNotification('Error deleting receipt', 'error');
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      setSettings(updatedSettings);
      await StorageService.saveSettings(updatedSettings);
      
      showNotification('Settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      showNotification('Error updating settings', 'error');
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        <p>Loading Receipt Scanner...</p>
      </div>
    );
  }

  return (
    <IntlProvider locale="en-US">
      <Router>
        <div className="app">
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/analytics" replace />} />
              <Route 
                path="/scan" 
                element={
                  <ScanPage 
                    onReceiptScanned={addReceipt}
                    settings={settings}
                    showNotification={showNotification}
                  />
                } 
              />
              <Route 
                path="/expenses" 
                element={
                  <ExpensesPage 
                    receipts={receipts}
                    onUpdateReceipt={updateReceipt}
                    onDeleteReceipt={deleteReceipt}
                    settings={settings}
                  />
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <AnalyticsPage 
                    receipts={receipts}
                    settings={settings}
                  />
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <SettingsPage 
                    settings={settings}
                    onUpdateSettings={updateSettings}
                  />
                } 
              />
              <Route 
                path="/expense/:id?" 
                element={
                  <ExpenseForm 
                    receipts={receipts}
                    onSaveReceipt={addReceipt}
                    onUpdateReceipt={updateReceipt}
                    settings={settings}
                  />
                } 
              />
            </Routes>
          </Layout>
          
          <NotificationGroup
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 10000
            }}
          />
        </div>
      </Router>
    </IntlProvider>
  );
};

export default App;