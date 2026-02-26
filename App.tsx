import React, { useState, useEffect } from 'react';
import { CustomerData, BillingData, MilkDetails } from './types';
import { generateSlip, generateSlipAsImage } from './services/pdfService';
import Header from './components/Header';
import InputField from './components/InputField';
import { Download, Calculator, RefreshCw, ChevronDown, ChevronUp, FileText, Image } from 'lucide-react';

// --- HELPER COMPONENT FOR MILK INPUTS ---
interface MilkInputSectionProps {
  title: string;
  data: MilkDetails;
  daysInMonth: number;
  onChange: (updated: MilkDetails) => void;
  colorClass: string;
}

const MilkInputSection: React.FC<MilkInputSectionProps> = ({ title, data, daysInMonth, onChange, colorClass }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Local state for inputs to allow smooth typing (handling "0." and empty strings)
  // We initialize from props, converting 0 to empty string for cleaner UI if desired, or keeping 0 if explicit.
  // Here we keep 0 as string "0" if it exists, or empty if it was 0 from default but we want placeholder to show.
  // However, usually better to show what's there.
  const [rateStr, setRateStr] = useState(data.rate > 0 ? data.rate.toString() : '');
  const [dailyStr, setDailyStr] = useState(data.dailyLiters > 0 ? data.dailyLiters.toString() : '');
  const [totalStr, setTotalStr] = useState(data.totalLiters > 0 ? data.totalLiters.toString() : '');

  // --- SYNC EFFECTS (Props -> Local State) ---
  // If the parent updates the data (e.g. reset button or auto-calc), we update local strings.
  // We check to ensure we don't overwrite user typing with same numeric value.

  useEffect(() => {
    const num = parseFloat(rateStr);
    const validNum = isNaN(num) ? 0 : num;
    if (validNum !== data.rate) {
      setRateStr(data.rate === 0 ? '' : data.rate.toString());
    }
  }, [data.rate]);

  useEffect(() => {
    const num = parseFloat(dailyStr);
    const validNum = isNaN(num) ? 0 : num;
    if (validNum !== data.dailyLiters) {
      setDailyStr(data.dailyLiters === 0 ? '' : data.dailyLiters.toString());
    }
  }, [data.dailyLiters]);

  useEffect(() => {
    const num = parseFloat(totalStr);
    const validNum = isNaN(num) ? 0 : num;
    // For total, we want to allow auto-updates from calculation to reflect here
    if (validNum !== data.totalLiters) {
       // formatted to remove trailing zeros if integer
       const val = data.totalLiters === 0 ? '' : parseFloat(data.totalLiters.toFixed(2)).toString();
       setTotalStr(val);
    }
  }, [data.totalLiters]);

  // --- AUTO CALCULATION LOGIC ---
  useEffect(() => {
    if (!data.isManualTotal) {
      const dailyVal = parseFloat(dailyStr) || 0;
      const rateVal = parseFloat(rateStr) || 0;
      
      const calcTotal = dailyVal * daysInMonth;
      const calcAmount = calcTotal * rateVal;
      
      // Update parent only if changed to prevent loops
      if (calcTotal !== data.totalLiters || calcAmount !== data.amount) {
        onChange({ ...data, totalLiters: calcTotal, amount: calcAmount });
      }
    } else {
      // Manual Total Mode
      const totalVal = parseFloat(totalStr) || 0;
      const rateVal = parseFloat(rateStr) || 0;
      const calcAmount = totalVal * rateVal;
      
      if (calcAmount !== data.amount) {
         onChange({ ...data, amount: calcAmount });
      }
    }
  }, [dailyStr, rateStr, totalStr, daysInMonth, data.isManualTotal]);

  // --- HANDLERS ---
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRateStr(val);
    const num = parseFloat(val);
    onChange({ ...data, rate: isNaN(num) ? 0 : num });
  };

  const handleDailyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDailyStr(val);
    const num = parseFloat(val);
    onChange({ ...data, dailyLiters: isNaN(num) ? 0 : num });
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTotalStr(val);
    const num = parseFloat(val);
    onChange({ ...data, totalLiters: isNaN(num) ? 0 : num });
  };

  return (
    <div className={`rounded-xl border ${colorClass} overflow-hidden mb-4 transition-all duration-300`}>
      <div 
        className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-bold text-gray-800 dark:text-gray-200">{title} Milk Details</h4>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Rate per Liter (Rs)" 
              type="number" 
              value={rateStr} 
              onChange={handleRateChange}
            />
            <InputField 
              label="Liters per Day" 
              type="number"
              step="0.5" 
              disabled={data.isManualTotal}
              value={dailyStr} 
              onChange={handleDailyChange}
            />
          </div>

          {/* Manual Override Toggle */}
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id={`manual-${title}`}
              checked={data.isManualTotal}
              onChange={(e) => onChange({ ...data, isManualTotal: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <label htmlFor={`manual-${title}`} className="text-sm text-gray-600 dark:text-gray-400 select-none cursor-pointer">
              Override calculation (Enter total manually)
            </label>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
             <InputField 
              label={`Total ${title} Liters`} 
              type="number"
              step="0.5"
              value={totalStr}
              disabled={!data.isManualTotal}
              onChange={handleTotalChange}
              className={data.isManualTotal ? "opacity-100" : "opacity-75"}
            />
            <div className="mt-2 text-right text-sm font-medium text-gray-500">
              Subtotal: Rs. {data.amount.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


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
  const [customer, setCustomer] = useState<CustomerData>({
    name: '',
    fatherName: '',
    phone: '',
    address: ''
  });

  const defaultMilkState: MilkDetails = {
    rate: 220,
    dailyLiters: 5,
    totalLiters: 0,
    amount: 0,
    isManualTotal: false
  };

  const [billing, setBilling] = useState<BillingData>({
    month: new Date().getMonth().toString(), // 0-11
    year: new Date().getFullYear(),
    daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
    dueAmount: 0,
    discount: 0,
    selection: 'Buffalo',
    buffalo: { ...defaultMilkState },
    cow: { ...defaultMilkState, rate: 190 }, 
    mix: { ...defaultMilkState, rate: 190 }, 
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'image'>('pdf');

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


  // --- HANDLERS ---

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const safeName = customer.name.replace(/[^a-z0-9]/gi, '_').substring(0, 20) || 'Customer';
      const monthName = new Date(0, parseInt(billing.month)).toLocaleString('default', { month: 'long' });
      
      if (downloadFormat === 'pdf') {
        // Generate PDF
        const pdfBytes = await generateSlip(customer, billing);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bill_${safeName}_${monthName}_${billing.year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate Image
        const imageBlob = await generateSlipAsImage(customer, billing);
        const url = window.URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bill_${safeName}_${monthName}_${billing.year}.png`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating file", error);
      alert(`Failed to generate ${downloadFormat.toUpperCase()}. Check console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to clear all data?")) {
        window.location.reload();
    }
  };

  // --- CALCULATIONS FOR SUMMARY ---
  const currentMonthName = new Date(0, parseInt(billing.month)).toLocaleString('default', { month: 'long' });
  
  const buffaloTotal = billing.selection === 'Buffalo' || billing.selection === 'Both' ? billing.buffalo.amount : 0;
  const cowTotal = billing.selection === 'Cow' || billing.selection === 'Both' ? billing.cow.amount : 0;
  const mixTotal = billing.selection === 'Mix' ? billing.mix.amount : 0;

  const currentBillTotal = buffaloTotal + cowTotal + mixTotal;
  const totalPayable = currentBillTotal + (billing.dueAmount || 0) - (billing.discount || 0);

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <InputField 
                      label="Days in Month" 
                      type="number" 
                      disabled={true} 
                      value={billing.daysInMonth} 
                      className="opacity-75"
                    />
                    <InputField 
                      label="Previous Due Amount" 
                      type="number"
                      value={billing.dueAmount || ''}
                      onChange={(e) => setBilling({...billing, dueAmount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                    <InputField 
                      label="Discount" 
                      type="number"
                      value={billing.discount || ''}
                      onChange={(e) => setBilling({...billing, discount: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                </div>

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Milk Type Selection */}
                <div>
                   <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Select Milk Type</label>
                   <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      {(['Buffalo', 'Cow', 'Mix', 'Both'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setBilling({...billing, selection: type})}
                          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                            billing.selection === type
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-gray-200 dark:ring-gray-500' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                </div>

                {/* DYNAMIC INPUT SECTIONS */}
                <div className="space-y-4">
                  {(billing.selection === 'Buffalo' || billing.selection === 'Both') && (
                    <MilkInputSection 
                      title="Buffalo" 
                      data={billing.buffalo}
                      daysInMonth={billing.daysInMonth}
                      colorClass="border-blue-200 dark:border-blue-900"
                      onChange={(updated) => setBilling(prev => ({...prev, buffalo: updated}))}
                    />
                  )}

                  {(billing.selection === 'Cow' || billing.selection === 'Both') && (
                    <MilkInputSection 
                      title="Cow" 
                      data={billing.cow}
                      daysInMonth={billing.daysInMonth}
                      colorClass="border-emerald-200 dark:border-emerald-900"
                      onChange={(updated) => setBilling(prev => ({...prev, cow: updated}))}
                    />
                  )}

                  {(billing.selection === 'Mix') && (
                    <MilkInputSection 
                      title="Mix" 
                      data={billing.mix}
                      daysInMonth={billing.daysInMonth}
                      colorClass="border-purple-200 dark:border-purple-900"
                      onChange={(updated) => setBilling(prev => ({...prev, mix: updated}))}
                    />
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="space-y-6">
            
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

                  {/* Buffalo Summary */}
                  {(billing.selection === 'Buffalo' || billing.selection === 'Both') && (
                     <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Buffalo ({billing.buffalo.totalLiters.toFixed(1)} L):</span>
                        <span className="font-medium text-gray-900 dark:text-white">Rs. {billing.buffalo.amount.toLocaleString()}</span>
                     </div>
                  )}

                  {/* Cow Summary */}
                  {(billing.selection === 'Cow' || billing.selection === 'Both') && (
                     <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Cow ({billing.cow.totalLiters.toFixed(1)} L):</span>
                        <span className="font-medium text-gray-900 dark:text-white">Rs. {billing.cow.amount.toLocaleString()}</span>
                     </div>
                  )}

                  {/* Mix Summary */}
                  {(billing.selection === 'Mix') && (
                     <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Mix ({billing.mix.totalLiters.toFixed(1)} L):</span>
                        <span className="font-medium text-gray-900 dark:text-white">Rs. {billing.mix.amount.toLocaleString()}</span>
                     </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                   <div className="flex justify-between text-gray-800 dark:text-gray-200 font-medium">
                    <span>Current Total:</span>
                    <span>Rs. {currentBillTotal.toLocaleString()}</span>
                  </div>
                  
                  {billing.dueAmount && billing.dueAmount > 0 ? (
                    <div className="flex justify-between text-red-500 dark:text-red-400">
                      <span>Previous Due:</span>
                      <span className="font-medium">+ Rs. {billing.dueAmount.toLocaleString()}</span>
                    </div>
                  ) : null}

                  {billing.discount && billing.discount > 0 ? (
                    <div className="flex justify-between text-green-500 dark:text-green-400">
                      <span>Discount:</span>
                      <span className="font-medium">- Rs. {billing.discount.toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  {/* Download Format Selection */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button
                      onClick={() => setDownloadFormat('pdf')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium transition-all ${
                        downloadFormat === 'pdf'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => setDownloadFormat('image')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md font-medium transition-all ${
                        downloadFormat === 'image'
                          ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      <span>Image</span>
                    </button>
                  </div>

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
                        Download as {downloadFormat.toUpperCase()}
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