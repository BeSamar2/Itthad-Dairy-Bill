
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

export interface BillingData {
  month: string;
  year: number;
  daysInMonth: number;
  dueAmount?: number;
  discount?: number;
  
  // Selection Mode: 'Both' implies Cow + Buffalo
  selection: 'Buffalo' | 'Cow' | 'Mix' | 'Both';
  
  // Specific Data
  buffalo: MilkDetails;
  cow: MilkDetails;
  mix: MilkDetails;
}
