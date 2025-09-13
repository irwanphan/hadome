import Tesseract from 'tesseract.js';
import { ReceiptData, ReceiptItem, ScanResult, OCRConfig } from '../types';

export class ReceiptService {
  private static readonly DEFAULT_CONFIG: OCRConfig = {
    language: 'ind+eng',
    whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-/()[]{}@#$%&*+=<>?!"\'`~^|\\'
  };

  static async scanReceipt(imageFile: File, config: OCRConfig = this.DEFAULT_CONFIG): Promise<ScanResult> {
    try {
      // Enhanced OCR with better preprocessing for Indonesian receipts
      const { data } = await Tesseract.recognize(imageFile, config.language, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      return {
        text: data.text,
        confidence: data.confidence,
        boundingBoxes: (data as any).words?.map((word: any) => ({
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        })) || []
      };
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to process receipt image');
    }
  }

  static parseReceiptText(text: string): Partial<ReceiptData> {
    console.log('Raw OCR Text:', text); // Debug logging
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Parsed Lines:', lines); // Debug logging
    
    let merchant = '';
    let total = 0;
    let date = new Date();
    const items: ReceiptItem[] = [];
    
    // Enhanced merchant extraction for Indonesian receipts
    const merchantKeywords = [
      'toko', 'warung', 'restoran', 'cafe', 'indomaret', 'alfamart', 'lawson', 
      'family mart', 'minimarket', 'supermarket', 'mall', 'plaza', 'center',
      'pt.', 'cv.', 'ud.', 'toko', 'warung', 'kedai', 'rumah makan',
      'indomaret point', 'alfamart point', 'convenience store'
    ];
    
    // Look for merchant in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (merchantKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        merchant = line;
        break;
      }
      // If line looks like a business name (no numbers, reasonable length)
      if (line.length > 3 && line.length < 50 && !/\d/.test(line)) {
        merchant = line;
        break;
      }
    }
    
    if (!merchant && lines.length > 0) {
      merchant = lines[0];
    }

