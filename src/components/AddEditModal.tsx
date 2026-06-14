import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Layers, HelpCircle, MapPin, Banknote, PenTool, ClipboardList, RefreshCw } from 'lucide-react';
import { EquipmentItem } from '../types';
import { CATEGORIES, LOCATIONS } from '../data';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<EquipmentItem, 'id' | 'lastUpdated'> & { id?: string }) => void;
  editingItem?: EquipmentItem | null;
}

export function AddEditModal({ isOpen, onClose, onSave, editingItem }: AddEditModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [currentStock, setCurrentStock] = useState(1);
  const [minThreshold, setMinThreshold] = useState(5);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [unit, setUnit] = useState('pcs');
  const [unitCost, setUnitCost] = useState(50000);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');

  // Update states whenever editingItem changes
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setCurrentStock(editingItem.currentStock);
      setMinThreshold(editingItem.minThreshold);
      setLocation(editingItem.location);
      setUnit(editingItem.unit);
      setUnitCost(editingItem.unitCost);
      setSupplier(editingItem.supplier || '');
      setNotes(editingItem.notes || '');
    } else {
      // Defaults for pristine addition
      setName('');
      setCategory(CATEGORIES[0]);
      setCurrentStock(1);
      setMinThreshold(5);
      setLocation(LOCATIONS[0]);
      setUnit('pcs');
      setUnitCost(1.00);
      setSupplier('');
      setNotes('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(editingItem ? { id: editingItem.id } : {}),
      name: name.trim(),
      category,
      currentStock,
      minThreshold,
      location,
      unit: unit.trim() || 'pcs',
      unitCost: Number(unitCost) || 0,
      supplier: supplier.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div id="modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        id="modal-backdrop"
        onClick={onClose} 
        className="absolute inset-x-0 inset-y-0 bg-black/85 backdrop-blur-xs" 
      />

      {/* Modal Container */}
      <div 
        id="modal-content"
        className="relative bg-dark-card border border-dark-border shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              {editingItem ? 'Edit Equipment Details' : 'Add New Equipment Stock'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {editingItem ? 'Modifying settings for custom registered store asset.' : 'Register and log fresh equipment inventory items.'}
            </p>
          </div>
          <button 
            id="modal-close-btn"
            onClick={onClose} 
            className="p-1.5 hover:bg-[#1a1a1a] rounded-lg text-zinc-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Section 1: Core Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bordeaux Wine Glass 14oz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#111111]">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Storage Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc} className="bg-[#111111]">{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Section 2: Numbers, thresholds and Costing */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Layers size={13} className="text-gold" /> Quantities & Costing Parameters
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Initial Stock</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg pl-3 pr-10 py-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gold font-bold uppercase">
                    {unit || 'pcs'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1" title="Alert if current stock falls below or equal to this count">
                  Min. Threshold *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Display Unit</label>
                <input
                  type="text"
                  placeholder="pcs, boxes, sets"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cost Per Unit (Rp)</label>
                <div className="relative">
                  <Banknote size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 50000"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg pl-7 pr-3 py-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Primary Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. Glassware Distributors Inc."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white h-10 text-sm focus:border-zinc-700 focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Section 3: Notes & Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Additional Notes / Tech Specs</label>
              <textarea
                placeholder="Log fragile markings, size specifications, wash limits, material details here..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-white text-sm focus:border-zinc-700 focus:outline-hidden resize-none transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-dark-border bg-dark-sidebar -mx-6 -mb-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="modal-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 font-semibold hover:bg-[#1a1a1a] rounded-xl transition-all"
            >
              Close
            </button>
            <button
              type="submit"
              id="modal-submit-btn"
              className="px-4.5 py-2 bg-gold text-dark-bg font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-gold/5 hover:bg-[#b08e4d] transition-all cursor-pointer"
            >
              <Save size={15} />
              {editingItem ? 'Save Variations' : 'Register Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
