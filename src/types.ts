export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  logo: string; // Base64
  signature: string; // Base64
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  defaultTerms?: string;
  vpa?: string; // UPI ID
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  isDeleted?: boolean;
  colorTag?: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  gstRate: number; // Percentage
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface Document {
  id: string;
  documentNumber: string; // INV-YY-MM-XXX or QT-YY-MM-XXX
  type: 'invoice' | 'quotation';
  date: string;
  dueDate?: string;
  customerId: string;
  companyId: string;
  items: LineItem[];
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'converted';
  globalDiscountType: 'percentage' | 'fixed';
  globalDiscountValue: number;
  transportMode?: string;
  vehicleNumber?: string;
  notes?: string;
  terms?: string;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  user: string;
}

export enum PrintType {
  INVOICE = 'INVOICE',
  TAX_INVOICE = 'TAX_INVOICE',
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',
  QUOTATION = 'QUOTATION'
}