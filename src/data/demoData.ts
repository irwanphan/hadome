import { ReceiptData } from '../types';

export const demoReceipts: ReceiptData[] = [
  {
    id: 'demo-1',
    date: new Date('2024-01-15'),
    merchant: 'Indomaret Cabang Kemang',
    total: 45000,
    category: 'Groceries',
    items: [
      { name: 'Susu Ultra 1L', price: 15000, quantity: 1 },
      { name: 'Roti Tawar', price: 12000, quantity: 1 },
      { name: 'Telur 1/2 Kg', price: 18000, quantity: 1 }
    ],
    rawText: 'INDOMARET CABANG KEMANG\nJl. Kemang Raya No. 123\nJakarta Selatan\n\nSusu Ultra 1L        15.000\nRoti Tawar           12.000\nTelur 1/2 Kg         18.000\n\nTotal: 45.000',
    confidence: 0.95
  },
  {
    id: 'demo-2',
    date: new Date('2024-01-14'),
    merchant: 'Warung Makan Sederhana',
    total: 25000,
    category: 'Food & Dining',
    items: [
      { name: 'Nasi Goreng', price: 15000, quantity: 1 },
      { name: 'Es Teh Manis', price: 5000, quantity: 1 },
      { name: 'Kerupuk', price: 5000, quantity: 1 }
    ],
    rawText: 'WARUNG MAKAN SEDERHANA\nJl. Sudirman No. 456\nJakarta Pusat\n\nNasi Goreng          15.000\nEs Teh Manis          5.000\nKerupuk               5.000\n\nTotal: 25.000',
    confidence: 0.88
  },
  {
    id: 'demo-3',
    date: new Date('2024-01-13'),
    merchant: 'SPBU Pertamina',
    total: 150000,
    category: 'Transportation',
    items: [
      { name: 'Bensin Premium', price: 150000, quantity: 1 }
    ],
    rawText: 'SPBU PERTAMINA\nJl. Gatot Subroto No. 789\nJakarta Selatan\n\nBensin Premium       150.000\nLiter: 10.5\n\nTotal: 150.000',
    confidence: 0.92
  },
  {
    id: 'demo-4',
    date: new Date('2024-01-12'),
    merchant: 'Apotek Kimia Farma',
    total: 75000,
    category: 'Healthcare',
    items: [
      { name: 'Paracetamol 500mg', price: 25000, quantity: 1 },
      { name: 'Vitamin C', price: 30000, quantity: 1 },
      { name: 'Masker Medis', price: 20000, quantity: 1 }
    ],
    rawText: 'APOTEK KIMIA FARMA\nJl. Thamrin No. 321\nJakarta Pusat\n\nParacetamol 500mg     25.000\nVitamin C             30.000\nMasker Medis          20.000\n\nTotal: 75.000',
    confidence: 0.90
  },
  {
    id: 'demo-5',
    date: new Date('2024-01-11'),
    merchant: 'Alfamart Cabang Pondok Indah',
    total: 32000,
    category: 'Groceries',
    items: [
      { name: 'Air Mineral 600ml', price: 3000, quantity: 6 },
      { name: 'Snack Coklat', price: 8000, quantity: 1 },
      { name: 'Tissue', price: 6000, quantity: 1 }
    ],
    rawText: 'ALFAMART CABANG PONDOK INDAH\nJl. Pondok Indah No. 654\nJakarta Selatan\n\nAir Mineral 600ml     3.000 x6\nSnack Coklat          8.000\nTissue                6.000\n\nTotal: 32.000',
    confidence: 0.87
  },
  {
    id: 'demo-6',
    date: new Date('2024-01-10'),
    merchant: 'Restoran Padang Sederhana',
    total: 85000,
    category: 'Food & Dining',
    items: [
      { name: 'Rendang', price: 25000, quantity: 1 },
      { name: 'Sambal Hijau', price: 15000, quantity: 1 },
      { name: 'Nasi Putih', price: 10000, quantity: 2 },
      { name: 'Es Jeruk', price: 10000, quantity: 2 }
    ],
    rawText: 'RESTORAN PADANG SEDERHANA\nJl. Fatmawati No. 987\nJakarta Selatan\n\nRendang               25.000\nSambal Hijau          15.000\nNasi Putih            10.000 x2\nEs Jeruk              10.000 x2\n\nTotal: 85.000',
    confidence: 0.93
  },
  {
    id: 'demo-7',
    date: new Date('2024-01-09'),
    merchant: 'Toko Elektronik',
    total: 250000,
    category: 'Shopping',
    items: [
      { name: 'Kabel USB-C', price: 50000, quantity: 1 },
      { name: 'Power Bank 10000mAh', price: 200000, quantity: 1 }
    ],
    rawText: 'TOKO ELEKTRONIK\nJl. Mangga Dua No. 147\nJakarta Utara\n\nKabel USB-C           50.000\nPower Bank 10000mAh  200.000\n\nTotal: 250.000',
    confidence: 0.89
  },
  {
    id: 'demo-8',
    date: new Date('2024-01-08'),
    merchant: 'Cafe Kopi Kenangan',
    total: 35000,
    category: 'Food & Dining',
    items: [
      { name: 'Kopi Latte', price: 20000, quantity: 1 },
      { name: 'Croissant', price: 15000, quantity: 1 }
    ],
    rawText: 'CAFE KOPI KENANGAN\nJl. Senayan No. 258\nJakarta Pusat\n\nKopi Latte            20.000\nCroissant             15.000\n\nTotal: 35.000',
    confidence: 0.91
  }
];

export const getDemoStats = () => {
  const totalExpenses = demoReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const monthlyExpenses = demoReceipts
    .filter(r => r.date.getMonth() === new Date().getMonth())
    .reduce((sum, receipt) => sum + receipt.total, 0);
  
  return {
    totalExpenses,
    monthlyExpenses,
    totalReceipts: demoReceipts.length,
    averageReceipt: totalExpenses / demoReceipts.length
  };
};
