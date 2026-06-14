import { Package, Layers, AlertTriangle, Banknote } from 'lucide-react';
import { EquipmentItem } from '../types';

interface StatsGridProps {
  items: EquipmentItem[];
}

export function StatsGrid({ items }: StatsGridProps) {
  const totalUnique = items.length;
  const totalCount = items.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockCount = items.filter(item => item.currentStock <= item.minThreshold).length;
  const totalValuation = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="stats-grid-container">
      {/* Total Unique Items */}
      <div 
        id="stat-unique-items"
        className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm transition-all hover:border-zinc-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Unique SKUs</p>
            <h3 className="text-3xl font-light font-display text-white mt-1">{totalUnique.toLocaleString()}</h3>
            <p className="text-xs text-zinc-400 mt-1">Unique item categories</p>
          </div>
          <div className="p-3 bg-dark-bg text-gold rounded-xl border border-dark-border">
            <Package size={20} />
          </div>
        </div>
      </div>

      {/* Total Physical Stock */}
      <div 
        id="stat-total-stock"
        className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm transition-all hover:border-zinc-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Store Count</p>
            <h3 className="text-3xl font-light font-display text-white mt-1">{totalCount.toLocaleString()}</h3>
            <p className="text-xs text-zinc-400 mt-1">Total physical units in stock</p>
          </div>
          <div className="p-3 bg-dark-bg text-gold rounded-xl border border-dark-border">
            <Layers size={20} />
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div 
        id="stat-low-stock"
        className={`border rounded-xl p-5 shadow-sm transition-all ${
          lowStockCount > 0 
            ? 'bg-rose-500/5 border-rose-500/25 hover:border-rose-500/50' 
            : 'bg-dark-card border-dark-border hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Low Stock Alert</p>
            <h3 className={`text-3xl font-light font-display mt-1 ${lowStockCount > 0 ? 'text-red-400 font-bold' : 'text-white'}`}>
              {lowStockCount}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {lowStockCount > 0 ? 'Requires immediate restock' : 'All items fully stocked'}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${
            lowStockCount > 0 
              ? 'bg-rose-500/10 text-red-400 border-rose-500/30' 
              : 'bg-dark-bg text-zinc-400 border-dark-border'
          }`}>
            <AlertTriangle className={lowStockCount > 0 ? 'animate-pulse' : ''} size={20} />
          </div>
        </div>
      </div>

      {/* Total Valuation */}
      <div 
        id="stat-valuation"
        className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm transition-all hover:border-zinc-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. Inventory Value</p>
            <h3 className="text-3xl font-light font-display text-gold mt-1">
              Rp {totalValuation.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Based on unit cost prices</p>
          </div>
          <div className="p-3 bg-dark-bg text-gold rounded-xl border border-dark-border">
            <Banknote size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
