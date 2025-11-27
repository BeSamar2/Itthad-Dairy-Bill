import React, { useState, useEffect } from 'react';
import { CustomerData, BillingData } from './types';
import { generateSlip } from './services/pdfService';
import Header from './components/Header';
import InputField from './components/InputField';
import { Download, Calculator, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // --- THEME STATE ---
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- APP STATE ---
  // Default state is now BLANK to show placeholders
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    fatherName: '',
    phone: '',
    address: ''
  });

  const [billing, setBilling] = useState<BillingData>({
    month: new Date().getMonth().toString(), // 0-11
    year: new Date().getFullYear(),
    ratePerLiter: 200,
    daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(), // Auto calc current month days
    litersPerDay: 5,
    totalLiters: 0,
    totalAmount: 0,
    dueAmount: 0,
    isManualTotal: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // --- EFFECTS ---

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Auto-Calculate Days in Month when Month/Year changes
  useEffect(() => {
    const days = new Date(billing.year, parseInt(billing.month) + 1, 0).getDate();
    setBilling(prev => ({ ...prev, daysInMonth: days }));
  }, [billing.month, billing.year]);

  // Auto-calculate totals
  useEffect(() => {
    if (!billing.isManualTotal) {
      const calculatedLiters = billing.daysInMonth * billing.litersPerDay;
      setBilling(prev => ({
        ...prev,
        totalLiters: calculatedLiters,
        totalAmount: calculatedLiters * prev.ratePerLiter
      }));
    } else {
      // If manual total liters, just update amount
      setBilling(prev => ({
        ...prev,
        totalAmount: prev.totalLiters * prev.ratePerLiter
      }));
    }
  }, [billing.daysInMonth, billing.litersPerDay, billing.ratePerLiter, billing.isManualTotal, billing.totalLiters]);

  // --- HANDLERS ---

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateSlip(customer, billing);
      
      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Filename: Invoice_CustomerName_Month_Year.pdf
      const safeName = customer.name.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || 'Customer';
      link.setAttribute('download', `Invoice_${safeName}_${currentMonthName}_${billing.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to clear all data?")) {
        window.location.reload();
    }
  };

  const currentMonthName = new Date(0, parseInt(billing.month)).toLocaleString('default', { month: 'long' });
  const totalPayable = billing.totalAmount + (billing.dueAmount || 0);

  return (
    <div className="min-h-screen pb-12 transition-colors duration-200">
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Customer Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Customer Name" 
                  value={customer.name} 
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  placeholder="e.g. Samar Ahmad"
                />
                <InputField 
                  label="Father Name (Optional)" 
                  value={customer.fatherName} 
                  onChange={(e) => setCustomer({...customer, fatherName: e.target.value})}
                  placeholder="e.g. Qamar Ul Islam"
                />
                <InputField 
                  label="Mobile Number" 
                  value={customer.phone} 
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  placeholder="e.g. 0345-4243864"
                />
                <InputField 
                  label="Address" 
                  value={customer.address} 
                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                  className="md:col-span-2"
                  placeholder="e.g Chack Chattah Tehseel and district Hafizabad"
                />
              </div>
            </div>

            {/* Billing Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Milk Data & Billing</h3>
                <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 py-1 px-3 rounded-full font-medium">
                  {currentMonthName} {billing.year}
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Month Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Month</label>
                    <select 
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                      value={billing.month}
                      onChange={(e) => setBilling({...billing, month: e.target.value})}
                    >
                      {Array.from({length: 12}).map((_, i) => (
                        <option key={i} value={i}>{new Date(0, i).toLocaleString('default', {month: 'long'})}</option>
                      ))}
                    </select>
                  </div>
                  <InputField 
                    label="Year" 
                    type="number" 
                    value={billing.year} 
                    onChange={(e) => setBilling({...billing, year: parseInt(e.target.value)})}
                  />
                </div>

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Calculation Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField 
                    label="Rate per Liter (Rs)" 
                    type="number" 
                    value={billing.ratePerLiter} 
                    onChange={(e) => setBilling({...billing, ratePerLiter: parseFloat(e.target.value) || 0})}
                  />
                  
                  <InputField 
                    label="Liters per Day" 
                    type="number"
                    step="0.5" 
                    disabled={billing.isManualTotal}
                    value={billing.litersPerDay} 
                    onChange={(e) => setBilling({...billing, litersPerDay: parseFloat(e.target.value) || 0})}
                  />

                  <InputField 
                    label="Days in Month" 
                    type="number" 
                    disabled={true} // Auto-calculated now
                    value={billing.daysInMonth} 
                    className="opacity-75"
                    onChange={(e) => setBilling({...billing, daysInMonth: parseInt(e.target.value) || 0})}
                  />
                </div>

                {/* Manual Override Toggle */}
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="manualOverride"
                    checked={billing.isManualTotal}
                    onChange={(e) => setBilling({...billing, isManualTotal: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="manualOverride" className="text-sm text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                    Enter Total Liters manually (Override daily calculation)
                  </label>
                </div>

                {/* Total Liters (Calculated or Manual) */}
                 <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="Total Liters" 
                      type="number"
                      step="0.5"
                      value={billing.totalLiters}
                      disabled={!billing.isManualTotal}
                      onChange={(e) => setBilling({...billing, totalLiters: parseFloat(e.target.value) || 0})}
                      className={billing.isManualTotal ? "opacity-100" : "opacity-75"}
                    />
                    
                    <InputField 
                      label="Previous Due Amount (Optional)" 
                      type="number"
                      value={billing.dueAmount || ''}
                      onChange={(e) => setBilling({...billing, dueAmount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                 </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PREVIEW & ACTION */}
          <div className="space-y-6">
            
            {/* Live Invoice Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700 overflow-hidden sticky top-24 transition-colors">
              <div className="bg-blue-600 dark:bg-blue-700 p-6 text-white text-center transition-colors">
                <h2 className="text-3xl font-bold">Rs. {totalPayable.toLocaleString()}</h2>
                <p className="text-blue-100 text-sm mt-1">Total Payable</p>
              </div>

              <div className="p-6 space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-500" />
                  Summary
                </h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Customer:</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{customer.name || '-'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Period:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentMonthName} {billing.year}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-2"></div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Total Milk:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{billing.totalLiters.toFixed(1)} L</span>
                  </div>
                   <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Current Bill:</span>
                    <span className="font-medium text-gray-900 dark:text-white">Rs. {billing.totalAmount.toLocaleString()}</span>
                  </div>
                  {billing.dueAmount && billing.dueAmount > 0 ? (
                    <div className="flex justify-between text-red-500 dark:text-red-400">
                      <span>Previous Due:</span>
                      <span className="font-medium">+ Rs. {billing.dueAmount.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span>Generating...</span>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Download Slip
                      </>
                    )}
                  </button>

                   <button
                    onClick={handleReset}
                    className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New Slip
                  </button>
                </div>
                
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;