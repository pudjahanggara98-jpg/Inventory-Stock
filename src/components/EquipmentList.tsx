import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Tag, 
  DollarSign, 
  Info, 
  Grid, 
  List, 
  AlertTriangle, 
  HelpCircle,
  Truck,
  ArrowUpDown
} from 'lucide-react';
import { EquipmentItem, CategoryFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../data';

interface EquipmentListProps {
  items: EquipmentItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (id: string) => void;
  onAddNewClick: () => void;
}

type SortField = 'name' | 'currentStock' | 'unitCost' | 'value';
type SortDirection = 'asc' | 'desc';

export function EquipmentList({ 
  items, 
  onIncrement, 
  onDecrement, 
  onEdit, 
  onDelete,
  onAddNewClick
}: EquipmentListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [selectedExtraDetailId, setSelectedExtraDetailId] = useState<string | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter items based on Category, Search query, and Low stock state
  const filteredItems = items
    .filter(item => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Low stock filtering
      if (onlyLowStock && item.currentStock > item.minThreshold) {
        return false;
      }
      // Search matching
      const query = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        (item.supplier && item.supplier.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'currentStock') {
        comparison = a.currentStock - b.currentStock;
      } else if (sortField === 'unitCost') {
        comparison = a.unitCost - b.unitCost;
      } else if (sortField === 'value') {
        comparison = (a.currentStock * a.unitCost) - (b.currentStock * b.unitCost);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Unique counts for filter category tags
  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return items.length;
    return items.filter(item => item.category === cat).length;
  };

  return (
    <div id="equipment-explorer-panel" className="space-y-4">
      {/* Search, filters & mode controls */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              id="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name, location, supplier..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#444444] transition-all h-9.5"
            />
          </div>

          <div className="flex items-center gap-2.5 justify-end w-full md:w-auto shrink-0 select-none">
            {/* Low stock check toggle */}
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium cursor-pointer">
              <input
                type="checkbox"
                id="chk-low-stock-only"
                checked={onlyLowStock}
                onChange={(e) => setOnlyLowStock(e.target.checked)}
                className="rounded-sm border-dark-border bg-dark-bg text-gold focus:ring-gold"
              />
              <span className="flex items-center gap-1 text-gold font-semibold">
                <AlertTriangle size={13} /> Low Stock Only
              </span>
            </label>

            <div className="h-4 w-[1px] bg-dark-border mx-1" />

            {/* View Mode toggler */}
            <div className="flex items-center bg-dark-bg p-0.5 rounded-lg border border-dark-border">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-gold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid mode"
              >
                <Grid size={15} />
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#1a1a1a] text-gold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Table mode"
              >
                <List size={15} />
              </button>
            </div>

            <button
              id="btn-add-item-top"
              onClick={onAddNewClick}
              className="text-xs bg-gold hover:bg-[#b08e4d] text-dark-bg font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-lg shadow-gold/5 transition-all h-9.5 cursor-pointer"
            >
              <Plus size={15} />
              Register Item
            </button>
          </div>
        </div>

        {/* Category horizontal filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(['All', ...CATEGORIES] as CategoryFilter[]).map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#1a1a1a] text-gold border-gold/40 shadow-xs'
                    : 'bg-dark-bg text-zinc-400 border-dark-border hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-dark-bg text-gold border border-gold/10' : 'bg-[#1e1e1e] text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting helper bar (for grid or general feedback) */}
      <div className="flex bg-dark-card border border-dark-border rounded-lg p-2 items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-500">Sorting by:</span>
          {(['name', 'currentStock', 'unitCost', 'value'] as SortField[]).map(field => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center gap-1 hover:text-white transition-colors font-medium capitalize ${sortField === field ? 'text-gold font-bold underline decoration-gold underline-offset-4' : ''}`}
            >
              {field === 'currentStock' ? 'Stock Count' : field === 'unitCost' ? 'Price' : field}
              {sortField === field && (
                <ArrowUpDown size={11} className={sortDirection === 'asc' ? 'rotate-18 rot' : ''} />
              )}
            </button>
          ))}
        </div>
        <p className="font-medium text-zinc-500">
          Showing <span className="text-white font-bold">{filteredItems.length}</span> of {items.length} items
        </p>
      </div>

      {/* Inventory Items container */}
      {filteredItems.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl py-16 px-4 flex flex-col items-center justify-center text-zinc-500">
          <Search size={40} className="stroke-1 opacity-50 mb-3 text-gold" />
          <p className="text-sm font-semibold text-white">No equipment items found</p>
          <p className="text-xs text-zinc-455 mt-1 max-w-xs text-center text-zinc-400">
            Try adjusting your search filters, checking the spelling, or clearing the categories filters.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('All'); setOnlyLowStock(false); }}
            className="mt-4 text-xs font-semibold px-3 py-2 bg-dark-bg hover:bg-[#1a1a1a] text-gold border border-dark-border rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="items-grid-section">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isLowStock = item.currentStock <= item.minThreshold;
              const isOutOfStock = item.currentStock === 0;
              const hasExtraDetails = selectedExtraDetailId === item.id;
              
              return (
                <motion.div
                  layout
                  key={item.id}
                  id={`item-card-${item.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-dark-card border rounded-xl overflow-hidden flex flex-col shadow-xs transition-shadow relative ${
                    isOutOfStock 
                      ? 'border-red-900/60 bg-red-950/10' 
                      : isLowStock 
                        ? 'border-orange-500/20 bg-orange-950/10' 
                        : 'border-dark-border hover:border-zinc-700'
                  }`}
                >
                  {/* Card Header & Status Badges */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-dark-bg border border-dark-border px-2 py-0.5 rounded-lg">
                        {item.category}
                      </span>
                      
                      {isOutOfStock ? (
                        <span className="text-[10px] font-semibold bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded-lg animate-pulse">
                          CRITICAL
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-semibold bg-orange-950/40 text-orange-400 border border-orange-900/40 px-2 py-0.5 rounded-lg">
                          REORDER
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded-lg">
                          OPTIMAL
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-[14px] mt-2 font-display leading-tight">{item.name}</h3>
                    
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-2.5">
                      <MapPin size={13} className="text-gold" />
                      <span className="font-semibold">{item.location}</span>
                    </div>

                    {/* Stock level big status display */}
                    <div className="flex items-baseline justify-between mt-4 bg-dark-bg p-2.5 rounded-lg border border-dark-border">
                      <div>
                        <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Level</p>
                        <p className="font-display font-black text-xl text-white mt-0.5">
                          {item.currentStock} <span className="text-xs font-semibold text-zinc-400 font-mono italic">{item.unit}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider" title="Minimum alert threshold count">Threshold</p>
                        <p className="text-xs font-mono font-bold text-zinc-400 mt-1">
                          Min: {item.minThreshold} {item.unit}
                        </p>
                      </div>
                    </div>

                    {/* Extra expandable notes details */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedExtraDetailId(hasExtraDetails ? null : item.id)}
                          className="text-[11px] text-zinc-400 hover:text-white font-semibold flex items-center gap-0.5 underline decoration-zinc-700"
                        >
                          <Info size={11} /> {hasExtraDetails ? 'Hide details' : 'Show notes & specs'}
                        </button>
                        <span className="text-[11px] font-mono text-zinc-450 font-medium">
                          Val: <strong className="text-gold font-bold">Rp {(item.currentStock * item.unitCost).toLocaleString('id-ID')}</strong>
                        </span>
                      </div>

                      <AnimatePresence>
                        {hasExtraDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-dark-bg border border-dark-border p-2.5 rounded-lg text-[11px] text-zinc-300 space-y-1.5 overflow-hidden mt-1.5"
                          >
                            {item.notes ? (
                              <p><strong className="text-white">Notes:</strong> {item.notes}</p>
                            ) : (
                              <p className="italic text-zinc-500">No description logged.</p>
                            )}
                            {item.supplier && (
                              <p className="flex items-center gap-1"><strong className="text-white">Supplier:</strong> <span className="flex items-center gap-0.5 bg-[#1b1b1b] p-0.5 px-1 rounded text-[10px]"><Truck size={10} className="text-gold" />{item.supplier}</span></p>
                            )}
                            <p className="flex items-center justify-between pt-1 border-t border-dark-border">
                              <span>Cost Code: <strong className="font-mono text-gold">Rp {item.unitCost.toLocaleString('id-ID')} /unit</strong></span>
                              <span className="text-[10px] text-zinc-500">Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Stock Dial Controls & Actions */}
                  <div className="border-t border-dark-border bg-[#121212] p-2.5 flex items-center justify-between gap-1.5 shrink-0">
                    {/* Inc / dec control dials */}
                    <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg p-0.5">
                      <button
                        title="Decrement equipment stock by 1"
                        id={`btn-dec-${item.id}`}
                        onClick={() => onDecrement(item.id)}
                        disabled={item.currentStock <= 0}
                        className="p-1 px-2 rounded hover:bg-[#1a1a1a] text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent hover:text-white transition-colors cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      
                      <div className="px-2 font-mono font-black text-xs text-white">
                        {item.currentStock}
                      </div>

                      <button
                        title="Increment equipment stock by 1"
                        id={`btn-inc-${item.id}`}
                        onClick={() => onIncrement(item.id)}
                        className="p-1 px-2 rounded hover:bg-[#1a1a1a] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Standard edit or delete action tools */}
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit equipment specifications"
                        id={`btn-edit-${item.id}`}
                        onClick={() => onEdit(item)}
                        className="p-1.5 hover:bg-[#1a1a1a] text-zinc-400 hover:text-white rounded-lg border border-dark-border bg-dark-bg shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        title="Delete registered item catalog"
                        id={`btn-delete-${item.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete '${item.name}'?`)) {
                            onDelete(item.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-955/10 text-zinc-500 hover:text-red-400 rounded-lg border border-dark-border bg-dark-bg shadow-sm transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* TABLE VIEW LIST MODE */
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-sm" id="items-table-section">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#121212] border-b border-dark-border text-zinc-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-3.5 pl-4">Equipment Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Storage Location</th>
                  <th className="p-3.5 text-right">Physical Count</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Unit Value</th>
                  <th className="p-3.5 text-right">Holding Value</th>
                  <th className="p-3.5 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredItems.map(item => {
                  const isLowStock = item.currentStock <= item.minThreshold;
                  const isOutOfStock = item.currentStock === 0;
                  
                  return (
                    <tr 
                      key={item.id} 
                      id={`item-row-${item.id}`}
                      className={`hover:bg-[#1f1f1f] transition-colors ${
                        isOutOfStock 
                          ? 'bg-red-950/10' 
                          : isLowStock 
                            ? 'bg-orange-950/10' 
                            : ''
                      }`}
                    >
                      <td className="p-3.5 pl-4 font-semibold text-white">
                        <div>
                          <p className="font-display font-bold text-white">{item.name}</p>
                          {item.notes && (
                            <p className="text-[10px] text-zinc-500 font-normal truncate max-w-xs mt-0.5">{item.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-dark-bg text-zinc-400 rounded text-[10px] font-medium border border-dark-border">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-300 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-gold" />
                          {item.location}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {item.currentStock} <span className="text-[10px] text-zinc-400 font-medium">{item.unit}</span>
                        <p className="text-[10px] text-zinc-500 leading-none mt-1 font-normal">Min: {item.minThreshold}</p>
                      </td>
                      <td className="p-3.5 text-center">
                        {isOutOfStock ? (
                          <span className="inline-block text-[9px] font-bold bg-red-955/20 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded">
                            CRITICAL
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-block text-[9px] font-bold bg-orange-955/20 text-orange-400 border border-orange-900/30 px-1.5 py-0.5 rounded">
                            REORDER
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold bg-emerald-955/20 text-emerald-400 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                            OPTIMAL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono text-zinc-400 font-medium">
                        Rp {item.unitCost.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gold">
                        Rp {(item.currentStock * item.unitCost).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Quick subtract count"
                            id={`btn-row-dec-${item.id}`}
                            onClick={() => onDecrement(item.id)}
                            disabled={item.currentStock <= 0}
                            className="p-1 hover:bg-[#252525] rounded border border-dark-border text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Minus size={11} />
                          </button>
                          <button
                            title="Quick add count"
                            id={`btn-row-inc-${item.id}`}
                            onClick={() => onIncrement(item.id)}
                            className="p-1 hover:bg-[#252525] rounded border border-dark-border text-zinc-400 hover:text-white"
                          >
                            <Plus size={11} />
                          </button>
                          <div className="h-3 w-[1px] bg-dark-border" />
                          <button
                            title="Edit specs"
                            id={`btn-row-edit-${item.id}`}
                            onClick={() => onEdit(item)}
                            className="p-1 hover:bg-[#252525] text-zinc-400 hover:text-white rounded border border-dark-border"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            title="Delete item"
                            id={`btn-row-delete-${item.id}`}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete '${item.name}'?`)) {
                                onDelete(item.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-955/10 text-zinc-500 hover:text-red-400 rounded border border-dark-border"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
