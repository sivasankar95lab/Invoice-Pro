import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, FileText, 
  ScrollText, History, LogOut, Menu, X, 
  Plus, Trash2, Edit, Save, Printer, Search, 
  Download, Share2, MoreHorizontal, RefreshCcw,
  Sparkles, CheckCircle, AlertCircle, Upload, ArrowRightLeft,
  Filter, Receipt, Mail, MessageCircle, Loader, Database, Copy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import QRCode from 'qrcode';
import { Storage } from './services/storage';
import { formatCurrency, formatDate, generateDocNumber, numberToWords } from './utils';
import { AppLogo, Favicon, COMPANY_LOGO_URL, LOGIN_PASSWORD, CUSTOMER_TAG_COLORS } from './constants';
import { Company, Customer, Document, LineItem, PrintType, ActivityLog } from './types';
import { getBusinessInsights } from './services/geminiService';

// --- Helper Functions ---

const calculateLineItem = (item: LineItem) => {
  const base = item.quantity * item.unitPrice;
  const discount = item.discountType === 'percentage' 
    ? base * (item.discountValue / 100) 
    : item.discountValue;
  const taxable = Math.max(0, base - discount);
  // Tax is calculated on taxable value
  const tax = taxable * (item.gstRate / 100);
  return { base, discount, taxable, tax };
};

const calculateDocTotals = (doc: Document) => {
  const isQuote = doc.type === 'quotation';
  return doc.items.reduce((acc, item) => {
    const { taxable, tax, discount } = calculateLineItem(item);
    return {
      taxable: acc.taxable + taxable,
      tax: acc.tax + (isQuote ? 0 : tax),
      discount: acc.discount + discount
    };
  }, { taxable: 0, tax: 0, discount: 0 });
};

// --- Components ---

const ParticlesBackground = ({ children }: { children?: React.ReactNode }) => {
  useEffect(() => {
    if ((window as any).tsParticles) {
      (window as any).tsParticles.load("tsparticles", {
        background: { color: { value: "#f0fdf4" } },
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: true, mode: "grab" },
            resize: true
          },
          modes: { grab: { distance: 140, links: { opacity: 1 } } }
        },
        particles: {
          color: { value: "#2e7d31" },
          links: { color: "#4caf50", distance: 150, enable: true, opacity: 0.5, width: 1 },
          move: { enable: true, speed: 2 },
          number: { density: { enable: true, area: 800 }, value: 80 },
          opacity: { value: 0.5 },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 5 } }
        },
        detectRetina: true
      });
    }
  }, []);

  return <div id="tsparticles" className="fixed inset-0 z-0 pointer-events-none" />;
};

