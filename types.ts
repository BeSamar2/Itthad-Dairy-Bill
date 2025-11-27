export interface CustomerData {
  name: string;
  fatherName: string;
  phone: string;
  address: string;
}

export interface BillingData {
  month: string;
  year: number;
  ratePerLiter: number;
  daysInMonth: number;
  litersPerDay: number;
  totalLiters: number;
  totalAmount: number;
  dueAmount?: number; // Added optional due amount
  isManualTotal: boolean; // if true, user overrode calculation
  milkType: 'Buffalo' | 'Cow';
}