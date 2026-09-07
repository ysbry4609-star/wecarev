export type UserRole = '12' | '13' | '14';

export interface UserSession {
  name: string;
  role: UserRole;
  roleLabel: string;
}

export type SiteType = 'taj' | 'saray';

export type PriorityType = 'minor' | 'moderate' | 'critical';

export type MedicationCategory =
  | 'injections'
  | 'tablets'
  | 'nebulizer'
  | 'liquids'
  | 'topical'
  | 'supplies'
  | 'solutions';

export interface MedicationItem {
  id: string;
  code?: string;
  name: string;
  scientificName: string;
  category: MedicationCategory;
  categoryLabel?: string;
  unit: string;
  stockTaj: number;
  stockSaray: number;
  minThresholdTaj: number;
  minThresholdSaray: number;
  expiryDate?: string;
  batchNumber?: string;
  indication?: string;
  isTop10?: boolean;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  site: SiteType;
  type: 'deduction' | 'restock' | 'adjustment';
  quantity: number;
  balanceAfter: number;
  timestamp: string;
  reportId?: string;
  patientName?: string;
  paramedicName: string;
  notes?: string;
}

export interface MedicationUsage {
  name: string;
  qty: number;
  unit: string;
  inventoryId?: string;
}

export interface VitalsData {
  bp: string;
  spo2: string;
  gcs: string;
  rbs: string;
  hr: string;
  temp: string;
}

export interface SavedReport {
  reportId: string;
  site: SiteType;
  date: string;
  monthYear: string;
  reportTime: string;
  arrivalTime: string;
  patientName: string;
  age: string;
  gender: string;
  job: string;
  location: string;
  reportSource: string;
  chiefComplaint: string;
  complaintDetails: string;
  medicalHistory: string;
  symptoms: string[];
  vitals: VitalsData;
  protocols: string[];
  medications: MedicationUsage[];
  otherProcedures: string;
  healthEducation: string[];
  additionalEducation: string;
  outcome: string;
  paramedicName: string;
  eventType: string;
  priority: PriorityType;
  notes: string;
  loggedUser: UserSession;
  createdAt: string;
}