const SidebarItem = ({ icon: Icon, label, path, isActive, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg mb-1
      ${isActive 
        ? 'bg-emerald-100 text-emerald-800 font-medium shadow-sm' 
        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${colors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <Loader className="animate-spin text-emerald-600" size={32} />
  </div>
);

// --- Pages ---

// 1. Login Page
const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === LOGIN_PASSWORD) {
      Storage.login();
      Storage.addLog('Login', 'User logged in');
      navigate('/dashboard');
    } else {
      setError('Invalid Password');
      const form = document.getElementById('login-form');
      form?.classList.add('animate-shake');
      setTimeout(() => form?.classList.remove('animate-shake'), 500);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <div className="relative z-10 bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-emerald-100">
        <div className="flex justify-center mb-6">
          <AppLogo className="w-48" />
        </div>
        <h2 className="text-2xl font-bold text-center text-emerald-900 mb-6">Welcome Back</h2>
        
        <form id="login-form" onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter admin password"
            />
          </div>
          
          {error && (
            <div className="flex items-center text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-emerald-200 transform active:scale-95 duration-150"
          >
            Access Dashboard
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
          Protected by Invoice Pro Security
        </div>
      </div>
    </div>
  );
};

// 2. Dashboard
const Dashboard = () => {
  const [stats, setStats] = useState<any>({ customers: 0, invoices: 0, pendingQuotes: 0, revenue: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dbStatus, setDbStatus] = useState<'ok' | 'missing_table' | 'error'>('ok');
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoadingData(true);
        
        // Check Remote DB Health
        const health = await Storage.checkRemoteHealth();
        setDbStatus(health);

        const customers = (await Storage.getCustomers()).length;
        const docs = await Storage.getDocuments();
        const invoices = docs.filter(d => d.type === 'invoice');
        const quotes = docs.filter(d => d.type === 'quotation' && d.status === 'draft');
        
        const revenue = invoices.reduce((acc, inv) => {
          const { taxable, tax } = calculateDocTotals(inv);
          return acc + taxable + tax;
        }, 0);

        setStats({ customers, invoices: invoices.length, pendingQuotes: quotes.length, revenue });

        // Prepare chart data (Monthly Revenue)
        const monthlyData: any = {};
        invoices.forEach(inv => {
          const date = new Date(inv.date);
          const month = date.toLocaleString('default', { month: 'short' });
          const { taxable, tax } = calculateDocTotals(inv);
          const amount = taxable + tax;
          monthlyData[month] = (monthlyData[month] || 0) + amount;
        });

        const data = Object.keys(monthlyData).map(key => ({ name: key, value: monthlyData[key] }));
        setChartData(data);
      } finally {
        setLoadingData(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleGetInsight = async () => {
    setLoadingInsight(true);
    const result = await getBusinessInsights();
    setInsight(result);
    setLoadingInsight(false);
  };

  const copySQL = () => {
    const sql = `create table if not exists app_data (key text primary key, value jsonb); alter table app_data enable row level security; create policy "Public Access" on app_data for all using (true);`;
    navigator.clipboard.writeText(sql);
    alert("SQL Copied to clipboard!");
  };

  const quickActions = [
    { label: 'Create Company', icon: Building2, path: '/companies', color: 'blue' },
    { label: 'Create Customer', icon: Users, path: '/customers', color: 'emerald' },
    { label: 'Create Quotation', icon: ScrollText, path: '/quotations', color: 'amber' },
    { label: 'Create Invoice', icon: FileText, path: '/invoices', color: 'purple' },
  ];

  if (loadingData) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <button 
          onClick={handleGetInsight}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {loadingInsight ? <RefreshCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* DB Health Alert */}
      {dbStatus === 'missing_table' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                <Database size={24} />
             </div>
             <div className="flex-1">
               <h3 className="text-lg font-bold text-orange-800 mb-1">Remote Database Setup Required</h3>
               <p className="text-sm text-orange-700 mb-4">
                 Your application is using local storage because the remote database table is missing. 
                 To sync data across devices, please run the following SQL in your Supabase SQL Editor:
               </p>
               <div className="bg-gray-800 text-gray-100 p-4 rounded-lg font-mono text-xs relative group">
                 <button onClick={copySQL} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 p-1 rounded text-white" title="Copy SQL">
                    <Copy size={14} />
                 </button>
                 <code className="whitespace-pre-wrap">
                   {`create table if not exists app_data (key text primary key, value jsonb);\nalter table app_data enable row level security;\ncreate policy "Public Access" on app_data for all using (true);`}
                 </code>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const ColorIcon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path, { state: { createNew: true } })}
              className={`p-4 rounded-xl border border-gray-100 bg-white/80 hover:bg-white hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3 group`}
            >
              <div className={`p-3 rounded-full bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                <ColorIcon size={24} className={`text-${action.color}-600`} />
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</span>
            </button>
          );
        })}
      </div>

      {insight && (
        <div className="bg-indigo-50/90 backdrop-blur border border-indigo-100 p-4 rounded-xl text-indigo-900 shadow-sm">
          <h3 className="font-semibold mb-2 flex items-center"><Sparkles size={16} className="mr-2"/> AI Analysis</h3>
          <p className="text-sm whitespace-pre-line">{insight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Customers" value={stats.customers} color="emerald" />
        <StatCard icon={FileText} title="Total Invoices" value={stats.invoices} color="blue" />
        <StatCard icon={ScrollText} title="Pending Quotes" value={stats.pendingQuotes} color="amber" />
        <StatCard icon={Building2} title="Monthly Revenue" value={formatCurrency(stats.revenue)} color="purple" />
      </div>

      <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6 text-gray-700">Revenue Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f0fdf4' }}
              />
              <Bar dataKey="value" fill="#4caf50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }: any) => {
  const colorClasses: any = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

// 3. Activity Log
const Logs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await Storage.getLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  const downloadLogs = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toLocaleString()}] ${l.action}: ${l.details} (User: ${l.user})`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${Date.now()}.txt`;
    a.click();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-10">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Activity Logs</h2>
        <div className="flex space-x-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full"
            />
          </div>
          <button onClick={downloadLogs} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-6 py-3 font-medium text-gray-800">{log.action}</td>
                <td className="px-6 py-3 text-gray-600">{log.details}</td>
                <td className="px-6 py-3 text-gray-500">{log.user}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">No logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 4. Print Template Component
const PrintTemplate = ({ doc, companies, customers, printType, onClose }: any) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isUpiQr, setIsUpiQr] = useState(false);

  if (!doc) return null;

  const company = companies.find((c: Company) => c.id === doc.companyId) || {};
  const customer = customers.find((c: Customer) => c.id === doc.customerId) || {};
  const isQuotation = printType === PrintType.QUOTATION;
  
  const { taxable, tax, discount } = calculateDocTotals(doc);
  const grandTotal = taxable + tax - (doc.globalDiscountValue || 0);

  const titleMap: any = {
    [PrintType.INVOICE]: "INVOICE",
    [PrintType.TAX_INVOICE]: "TAX INVOICE",
    [PrintType.DELIVERY_CHALLAN]: "DELIVERY CHALLAN",
    [PrintType.QUOTATION]: "QUOTATION"
  };

  const termsContent = doc.terms || company.defaultTerms;

  useEffect(() => {
    const generateQR = async () => {
      try {
        setQrCodeUrl('');
        setIsUpiQr(false);

        if (printType === PrintType.QUOTATION) return;

        let text = '';
        const isInvoiceType = printType === PrintType.INVOICE || printType === PrintType.TAX_INVOICE;
        
        if (isInvoiceType) {
            if (company.vpa) {
                const payeeAddress = company.vpa;
                const payeeName = encodeURIComponent(company.name);
                const amount = grandTotal.toFixed(2);
                text = `upi://pay?pa=${payeeAddress}&pn=${payeeName}&am=${amount}`;
                setIsUpiQr(true);
            } else {
                return;
            }
        } else {
           text = `${company.name}\n${titleMap[printType]} #${doc.documentNumber}\nDate: ${formatDate(doc.date)}\nCustomer: ${customer.name}\nAmount: ${formatCurrency(grandTotal)}`;
           setIsUpiQr(false);
        }

        if (text) {
          const url = await QRCode.toDataURL(text, { 
            margin: 1, 
            width: 148, 
            color: { dark: '#2e7d31', light: '#ffffff' },
            errorCorrectionLevel: 'H'
          });
          setQrCodeUrl(url);
        }
      } catch (e) {
        console.error("QR Generation Error", e);
      }
    };
    generateQR();
  }, [doc, company, customer, grandTotal, printType]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-4 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl mx-auto relative print:shadow-none print:w-full">
        <button onClick={onClose} className="absolute top-4 right-4 bg-red-100 p-2 rounded-full text-red-600 hover:bg-red-200 print:hidden">
          <X size={24} />
        </button>
        <button onClick={() => window.print()} className="absolute top-4 right-16 bg-emerald-100 p-2 rounded-full text-emerald-600 hover:bg-emerald-200 print:hidden">
          <Printer size={24} />
        </button>

        <div className="p-10 h-full flex flex-col justify-between font-serif text-sm">
          <div>
            <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-6 mb-6">
              <div className="flex items-start gap-4 w-2/3">
                 {company.logo && <img src={company.logo} alt="Logo" className="h-24 w-24 object-contain" />}
                 <div className="flex flex-col justify-center">
                   <h1 className="text-2xl font-bold text-emerald-900 uppercase leading-tight">{company.name}</h1>
                   <p className="text-gray-600 whitespace-pre-line mt-2">{company.address}</p>
                   <p className="text-gray-600 mt-1 font-medium">GSTIN: {company.gstin}</p>
                   <p className="text-gray-600">Contact: {company.phone}</p>
                 </div>
              </div>
              <div className="w-1/3 text-right">
                <h2 className="text-3xl font-bold text-emerald-700 mb-4">{titleMap[printType]}</h2>
                <p><strong>#:</strong> {doc.documentNumber}</p>
                <p><strong>Date:</strong> {formatDate(doc.date)}</p>
                {printType === PrintType.DELIVERY_CHALLAN && doc.transportMode && (
                  <>
                    <p><strong>Transport:</strong> {doc.transportMode}</p>
                    <p><strong>Vehicle:</strong> {doc.vehicleNumber}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg mb-8 border border-emerald-100">
              <h3 className="text-emerald-800 font-bold mb-2">BILL TO:</h3>
              <p className="font-semibold text-lg">{customer.companyName || customer.name}</p>
              <p className="text-gray-600 whitespace-pre-line">{customer.address}</p>
              {customer.gstin && <p className="mt-1">GSTIN: <span className="font-medium">{customer.gstin}</span></p>}
              {customer.phone && <p>Contact: {customer.phone}</p>}
            </div>

            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="p-3 text-left text-xs uppercase tracking-wider rounded-tl-md">#</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wider">Description</th>
                  {!isQuotation && <th className="p-3 text-center text-xs uppercase tracking-wider">HSN/SAC</th>}
                  <th className="p-3 text-center text-xs uppercase tracking-wider">Qty</th>
                  {printType !== PrintType.DELIVERY_CHALLAN && (
                    <>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">Rate</th>
                      <th className="p-3 text-right text-xs uppercase tracking-wider">Disc.</th>
                      {printType === PrintType.TAX_INVOICE && <th className="p-3 text-right text-xs uppercase tracking-wider">GST %</th>}
                      <th className="p-3 text-right text-xs uppercase tracking-wider rounded-tr-md">Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {doc.items.map((item: LineItem, index: number) => {
                  const { discount, taxable } = calculateLineItem(item);
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">{item.description}</td>
                      {!isQuotation && <td className="p-3 text-center">{item.hsnSac}</td>}
                      <td className="p-3 text-center">{item.quantity}</td>
                      {printType !== PrintType.DELIVERY_CHALLAN && (
                        <>
                          <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-3 text-right text-red-500">{discount > 0 ? `-${formatCurrency(discount)}` : '-'}</td>
                          {printType === PrintType.TAX_INVOICE && <td className="p-3 text-right">{item.gstRate}%</td>}
                          <td className="p-3 text-right font-semibold">{formatCurrency(taxable)}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {printType !== PrintType.DELIVERY_CHALLAN && (
              <div className="flex justify-end mb-8">
                <div className="w-1/2 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Taxable Amount:</span>
                    <span>{formatCurrency(taxable)}</span>
                  </div>
                  {printType === PrintType.TAX_INVOICE && (
                    <div className="flex justify-between text-gray-600">
                      <span>Total Tax:</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  )}
                   {doc.globalDiscountValue > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Additional Discount:</span>
                      <span>-{formatCurrency(doc.globalDiscountValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xl text-emerald-800 pt-3 border-t border-gray-300">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {printType !== PrintType.DELIVERY_CHALLAN && (
              <div className="mb-8 flex gap-6 items-start">
                 <div className="flex-1">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount in Words</p>
                   <p className="italic text-gray-800 font-medium bg-gray-50 p-2 rounded">{numberToWords(Math.round(grandTotal))}</p>
                 </div>
                 
                 {!isQuotation && company.bankName && (
                    <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                       <p className="font-bold text-emerald-800 mb-1">Bank Details</p>
                       <p><span className="font-medium">Bank:</span> {company.bankName}</p>
                       <p><span className="font-medium">A/C No:</span> {company.accountNumber}</p>
                       <p><span className="font-medium">IFSC:</span> {company.ifsc}</p>
                       {company.branch && <p><span className="font-medium">Branch:</span> {company.branch}</p>}
                       {company.vpa && <p><span className="font-medium">UPI ID:</span> {company.vpa}</p>}
                    </div>
                 )}
                 
                 <div className="flex-none">
                    {qrCodeUrl && (
                      <div className="flex flex-col items-center">
                        <div className="relative border border-gray-200 p-1 rounded bg-white">
                           <img src={qrCodeUrl} alt="Scan QR" className="w-24 h-24" />
                           {isUpiQr && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <div className="bg-white p-0.5 rounded-sm shadow-sm">
                                 <img 
                                   src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" 
                                   alt="UPI" 
                                   className="w-6 h-6 object-contain"
                                 />
                               </div>
                             </div>
                           )}
                        </div>
                        <p className="text-[10px] text-center text-gray-500 mt-1 font-mono">
                          {isUpiQr ? company.vpa : "Scan Me"}
                        </p>
                      </div>
                    )}
                 </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-4 border-t pt-4">
              <h4 className="font-bold text-gray-700 mb-2">Terms & Conditions:</h4>
              {termsContent ? (
                 <p className="whitespace-pre-line">{termsContent}</p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Goods once sold will not be taken back.</li>
                  <li>Interest @18% p.a. will be charged if payment is delayed.</li>
                  <li>Subject to local jurisdiction.</li>
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-end mt-10 mb-6">
              <div className="text-center">
                {company.signature && <img src={company.signature} alt="Sig" className="h-16 object-contain mb-2 mx-auto" />}
                <p className="font-bold text-emerald-900">{company.name}</p>
                <p className="text-xs text-gray-500">Authorized Signatory</p>
              </div>
            </div>
            <div className="border-t pt-4 text-center text-xs text-gray-400">
               <p className="mb-1">This is a computer generated {
                  printType === PrintType.QUOTATION ? 'quotation' : 
                  printType === PrintType.DELIVERY_CHALLAN ? 'delivery challan' : 'invoice'
               }.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. MasterPage (Company/Customer)
const MasterPage = ({ type }: { type: 'company' | 'customer' }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const location = useLocation();

  useEffect(() => {
    loadData();
    if (location.state && (location.state as any).createNew) {
      setEditing({});
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [type, location]);

  const loadData = async () => {
    setLoading(true);
    if (type === 'company') {
      const res = await Storage.getCompanies();
      setData(res);
    } else {
      const res = await Storage.getCustomers();
      setData(res);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const item: any = Object.fromEntries(formData.entries());
    item.id = editing?.id || Date.now().toString();

    if (type === 'company' && editing) {
       item.logo = editing.logo;
       item.signature = editing.signature;
    }
    if (type === 'customer' && editing?.colorTag) {
        item.colorTag = editing.colorTag;
    }

    if (type === 'company') await Storage.saveCompany(item);
    else await Storage.saveCustomer(item);

    setShowModal(false);
    setEditing(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will be permanently deleted.')) {
      if (type === 'company') await Storage.deleteCompany(id);
      else await Storage.deleteCustomer(id); 
      loadData();
    }
  };

  const handleFile = (e: any, field: string) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditing((prev: any) => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const filtered = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (type === 'customer' && item.colorTag?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 capitalize">{type} Management</h1>
        <button onClick={() => { setEditing({}); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center">
          <Plus size={18} className="mr-2" /> Add New
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white/90 backdrop-blur p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                 {item.companyName && <p className="text-sm text-gray-500">{item.companyName}</p>}
                 {item.colorTag && <div className="w-3 h-3 rounded-full mt-1" style={{backgroundColor: item.colorTag}} />}
               </div>
               <div className="flex space-x-2">
                 <button onClick={() => { setEditing(item); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={18} /></button>
                 <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
               </div>
             </div>
             <div className="text-sm text-gray-600 space-y-1">
                <p>{item.address}</p>
                <p>Phone: {item.phone}</p>
                <p>GST: {item.gstin}</p>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editing?.id ? 'Edit' : 'Add'} {type === 'company' ? 'Company' : 'Customer'}
              </h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" defaultValue={editing?.name} placeholder="Name" required className="p-2 border rounded" />
                {type === 'customer' && <input name="companyName" defaultValue={editing?.companyName} placeholder="Business Name" className="p-2 border rounded" />}
                <input name="phone" defaultValue={editing?.phone} placeholder="Phone" className="p-2 border rounded" />
                <input name="email" defaultValue={editing?.email} placeholder="Email" className="p-2 border rounded" />
                <input name="gstin" defaultValue={editing?.gstin} placeholder="GSTIN" className="p-2 border rounded" />
                <input name="pan" defaultValue={editing?.pan} placeholder="PAN" className="p-2 border rounded" />
                
                {type === 'customer' && (
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-600 mb-2">Color Tag</label>
                    <div className="flex gap-3">
                       {CUSTOMER_TAG_COLORS.map(color => (
                         <button
                           type="button"
                           key={color}
                           onClick={() => setEditing({...editing, colorTag: color})}
                           className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editing?.colorTag === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                           style={{backgroundColor: color}}
                         />
                       ))}
                    </div>
                  </div>
                )}

                {type === 'company' && (
                   <>
                     <input name="bankName" defaultValue={editing?.bankName} placeholder="Bank Name" className="p-2 border rounded" />
                     <input name="accountNumber" defaultValue={editing?.accountNumber} placeholder="Account Number" className="p-2 border rounded" />
                     <input name="ifsc" defaultValue={editing?.ifsc} placeholder="IFSC Code" className="p-2 border rounded" />
                     <input name="branch" defaultValue={editing?.branch} placeholder="Branch Name" className="p-2 border rounded" />
                     <input name="vpa" defaultValue={editing?.vpa} placeholder="UPI VPA (e.g. abc@upi)" className="p-2 border rounded" />
                   </>
                )}
              </div>
              <textarea name="address" defaultValue={editing?.address} placeholder="Address" className="w-full p-2 border rounded h-20" />
              
              {type === 'company' && (
                <div className="space-y-4">
                  <textarea name="defaultTerms" defaultValue={editing?.defaultTerms} placeholder="Default Terms & Conditions" className="w-full p-2 border rounded h-20" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 rounded text-center">
                      <p className="mb-2 font-medium">Logo</p>
                      <input type="file" onChange={(e) => handleFile(e, 'logo')} className="text-sm" />
                      {editing?.logo && <img src={editing.logo} className="mt-2 h-20 mx-auto object-contain" alt="preview" />}
                    </div>
                    <div className="border p-4 rounded text-center">
                      <p className="mb-2 font-medium">Signature</p>
                      <input type="file" onChange={(e) => handleFile(e, 'signature')} className="text-sm" />
                      {editing?.signature && <img src={editing.signature} className="mt-2 h-16 mx-auto object-contain" alt="preview" />}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. Document Editor (Invoice/Quote)
const DocumentEditor = ({ mode, initialData, onClose }: any) => {
  const isQuote = mode === 'quotation';
  const [doc, setDoc] = useState<Document>(initialData); // Initialized below in useEffect to handle async doc number
  const [loading, setLoading] = useState(!initialData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const init = async () => {
      const [cCust, cComp] = await Promise.all([
        Storage.getCustomers(),
        Storage.getCompanies()
      ]);
      setCustomers(cCust);
      setCompanies(cComp);

      if (!initialData) {
        const count = await Storage.getNextDocumentCount(mode);
        setDoc({
            id: Date.now().toString(),
            documentNumber: generateDocNumber(mode, count),
            type: mode,
            date: new Date().toISOString().split('T')[0],
            customerId: '',
            companyId: '',
            items: [],
            status: 'draft',
            globalDiscountType: 'percentage',
            globalDiscountValue: 0,
            terms: '',
            createdAt: Date.now()
        });
      }
      setLoading(false);
    };
    init();
  }, [mode, initialData]);

  useEffect(() => {
    if (!loading && doc?.companyId && !doc.terms) {
       const company = companies.find(c => c.id === doc.companyId);
       if (company?.defaultTerms) {
          setDoc(prev => ({ ...prev, terms: company.defaultTerms }));
       }
    }
  }, [doc?.companyId, loading, companies]);

  const addItem = () => {
    setDoc(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(),
        description: '',
        hsnSac: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: isQuote ? 0 : 18,
        discountType: 'percentage',
        discountValue: 0
      }]
    }));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...doc.items];
    (newItems[index] as any)[field] = value;
    setDoc(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    setDoc(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const save = async () => {
    if (!doc.companyId || !doc.customerId) {
      alert("Please select Company and Customer");
      return;
    }
    await Storage.saveDocument(doc);
    onClose();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-gray-100 z-40 overflow-y-auto">
      <div className="max-w-6xl mx-auto bg-white min-h-screen shadow-xl p-8 relative">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800 capitalize">{initialData ? 'Edit' : 'New'} {mode}</h1>
          <div className="space-x-3">
             <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
             <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center"><Save size={18} className="mr-2"/> Save</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
           <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Document No</label>
             <input value={doc.documentNumber} readOnly className="w-full p-2 bg-gray-50 border rounded font-mono" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
             <input type="date" value={doc.date} onChange={e => setDoc({...doc, date: e.target.value})} className="w-full p-2 border rounded" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
             <select value={doc.status} onChange={e => setDoc({...doc, status: e.target.value as any})} className="w-full p-2 border rounded uppercase">
               <option value="draft">Draft</option>
               <option value="sent">Sent</option>
               <option value="paid">Paid</option>
               <option value="converted">Converted</option>
             </select>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
           <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">From (Company)</label>
              <select value={doc.companyId} onChange={e => setDoc({...doc, companyId: e.target.value})} className="w-full p-2 border rounded">
                 <option value="">Select Company</option>
                 {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">To (Customer)</label>
              <select value={doc.customerId} onChange={e => setDoc({...doc, customerId: e.target.value})} className="w-full p-2 border rounded">
                 <option value="">Select Customer</option>
                 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
               <tr>
                 <th className="p-3 w-10">#</th>
                 <th className="p-3 w-1/4">Item Description</th>
                 {!isQuote && <th className="p-3 w-24">HSN/SAC</th>}
                 <th className="p-3 w-16 text-center">Qty</th>
                 <th className="p-3 w-24 text-right">Price</th>
                 <th className="p-3 w-32 text-center">Discount</th>
                 {!isQuote && <th className="p-3 w-16 text-right">GST %</th>}
                 <th className="p-3 w-24 text-right">Total</th>
                 <th className="p-3 w-10"></th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {doc.items.map((item, i) => {
                 const { taxable, tax } = calculateLineItem(item);
                 const lineTotal = taxable + (isQuote ? 0 : tax);
                 return (
                   <tr key={item.id}>
                      <td className="p-3 text-center">{i + 1}</td>
                      <td className="p-3"><input className="w-full p-1 border rounded" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></td>
                      {!isQuote && <td className="p-3"><input className="w-full p-1 border rounded" value={item.hsnSac} onChange={e => updateItem(i, 'hsnSac', e.target.value)} /></td>}
                      <td className="p-3"><input type="number" className="w-full p-1 border rounded text-center" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value))} /></td>
                      <td className="p-3"><input type="number" className="w-full p-1 border rounded text-right" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value))} /></td>
                      
                      {/* Discount Column */}
                      <td className="p-3">
                        <div className="flex items-center space-x-1">
                          <input 
                            type="number" 
                            className="w-full p-1 border rounded text-right" 
                            value={item.discountValue} 
                            onChange={e => updateItem(i, 'discountValue', parseFloat(e.target.value) || 0)} 
                          />
                          <select 
                            className="p-1 border rounded bg-gray-50 text-xs"
                            value={item.discountType}
                            onChange={e => updateItem(i, 'discountType', e.target.value)}
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">₹</option>
                          </select>
                        </div>
                      </td>

                      {!isQuote && <td className="p-3"><input type="number" className="w-full p-1 border rounded text-right" value={item.gstRate} onChange={e => updateItem(i, 'gstRate', parseFloat(e.target.value))} /></td>}
                      <td className="p-3 text-right font-medium">{formatCurrency(lineTotal)}</td>
                      <td className="p-3 text-center"><button onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
          <div className="p-3 bg-gray-50 border-t">
            <button onClick={addItem} className="text-emerald-600 font-medium flex items-center text-sm hover:underline"><Plus size={16} className="mr-1"/> Add Line Item</button>
          </div>
        </div>
        
        {mode === 'invoice' && (
           <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-yellow-50 border border-yellow-100 rounded">
              <div>
                 <label className="text-xs font-bold text-gray-600">Transport Mode</label>
                 <input value={doc.transportMode || ''} onChange={e => setDoc({...doc, transportMode: e.target.value})} className="w-full p-1 border rounded text-sm" placeholder="e.g. Road" />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-600">Vehicle Number</label>
                 <input value={doc.vehicleNumber || ''} onChange={e => setDoc({...doc, vehicleNumber: e.target.value})} className="w-full p-1 border rounded text-sm" placeholder="XX-00-XX-0000" />
              </div>
           </div>
        )}

        <div className="mb-8">
           <label className="block text-sm font-medium text-gray-600 mb-1">Terms & Conditions</label>
           <textarea 
             value={doc.terms || ''} 
             onChange={e => setDoc({...doc, terms: e.target.value})} 
             className="w-full p-2 border rounded h-24" 
             placeholder="Enter custom terms and conditions..."
           />
        </div>
      </div>
    </div>
  );
};

// 7. Documents List View
const DocumentList = ({ type }: { type: 'invoice' | 'quotation' }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editorDoc, setEditorDoc] = useState<Document | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<{ doc: Document, type: PrintType } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [d, c, comp] = await Promise.all([
        Storage.getDocuments(),
        Storage.getCustomers(),
        Storage.getCompanies()
      ]);
      setDocs(d.filter(doc => doc.type === type));
      setCustomers(c);
      setCompanies(comp);
      setLoading(false);
    };
    load();
    
    if (location.state && (location.state as any).createNew) {
      handleCreate();
      window.history.replaceState({}, document.title);
    }
  }, [type, isEditorOpen, location]);

  const handleCreate = () => {
    setEditorDoc(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (doc: Document) => {
    setEditorDoc(doc);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await Storage.deleteDocument(id);
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleConvert = async (doc: Document) => {
    if (window.confirm("Convert this quotation to a new invoice?")) {
      const newInvoice: Document = {
        ...doc,
        id: Date.now().toString(),
        documentNumber: generateDocNumber('invoice', await Storage.getNextDocumentCount('invoice')),
        type: 'invoice',
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      };
      await Storage.saveDocument(newInvoice);
      
      const updatedQuote = { ...doc, status: 'converted' as const };
      await Storage.saveDocument(updatedQuote);
      
      setDocs(prev => prev.map(d => d.id === doc.id ? updatedQuote : d));
      alert(`Converted to Invoice ${newInvoice.documentNumber}`);
    }
  };

  const handleShare = (doc: Document, platform: 'email' | 'whatsapp') => {
    const customer = customers.find(c => c.id === doc.customerId);
    if (!customer) return alert('Customer details not found');
    
    const { taxable, tax } = calculateDocTotals(doc);
    const total = taxable + tax - (doc.globalDiscountValue || 0);
    const text = `Dear ${customer.name},\n\nPlease find attached ${doc.type.toUpperCase()} #${doc.documentNumber} dated ${formatDate(doc.date)} for Amount ${formatCurrency(total)}.\n\nRegards,\nInvoice Pro`;
    
    if (platform === 'email') {
      if (!customer.email) return alert('Customer email not found');
      window.open(`mailto:${customer.email}?subject=${doc.type.toUpperCase()} ${doc.documentNumber}&body=${encodeURIComponent(text)}`);
    } else {
       const phone = customer.phone?.replace(/\D/g, '');
       const url = phone 
         ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
         : `https://wa.me/?text=${encodeURIComponent(text)}`;
       window.open(url, '_blank');
    }
  };

  const filteredDocs = docs.filter(doc => {
    const customer = customers.find(c => c.id === doc.customerId);
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.date.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold capitalize text-gray-800">{type}s</h1>
         <button onClick={handleCreate} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center">
            <Plus size={18} className="mr-2" /> Create New
         </button>
      </div>

      <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search Number, Customer, Date..." 
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
           <thead className="bg-gray-50 text-gray-600 font-medium">
             <tr>
               <th className="px-6 py-3">Date</th>
               <th className="px-6 py-3">Number</th>
               <th className="px-6 py-3">Customer</th>
               <th className="px-6 py-3">Amount</th>
               <th className="px-6 py-3">Status</th>
               <th className="px-6 py-3 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {filteredDocs.map(doc => {
                const customer = customers.find(c => c.id === doc.customerId);
                const { taxable, tax } = calculateDocTotals(doc);
                const total = taxable + tax - (doc.globalDiscountValue || 0);
                
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                     <td className="px-6 py-3">{formatDate(doc.date)}</td>
                     <td className="px-6 py-3 font-medium">{doc.documentNumber}</td>
                     <td className="px-6 py-3">{customer?.name || 'Unknown'}</td>
                     <td className="px-6 py-3">{formatCurrency(total)}</td>
                     <td className="px-6 py-3"><StatusBadge status={doc.status} /></td>
                     <td className="px-6 py-3 text-right space-x-2 flex justify-end items-center">
                        <div className="flex items-center gap-1 mr-2">
                           <button title="Share Email" onClick={() => handleShare(doc, 'email')} className="text-gray-400 hover:text-blue-500"><Mail size={16}/></button>
                           <button title="Share WhatsApp" onClick={() => handleShare(doc, 'whatsapp')} className="text-gray-400 hover:text-green-500"><MessageCircle size={16}/></button>
                        </div>

                        {type === 'quotation' && (
                           <button title="Convert to Invoice" onClick={() => handleConvert(doc)} className="text-purple-500 hover:text-purple-700 p-1">
                              <ArrowRightLeft size={18} />
                           </button>
                        )}
                        
                        <button title="Edit" onClick={() => handleEdit(doc)} className="text-blue-500 hover:text-blue-700 p-1">
                          <Edit size={18} />
                        </button>

                        <button title="Delete" onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={18} />
                        </button>

                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                        {type === 'invoice' && (
                           <>
                              <button title="Print Invoice" onClick={() => setPrintDoc({ doc, type: PrintType.INVOICE })} className="text-gray-500 hover:text-emerald-600 p-1"><Receipt size={18}/></button>
                              <button title="Delivery Challan" onClick={() => setPrintDoc({ doc, type: PrintType.DELIVERY_CHALLAN })} className="text-gray-500 hover:text-blue-600 p-1"><ScrollText size={18}/></button>
                              <button title="Tax Invoice" onClick={() => setPrintDoc({ doc, type: PrintType.TAX_INVOICE })} className="text-gray-500 hover:text-purple-600 p-1"><FileText size={18}/></button>
                           </>
                        )}
                        {type === 'quotation' && (
                            <button title="Print Quote" onClick={() => setPrintDoc({ doc, type: PrintType.QUOTATION })} className="text-gray-500 hover:text-emerald-600 p-1"><Printer size={18}/></button>
                        )}
                     </td>
                  </tr>
                );
             })}
             {filteredDocs.length === 0 && (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No matching {type}s found.</td>
               </tr>
             )}
           </tbody>
        </table>
      </div>

      {isEditorOpen && <DocumentEditor mode={type} initialData={editorDoc} onClose={() => setIsEditorOpen(false)} />}
      
      {printDoc && (
        <PrintTemplate 
           doc={printDoc.doc} 
           companies={companies} 
           customers={customers} 
           printType={printDoc.type}
           onClose={() => setPrintDoc(null)} 
        />
      )}
    </div>
  );
};

// --- Layout & Main ---

const CompanyLogo = ({ className }: { className?: string }) => (
  <img src={COMPANY_LOGO_URL} alt="Company" className={`object-contain opacity-50 ${className}`} />
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if(window.confirm("Logout?")) {
       Storage.logout();
       navigate('/');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Building2, label: 'Companies', path: '/companies' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: ScrollText, label: 'Quotations', path: '/quotations' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: History, label: 'Activity Log', path: '/logs' },
  ];

  return (
    <div className="flex h-screen relative">
      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 w-64 h-full bg-white/90 backdrop-blur border-r border-gray-200 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <AppLogo className="h-8 w-auto" />
           </div>
           <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
           {menuItems.map(item => (
             <SidebarItem 
               key={item.path} 
               {...item} 
               isActive={location.pathname === item.path} 
               onClick={() => { navigate(item.path); setIsSidebarOpen(false); }} 
             />
           ))}
        </nav>
        
        {/* Logout at bottom */}
        <div className="p-4 border-t border-gray-100 mt-auto">
           <SidebarItem icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/90 backdrop-blur h-16 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
           <button className="md:hidden text-gray-600" onClick={() => setIsSidebarOpen(true)}>
             <Menu />
           </button>
           <div className="flex-1 text-right flex justify-end items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span>System Online</span>
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-20 relative z-10">
           {children}
        </div>
        {/* Fixed Company Logo at Bottom Right */}
        <div className="fixed bottom-4 right-4 z-0 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 pointer-events-none">
           <CompanyLogo className="w-32" />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  if (!Storage.isAuthenticated()) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <HashRouter>
      <ParticlesBackground />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><MasterPage type="company" /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><MasterPage type="customer" /></ProtectedRoute>} />
        <Route path="/quotations" element={<ProtectedRoute><DocumentList type="quotation" /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><DocumentList type="invoice" /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
}