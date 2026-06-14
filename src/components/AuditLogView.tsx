import { useState, FormEvent } from 'react';
import { History, Calendar, Plus, Trash2, ArrowUpDown, Tag } from 'lucide-react';
import { StockLog, EquipmentItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogViewProps {
  logs: StockLog[];
  items: EquipmentItem[];
  onAddManualLog: (itemId: string, changeType: 'increase' | 'decrease' | 'adjustment', amount: number, reason: string) => void;
  onClearLogs: () => void;
}

export function AuditLogView({ logs, items, onAddManualLog, onClearLogs }: AuditLogViewProps) {
  const [filterType, setFilterType] = useState<'All' | 'increase' | 'decrease' | 'adjustment'>('All');
  const [showLogForm, setShowLogForm] = useState(false);
  
  // Manual Log state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [changeType, setChangeType] = useState<'increase' | 'decrease' | 'adjustment'>('decrease');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'All') return true;
    return log.changeType === filterType;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    onAddManualLog(selectedItemId, changeType, amount, reason);
    
    // Reset Form
    setSelectedItemId('');
    setAmount(1);
    setReason('');
    setShowLogForm(false);
  };

  const getLogBadgeColors = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30';
      case 'decrease':
        return 'text-rose-450 bg-rose-950/30 border-rose-900/30';
      case 'add':
        return 'text-blue-400 bg-blue-950/30 border-blue-900/30';
      case 'delete':
        return 'text-zinc-400 bg-zinc-950/40 border-zinc-900/40';
      default:
        return 'text-gold bg-amber-955/20 border-amber-900/30';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div id="audit-log-panel" className="bg-dark-card border border-dark-border rounded-xl shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <History size={18} className="text-gold" />
          <h2 className="font-semibold font-display text-sm tracking-tight">Audit Log & Ledger</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-toggle-log-form"
            onClick={() => setShowLogForm(!showLogForm)}
            className="text-xs bg-gold hover:bg-[#b08e4d] text-dark-bg font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus size={14} />
            Add Entry
          </button>
          {logs.length > 0 && (
            <button
              id="btn-clear-logs"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the logs history? Device stock levels will remain unchanged.")) {
                  onClearLogs();
                }
              }}
              title="Clear log history"
              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#121212]/50 border-b border-dark-border"
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <h3 className="font-medium text-white">Manual Stock Transaction Form</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Select Equipment</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white h-9 focus:border-zinc-700 focus:outline-hidden"
                >
                  <option value="" className="bg-[#111111]">-- Choose Item --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id} className="bg-[#111111]">
                      {i.name} ({i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Transaction Type</label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as any)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white h-9 focus:border-zinc-700 focus:outline-hidden"
                  >
                    <option value="decrease" className="bg-[#111111]">Use / Damage (-)</option>
                    <option value="increase" className="bg-[#111111]">Restock / Add (+)</option>
                    <option value="adjustment" className="bg-[#111111]">Audit Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Quantity Change</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white h-9 focus:border-zinc-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glass chipped during cleanup, Re-order arrived"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-white placeholder-zinc-650 h-9 focus:border-zinc-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:bg-[#202020] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gold border border-gold/40 text-dark-bg font-bold hover:bg-[#b08e4d] rounded-lg transition-colors"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Log Filters */}
      <div className="p-3 bg-dark-bg border-b border-dark-border flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1 shrink-0">
          <Tag size={11} className="text-gold" /> Filters
        </span>
        <div className="flex gap-1">
          {(['All', 'increase', 'decrease', 'adjustment'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap border ${
                filterType === type
                  ? 'bg-[#1a1a1a] text-gold border-gold/25'
                  : 'bg-dark-card text-zinc-400 border-dark-border/40 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              {type === 'All' ? 'All Logs' : type === 'increase' ? 'Restocks' : type === 'decrease' ? 'Shrinkages' : 'Audits'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto max-h-[460px] p-3 space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-550 select-none">
            <History size={28} className="stroke-1 mb-2 opacity-40 text-gold" />
            <p className="text-xs text-center font-medium text-zinc-400">No ledger entries match current filter</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 border border-dark-border rounded-xl bg-dark-bg/40 hover:bg-[#1a1a1a] transition-all flex items-start gap-2 text-xs"
            >
              {/* Type Badge indicator */}
              <div
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 border ${getLogBadgeColors(
                  log.changeType
                )}`}
              >
                {log.changeType === 'increase' ? `+${log.amount}` : log.changeType === 'decrease' ? `-${log.amount}` : '±'}
              </div>

              {/* Log Detail Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1.5">
                  <p className="font-semibold text-white font-display truncate">{log.itemName}</p>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono flex items-center gap-0.5" title={log.timestamp}>
                    <Calendar size={10} />
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{log.reason}</p>
                <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-1.5 border-t border-dark-border/40 pt-1">
                  <span>Logged successfully</span>
                  <span className="font-medium bg-dark-bg text-gold px-1.5 py-0.2 rounded border border-dark-border/40">{formatDate(log.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
