
export interface CustomerData {
  name: string;
  fatherName: string;
  phone: string;
  address: string;
}

export interface MilkDetails {
  rate: number;
  dailyLiters: number;
  totalLiters: number;
  amount: number;
  isManualTotal: boolean;
}

// Daily entry for date-based billing
export interface DailyEntry {
  date: string; // YYYY-MM-DD format
  liters: number;
  rate: number;
  amount: number;
}

export interface DateBasedMilkDetails {
  rate: number; // Default rate
  entries: DailyEntry[];
  totalLiters: number;
  totalAmount: number;
}

export type BillingMode = 'monthly' | 'date-based';

export interface BillingData {
  // Billing Mode
  billingMode: BillingMode;
  
  // Monthly Billing Fields
  month: string;
  year: number;
  daysInMonth: number;
  
  // Date-Based Billing Fields
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  
  // Common Fields
  dueAmount?: number;
  discount?: number;
  
  // Selection Mode: 'Both' implies Cow + Buffalo
  selection: 'Buffalo' | 'Cow' | 'Mix' | 'Both';
  
  // Monthly Billing Data
  buffalo: MilkDetails;
  cow: MilkDetails;
  mix: MilkDetails;
  
  // Date-Based Billing Data
  buffaloDateBased: DateBasedMilkDetails;
  cowDateBased: DateBasedMilkDetails;
  mixDateBased: DateBasedMilkDetails;
}

