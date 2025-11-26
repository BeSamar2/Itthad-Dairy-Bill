import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, className, ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 transition-colors">
        {label}
      </label>
      <input
        className={`
          px-3 py-2 bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 
          text-gray-900 dark:text-white
          rounded-lg shadow-sm outline-none transition-all duration-200
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
          ${error ? 'border-red-300 focus:ring-red-200' : ''}
          disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default InputField;