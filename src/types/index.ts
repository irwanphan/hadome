export interface ReceiptData {
  id: string;
  date: Date;
  merchant: string;
  total: number;
  category: string;
  items: ReceiptItem[];
  imageUrl?: string;
  rawText?: string;
  confidence?: number;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ScanResult {
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DashboardStats {
  totalExpenses: number;
  monthlyExpenses: number;
  categoryBreakdown: CategoryExpense[];
  recentReceipts: ReceiptData[];
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface OCRConfig {
  language: string;
  whitelist?: string;
  blacklist?: string;
}

export interface AppSettings {
  defaultCurrency: string;
  autoCategorize: boolean;
  saveImages: boolean;
  ocrLanguage: string;
}
