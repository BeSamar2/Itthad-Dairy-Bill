import React from 'react';
import { DailyEntry } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface DailyEntryInputProps {
  entries: DailyEntry[];
  defaultRate: number;
  onEntriesChange: (entries: DailyEntry[]) => void;
  minDate?: string;
  maxDate?: string;
}

const DailyEntryInput: React.FC<DailyEntryInputProps> = ({ 
  entries, 
  defaultRate, 
  onEntriesChange,
  minDate,
  maxDate 
}) => {
  
  /**
   * Calculate next available date for new entry
   * If no entries exist, use start date (minDate)
   * If entries exist, use the day after the last entry's date
   * Ensure the date doesn't exceed maxDate
   */
  const getNextAvailableDate = (): string => {
    if (entries.length === 0) {
      return minDate || new Date().toISOString().split('T')[0];
    }
    
    // Find the latest date in existing entries
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const lastDate = new Date(sortedEntries[sortedEntries.length - 1].date);
    
    // Add one day
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateString = nextDate.toISOString().split('T')[0];
    
    // Check if next date exceeds maxDate
    if (maxDate && nextDateString > maxDate) {
      // If we've reached the end, cycle back to minDate or use the last date
      return minDate || nextDateString;
    }
    
    return nextDateString;
  };
  
  const addEntry = () => {
    const newEntry: DailyEntry = {
      date: getNextAvailableDate(),
      liters: 0,
      rate: defaultRate,
      amount: 0
    };
    onEntriesChange([...entries, newEntry]);
  };

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    onEntriesChange(updated);
  };

  const updateEntry = (index: number, field: keyof DailyEntry, value: string | number) => {
    const updated = [...entries];
    
    // Parse numeric values to ensure they're stored as numbers, not strings
    if (field === 'liters' || field === 'rate') {
      const numValue = parseFloat(value as string) || 0;
      updated[index] = { ...updated[index], [field]: numValue };
      
      // Auto-calculate amount
      const liters = field === 'liters' ? numValue : updated[index].liters;
      const rate = field === 'rate' ? numValue : updated[index].rate;
      updated[index].amount = liters * rate;
    } else {
      // For non-numeric fields (like date), store as-is
      updated[index] = { ...updated[index], [field]: value };
    }
    
    onEntriesChange(updated);
  };

  /**
   * Prevent Enter key from causing unwanted navigation
   * This stops the browser from submitting any parent forms or triggering navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Also stop event bubbling
      
      // Optionally move to next input field 
      const currentInput = e.currentTarget;
      const allInputs = document.querySelectorAll('input[type="number"]:not([disabled])');
      const currentIndex = Array.from(allInputs).indexOf(currentInput);
      
      if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
        (allInputs[currentIndex + 1] as HTMLInputElement).focus();
      }
      
      return false; // Additional safety to prevent default behavior
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Entries</h4>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          <Plus size={16} />
          Add Day
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          No entries yet. Click "Add Day" to start.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Date */}
              <div className="col-span-4">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Date</label>
                <input
                  type="date"
                  value={entry.date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => updateEntry(index, 'date', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Liters */}
              <div className="col-span-3">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Liters</label>
                <input
                  type="number"
                  step="0.5"
                  value={entry.liters || ''}
                  onChange={(e) => updateEntry(index, 'liters', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Rate */}
              <div className="col-span-3">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Rate</label>
                <input
                  type="number"
                  value={entry.rate || ''}
                  onChange={(e) => updateEntry(index, 'rate', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={defaultRate.toString()}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-2 flex items-end justify-center">
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Amount Display */}
              <div className="col-span-12 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount: Rs. {entry.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Total Liters:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {entries.reduce((sum, e) => sum + e.liters, 0).toFixed(1)} L
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-700 dark:text-gray-300">Total Amount:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              Rs. {entries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyEntryInput;
