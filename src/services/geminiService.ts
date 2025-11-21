import { createClient } from '@supabase/supabase-js';
import { Company, Customer, Document, ActivityLog } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://nnazbmwzqvzzuyecvlik.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uYXpibXd6cXZ6enV5ZWN2bGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzAwNzksImV4cCI6MjA3OTIwNjA3OX0.ENU4UT-QnWL2G1D3Lvpq-YLDgnorqJaeEgChirwaV28';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const KEYS = {
  AUTH: 'ip_auth',
  COMPANIES: 'ip_companies',
  CUSTOMERS: 'ip_customers',
  DOCUMENTS: 'ip_documents',
  LOGS: 'ip_logs'
};

// Helper to fetch from remote with local fallback
const fetchSyncedData = async <T>(key: string): Promise<T[]> => {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .maybeSingle(); // Use maybeSingle to avoid error if no rows found

    if (error) {
      // If table doesn't exist, Supabase returns a specific error. 
      // We swallow this to fall back to local without noise, but we track it for health checks.
      if (error.message.includes("Could not find the table") || error.code === '42P01') {
        throw new Error("TABLE_MISSING");
      }
      console.warn(`Supabase fetch warn for ${key}:`, error.message);
      throw error;
    }

    if (data) {
      // Sync remote to local
      localStorage.setItem(key, JSON.stringify(data.value));
      return data.value as T[];
    }
  } catch (e: any) {
    if (e.message !== "TABLE_MISSING") {
      console.log(`Falling back to local storage for ${key} (Offline/Error)`);
    }
  }

  // Fallback to local
  return JSON.parse(localStorage.getItem(key) || '[]');
};

// Helper to save to both
const saveSyncedData = async <T>(key: string, data: T[]) => {
  // 1. Optimistic Local Update
  localStorage.setItem(key, JSON.stringify(data));

  // 2. Remote Update
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ key, value: data });
    
    if (error) {
       if (error.message.includes("Could not find the table") || error.code === '42P01') {
         // Silent fail for missing table, UI will handle notification
       } else {
         console.error(`Supabase save error for ${key}:`, error.message);
       }
    }
  } catch (e) {
    // Silent catch
  }
};

export const Storage = {
  // Check if remote DB is configured correctly
  checkRemoteHealth: async (): Promise<'ok' | 'missing_table' | 'error'> => {
    try {
      const { error } = await supabase.from('app_data').select('key').limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === '42P01') {
          return 'missing_table';
        }
        return 'error';
      }
      return 'ok';
    } catch {
      return 'error';
    }
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem(KEYS.AUTH) === 'true';
  },
  
  login: () => {
    localStorage.setItem(KEYS.AUTH, 'true');
  },
  
  logout: () => {
    localStorage.removeItem(KEYS.AUTH);
  },

  // Activity Logs
  addLog: async (action: string, details: string, user: string = 'Admin') => {
    const logs = await Storage.getLogs();
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      action,
      details,
      user
    };
    const updatedLogs = [newLog, ...logs];
    await saveSyncedData(KEYS.LOGS, updatedLogs);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
    return fetchSyncedData<ActivityLog>(KEYS.LOGS);
  },

  // Companies
  getCompanies: async (): Promise<Company[]> => {
    return fetchSyncedData<Company>(KEYS.COMPANIES);
  },

  saveCompany: async (company: Company) => {
    const companies = await Storage.getCompanies();
    const index = companies.findIndex(c => c.id === company.id);
    if (index >= 0) {
      companies[index] = company;
      await Storage.addLog('Update Company', `Updated company ${company.name}`);
    } else {
      companies.push(company);
      await Storage.addLog('Create Company', `Created company ${company.name}`);
    }
    await saveSyncedData(KEYS.COMPANIES, companies);
  },

  deleteCompany: async (id: string) => {
    let companies = await Storage.getCompanies();
    companies = companies.filter(c => c.id !== id);
    await saveSyncedData(KEYS.COMPANIES, companies);
    await Storage.addLog('Delete Company', `Deleted company ID ${id}`);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return fetchSyncedData<Customer>(KEYS.CUSTOMERS);
  },

  saveCustomer: async (customer: Customer) => {
    const customers = await Storage.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
      await Storage.addLog('Update Customer', `Updated customer ${customer.name}`);
    } else {
      customers.push(customer);
      await Storage.addLog('Create Customer', `Created customer ${customer.name}`);
    }
    await saveSyncedData(KEYS.CUSTOMERS, customers);
  },

  deleteCustomer: async (id: string) => {
    let customers = await Storage.getCustomers();
    customers = customers.filter(c => c.id !== id);
    await Storage.addLog('Delete Customer', `Permanently deleted customer ID ${id}`);
    await saveSyncedData(KEYS.CUSTOMERS, customers);
  },

  // Documents (Invoices/Quotes)
  getDocuments: async (): Promise<Document[]> => {
    return fetchSyncedData<Document>(KEYS.DOCUMENTS);
  },

  saveDocument: async (doc: Document) => {
    const docs = await Storage.getDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
      await Storage.addLog('Update Document', `Updated ${doc.type} ${doc.documentNumber}`);
    } else {
      docs.push(doc);
      await Storage.addLog('Create Document', `Created ${doc.type} ${doc.documentNumber}`);
    }
    await saveSyncedData(KEYS.DOCUMENTS, docs);
  },
  
  deleteDocument: async (id: string) => {
    let docs = await Storage.getDocuments();
    docs = docs.filter(d => d.id !== id);
    await saveSyncedData(KEYS.DOCUMENTS, docs);
    await Storage.addLog('Delete Document', `Deleted document ID ${id}`);
  },
  
  getNextDocumentCount: async (type: 'invoice' | 'quotation') => {
    const docs = await Storage.getDocuments();
    return docs.filter(d => d.type === type).length;
  }
};
