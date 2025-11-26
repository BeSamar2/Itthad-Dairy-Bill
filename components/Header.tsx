import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ASSETS } from '../assets';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-blue-100 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo Section */}
          <div className="h-12 w-12 rounded-full flex items-center justify-center overflow-hidden bg-white shadow-md border border-gray-100 p-1">
            <img 
              src={ASSETS.LOGO}
              alt="Itthad Dairy Logo" 
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback if logo.png is not found yet
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-blue-600');
                e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-lg">ID</span>';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Itthad <span className="text-blue-600 dark:text-blue-400">Dairy</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
              Monthly Billing System
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="hidden sm:block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            New Slip
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;