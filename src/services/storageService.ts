import { ReceiptData, AppSettings } from '../types';

export class StorageService {
  private static readonly RECEIPTS_KEY = 'kendo_receipt_scanner_receipts';
  private static readonly SETTINGS_KEY = 'kendo_receipt_scanner_settings';

  static async getReceipts(): Promise<ReceiptData[]> {
    try {
      const stored = localStorage.getItem(this.RECEIPTS_KEY);
      if (!stored) return [];
      
      const receipts = JSON.parse(stored);
      // Convert date strings back to Date objects
      return receipts.map((receipt: any) => ({
        ...receipt,
        date: new Date(receipt.date)
      }));
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  }

  static async saveReceipts(receipts: ReceiptData[]): Promise<void> {
    try {
      localStorage.setItem(this.RECEIPTS_KEY, JSON.stringify(receipts));
    } catch (error) {
      console.error('Error saving receipts:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<AppSettings | null> {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.RECEIPTS_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static async exportData(): Promise<string> {
    try {
      const receipts = await this.getReceipts();
      const settings = await this.getSettings();
      
      const exportData = {
        receipts,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (importData.receipts) {
        // Convert date strings back to Date objects
        const receipts = importData.receipts.map((receipt: any) => ({
          ...receipt,
          date: new Date(receipt.date)
        }));
        await this.saveReceipts(receipts);
      }
      
      if (importData.settings) {
        await this.saveSettings(importData.settings);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}