    // Enhanced date extraction for Indonesian receipts
    const datePatterns = [
      // Indonesian format: DD/MM/YYYY, DD-MM-YYYY
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,
      // Indonesian month names
      /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{2,4})/i,
      // English month names
      /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{2,4})/i,
      // ISO format
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
      // Time format: DD/MM/YYYY HH:MM
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})/
    ];
    
    const indonesianMonths = {
      'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
      'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
    };
    
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            if (pattern.source.includes('januari|februari')) {
              // Indonesian month format
              const day = parseInt(match[1]);
              const monthKey = match[2].toLowerCase() as keyof typeof indonesianMonths;
              const month = indonesianMonths[monthKey];
              const year = parseInt(match[3]) + (parseInt(match[3]) < 100 ? 2000 : 0);
              date = new Date(year, month, day);
            } else {
              // Standard format
              date = new Date(line);
            }
            if (!isNaN(date.getTime())) break;
          } catch (e) {
            // Continue to next pattern
          }
        }
      }
    }

    // Enhanced total extraction for Indonesian receipts
    const totalKeywords = [
      'total', 'jumlah', 'rp', 'grand total', 'subtotal', 'total bayar',
      'total pembayaran', 'harus dibayar', 'total belanja', 'total transaksi',
      'total belanja:', 'total:', 'jumlah:', 'rp:'
    ];
    
    // Look for total in reverse order (usually at the bottom)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      if (totalKeywords.some(keyword => lowerLine.includes(keyword))) {
        const amount = this.extractAmount(line);
        if (amount > 0) {
          total = amount;
          break;
        }
      }
    }
    
    // Special handling for Indonesian receipt format like "TOTAL BELANJA: 67,900"
    if (total === 0) {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('total belanja') || lowerLine.includes('total:')) {
          // Extract number after colon or keyword
          const match = line.match(/(?:total|jumlah|rp)[:\s]*([\d.,]+)/i);
          if (match) {
            const amount = this.extractAmount(match[1]);
            if (amount > 0) {
              total = amount;
              break;
            }
          }
        }
      }
    }

    // If no total found, look for the largest number
    if (total === 0) {
      for (const line of lines) {
        const amount = this.extractAmount(line);
        if (amount > total) {
          total = amount;
        }
      }
    }

    // Enhanced item extraction for Indonesian receipts
    for (const line of lines) {
      const amount = this.extractAmount(line);
      if (amount > 0 && amount < total && line.length > 3) {
        // Skip lines that look like totals or headers
        const lowerLine = line.toLowerCase();
        if (!totalKeywords.some(keyword => lowerLine.includes(keyword)) &&
            !lowerLine.includes('diskon') && !lowerLine.includes('ppn') &&
            !lowerLine.includes('tunai') && !lowerLine.includes('hemat')) {
          
          // Extract item name (remove price and quantity from end)
          let itemName = line.replace(/[\d.,\s]+$/, '').trim();
          
          // Handle Indonesian receipt format: "PC KELAPA JRKAND ICE 1 25000 25,000"
          const itemMatch = line.match(/^(.+?)\s+(\d+)\s+(\d+)\s+([\d.,]+)$/);
          if (itemMatch) {
            itemName = itemMatch[1].trim();
            const quantity = parseInt(itemMatch[2]) || 1;
            const unitPrice = this.extractAmount(itemMatch[3]);
            
            items.push({
              name: itemName,
              price: unitPrice,
              quantity: quantity
            });
          } else {
            // Fallback to simple extraction
            items.push({
              name: itemName,
              price: amount,
              quantity: 1
            });
          }
        }
      }
    }

    return {
      merchant: merchant || 'Unknown Merchant',
      total,
      date,
      items: items.length > 0 ? items : [{ name: 'General Purchase', price: total, quantity: 1 }],
      rawText: text,
      confidence: 0.8 // Default confidence
    };
  }

  private static extractAmount(text: string): number {
    // Enhanced amount extraction for Indonesian currency format
    
    // Handle Indonesian currency formats: "Rp 50.000", "50rb", "50.000", "50,000"
    let cleanText = text.toLowerCase();
    
    // Handle "rb" suffix (ribu)
    if (cleanText.includes('rb')) {
      const rbMatch = cleanText.match(/(\d+(?:[.,]\d+)?)\s*rb/);
      if (rbMatch) {
        return parseFloat(rbMatch[1].replace(',', '.')) * 1000;
      }
    }
    
    // Handle "jt" suffix (juta)
    if (cleanText.includes('jt')) {
      const jtMatch = cleanText.match(/(\d+(?:[.,]\d+)?)\s*jt/);
      if (jtMatch) {
        return parseFloat(jtMatch[1].replace(',', '.')) * 1000000;
      }
    }
    
    // Remove currency symbols and extract numbers
    cleanText = text.replace(/[^\d.,]/g, '');
    const parts = cleanText.split(/[.,]/);
    
    if (parts.length === 1) {
      return parseFloat(parts[0]) || 0;
    } else if (parts.length === 2) {
      // Check if it's decimal or thousands separator
      if (parts[1].length <= 2) {
        // Likely decimal
        return parseFloat(`${parts[0]}.${parts[1]}`) || 0;
      } else {
        // Likely thousands separator
        return parseFloat(`${parts[0]}${parts[1]}`) || 0;
      }
    } else if (parts.length === 3) {
      // Indonesian format: thousands.decimal (e.g., 50.000,00)
      if (parts[2].length <= 2) {
        return parseFloat(`${parts[0]}${parts[1]}.${parts[2]}`) || 0;
      } else {
        return parseFloat(`${parts[0]}${parts[1]}${parts[2]}`) || 0;
      }
    }
    
    return 0;
  }

  static categorizeReceipt(merchant: string, items: ReceiptItem[]): string {
    const merchantLower = merchant.toLowerCase();
    const itemNames = items.map(item => item.name.toLowerCase()).join(' ');
    
    // Food & Dining
    if (merchantLower.includes('restoran') || merchantLower.includes('cafe') || 
        merchantLower.includes('warung') || merchantLower.includes('makanan') ||
        itemNames.includes('makan') || itemNames.includes('minuman')) {
      return 'Food & Dining';
    }
    
    // Groceries
    if (merchantLower.includes('indomaret') || merchantLower.includes('alfamart') ||
        merchantLower.includes('minimarket') || merchantLower.includes('supermarket') ||
        itemNames.includes('susu') || itemNames.includes('roti') || itemNames.includes('beras')) {
      return 'Groceries';
    }
    
    // Transportation
    if (merchantLower.includes('bensin') || merchantLower.includes('spbu') ||
        merchantLower.includes('transport') || itemNames.includes('bensin')) {
      return 'Transportation';
    }
    
    // Healthcare
    if (merchantLower.includes('apotek') || merchantLower.includes('klinik') ||
        merchantLower.includes('rumah sakit') || itemNames.includes('obat')) {
      return 'Healthcare';
    }
    
    // Shopping
    if (merchantLower.includes('toko') || merchantLower.includes('mall') ||
        merchantLower.includes('belanja')) {
      return 'Shopping';
    }
    
    // Utilities
    if (merchantLower.includes('listrik') || merchantLower.includes('air') ||
        merchantLower.includes('internet') || merchantLower.includes('telepon')) {
      return 'Utilities';
    }
    
    return 'Other';
  }

  static formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static generateReceiptId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
