export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  location: string;
  unit: string;
  unitCost: number;
  supplier: string;
  notes: string;
  lastUpdated: string;
}

export interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  changeType: 'increase' | 'decrease' | 'add' | 'edit' | 'delete' | 'restock' | 'adjustment';
  amount: number;
  reason: string;
  timestamp: string;
}

export type CategoryFilter = 'All' | 'Glassware' | 'Bottles & Decanters' | 'Bar Tools' | 'Tableware' | 'Cleaning/Other';
