import { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  Coffee, 
  TrendingDown, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { EquipmentItem, StockLog } from './types';
import { INITIAL_EQUIPMENT_ITEMS, INITIAL_STOCK_LOGS } from './data';
import { StatsGrid } from './components/StatsGrid';
import { EquipmentList } from './components/EquipmentList';
import { AuditLogView } from './components/AuditLogView';
import { AddEditModal } from './components/AddEditModal';
import { GoogleSyncPanel } from './components/GoogleSyncPanel';

export default function App() {
  // Sync items state with localStorage
  const [items, setItems] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('store_equipment_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved items, using initial fallback', e);
      }
    }
    return INITIAL_EQUIPMENT_ITEMS;
  });

  // Sync logs state with localStorage
  const [logs, setLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem('store_equipment_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved logs, using initial fallback', e);
      }
    }
    return INITIAL_STOCK_LOGS;
  });

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('store_equipment_items', JSON.stringify(items));
  }, [items]);

  // Save to localStorage whenever logs change
  useEffect(() => {
    localStorage.setItem('store_equipment_logs', JSON.stringify(logs));
  }, [logs]);

  // Logging Helper
  const createLog = (
    itemId: string,
    itemName: string,
    changeType: StockLog['changeType'],
    amount: number,
    reason: string
  ) => {
    const newLog: StockLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId,
      itemName,
      changeType,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Quick counter adjustments
  const handleIncrement = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newStock = item.currentStock + 1;
          createLog(
            item.id,
            item.name,
            'increase',
            1,
            `Quick increment adjustment (+1) via visual panel.`
          );
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const handleDecrement = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id && item.currentStock > 0) {
          const newStock = item.currentStock - 1;
          createLog(
            item.id,
            item.name,
            'decrease',
            1,
            `Quick decrement adjustment (-1) via visual panel.`
          );
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  // Manual log additions
  const handleAddManualLog = (
    itemId: string,
    type: 'increase' | 'decrease' | 'adjustment',
    amount: number,
    reason: string
  ) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          let updatedStock = item.currentStock;
          if (type === 'increase') {
            updatedStock += amount;
          } else if (type === 'decrease') {
            updatedStock = Math.max(0, item.currentStock - amount);
          } else if (type === 'adjustment') {
            updatedStock = amount; // Direct setting stock level
          }

          createLog(
            item.id,
            item.name,
            type,
            amount,
            reason
          );

          return {
            ...item,
            currentStock: updatedStock,
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  // Clear log history
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Open modal for editing
  const handleEditClick = (item: EquipmentItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Open modal for adding
  const handleAddNewClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Delete inventory catalog item
  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (!itemToDelete) return;

    setItems(prev => prev.filter(item => item.id !== id));
    createLog(
      id,
      itemToDelete.name,
      'delete',
      0,
      `Asset removed permanently from the store equipment lookup registry.`
    );
  };

  // Save changes from add/edit modal form
  const handleSaveItem = (itemFormData: Omit<EquipmentItem, 'id' | 'lastUpdated'> & { id?: string }) => {
    if (itemFormData.id) {
      // Editing Mode
      setItems(prev =>
        prev.map(item => {
          if (item.id === itemFormData.id) {
            // Track changes for logs if stock levels changed during details edit
            const stockDifference = itemFormData.currentStock - item.currentStock;
            if (stockDifference !== 0) {
              createLog(
                item.id,
                itemFormData.name,
                stockDifference > 0 ? 'increase' : 'decrease',
                Math.abs(stockDifference),
                `Inventory details updated. Quantity adjusted from ${item.currentStock} to ${itemFormData.currentStock}.`
              );
            } else if (item.name !== itemFormData.name || item.location !== itemFormData.location) {
              createLog(
                item.id,
                itemFormData.name,
                'adjustment',
                0,
                `Equipment catalog specification updated. (Location: ${itemFormData.location})`
              );
            }

            return {
              ...item,
              ...itemFormData,
              id: item.id,
              lastUpdated: new Date().toISOString(),
            };
          }
          return item;
        })
      );
    } else {
      // Creation Mode
      const newItemId = `item-${Date.now()}`;
      const newItem: EquipmentItem = {
        ...itemFormData,
        id: newItemId,
        lastUpdated: new Date().toISOString(),
      };

      setItems(prev => [...prev, newItem]);
      createLog(
        newItemId,
        newItem.name,
        'add',
        newItem.currentStock,
        `New store equipment asset registered with initial physical count of ${newItem.currentStock} ${newItem.unit}.`
      );
    }
  };

  // Reset to original demo data
  const handleResetData = () => {
    if (window.confirm('Reset catalog and logs mock data back to factory defaults? Your current modifications will be replaced.')) {
      setItems(INITIAL_EQUIPMENT_ITEMS);
      setLogs(INITIAL_STOCK_LOGS);
    }
  };

  // Download stock summary payload
  const handleExportData = () => {
    const dataStr = JSON.stringify({ items, logs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipment-stock-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple import handler (JSON text prompt fallback safe inside iframe environment)
  const handleImportData = () => {
    const input = prompt('Paste your previously exported catalog JSON configuration here:');
    if (!input) return;

    try {
      const parsed = JSON.parse(input);
      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(parsed.items);
        if (parsed.logs && Array.isArray(parsed.logs)) {
          setLogs(parsed.logs);
        } else {
          setLogs([]);
        }
        alert('Inventory data configuration loaded successfully!');
      } else {
        alert('Invalid data schema. The payload must contain an "items" array.');
      }
    } catch (e) {
      alert('Failed to parse input contents. Please verify it is a valid JSON catalog payload.');
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-dark-bg font-sans text-zinc-300 antialiased selection:bg-gold/20">
      
      {/* Visual Top Branding Bar */}
      <header id="header-bar" className="bg-dark-sidebar border-b border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gold text-dark-bg p-2 rounded-xl border border-gold/30 flex items-center justify-center shadow-xs">
              <Coffee size={18} className="stroke-[2.5px]" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight text-[15px] font-display">Store Equipment</h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase leading-none mt-1">Stock Control Terminal</p>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleExportData}
              title="Download backup"
              className="p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-[#1a1a1a] rounded-lg text-white font-semibold border border-dark-border bg-dark-card flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} className="text-gold" />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <button
              onClick={handleImportData}
              title="Import backup"
              className="p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-[#1a1a1a] rounded-lg text-white font-semibold border border-dark-border bg-dark-card flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload size={14} className="text-gold" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <div className="h-5 w-[1px] bg-dark-border mx-1" />

            <button
              onClick={handleResetData}
              title="Restore defaults"
              className="p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-[#1a1a1a] text-zinc-400 hover:text-red-400 rounded-lg font-semibold border border-dashed border-dark-border bg-dark-card flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner/Introduction card */}
        <div id="intro-alert" className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start justify-between shadow-sm relative overflow-hidden">
          <div className="flex gap-3">
            <div className="p-2.5 bg-yellow-955/20 rounded-xl border border-amber-900/40 text-gold shrink-0">
              <AlertCircle size={20} className="stroke-[2px]" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-white text-sm font-display leading-tight">Equipment Stock Registry</h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                Maintain high-end hospitality standards. Add, audit, and trace fragile glassware, custom tableware, decanters, and cocktail accessories. 
                Keep track of stock levels against reorder thresholds to prevent restaurant floor disruption.
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-dark-bg border border-dark-border p-2 rounded-xl text-zinc-500 shrink-0 select-none">
            <strong className="text-gold block">System Status:</strong> 
            Persistent local storage sandbox environment.
          </div>
        </div>

        {/* Dynamic Metric Gauges */}
        <div id="stats-dashboard-view">
          <StatsGrid items={items} />
        </div>

        {/* Master Control Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Explorer list */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm font-display leading-snug">Registered Equipment Registry</h3>
            </div>
            <EquipmentList
              items={items}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onEdit={handleEditClick}
              onDelete={handleDeleteItem}
              onAddNewClick={handleAddNewClick}
            />
          </div>

          {/* Right panel: Google Sync and Ledger audit stream */}
          <div className="lg:col-span-4 space-y-6">
            <GoogleSyncPanel
              items={items}
              logs={logs}
              onRestore={(restoredItems, restoredLogs) => {
                setItems(restoredItems);
                setLogs(restoredLogs);
              }}
            />

            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm font-display leading-snug">Operations Stream</h3>
              <AuditLogView
                logs={logs}
                items={items}
                onAddManualLog={handleAddManualLog}
                onClearLogs={handleClearLogs}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Unified overlay form dialog */}
      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Humble credit line in footer without text-larping */}
      <footer id="footer-credits" className="py-12 text-center text-zinc-500 text-[11px] border-t border-dark-border bg-dark-sidebar mt-12 select-none">
        <p className="font-medium">Store Equipment Stock Control System — All rights reserved.</p>
        <p className="text-zinc-650 mt-1">Configured for bar, kitchen, and wine cellar physical count log tracking.</p>
      </footer>
    </div>
  );
}
