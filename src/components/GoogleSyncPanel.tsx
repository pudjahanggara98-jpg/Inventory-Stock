import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CheckCircle2, 
  Loader2, 
  X, 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  LogOut, 
  Users,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { initAuth, googleSignIn, logout, setAccessToken } from '../lib/firebase';
import { 
  exportToGoogleSheets, 
  backupToGoogleDrive, 
  listGoogleDriveBackups, 
  downloadDriveBackup, 
  DriveBackupFile 
} from '../lib/googleApi';
import { EquipmentItem, StockLog } from '../types';

interface GoogleSyncPanelProps {
  items: EquipmentItem[];
  logs: StockLog[];
  onRestore: (items: EquipmentItem[], logs: StockLog[]) => void;
}

export function GoogleSyncPanel({ items, logs, onRestore }: GoogleSyncPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' | 'info' } | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [showBackupList, setShowBackupList] = useState(false);
  const [latestSheetUrl, setLatestSheetUrl] = useState<string | null>(null);

  // Set up Firebase Auth listeners
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsInitializing(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsInitializing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Set up status messages auto-dismissal
  useEffect(() => {
    if (statusMessage && statusMessage.type !== 'info') {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Fetch backups whenever token becomes available
  useEffect(() => {
    if (token) {
      loadBackupList();
    } else {
      setDriveBackups([]);
      setShowBackupList(false);
    }
  }, [token]);

  const loadBackupList = async () => {
    if (!token) return;
    try {
      const files = await listGoogleDriveBackups(token);
      setDriveBackups(files);
    } catch (err) {
      console.error('Error fetching Google Drive backups:', err);
    }
  };

  const handleSignIn = async () => {
    setLoadingAction('sign_in');
    setStatusMessage(null);
    try {
      const response = await googleSignIn();
      if (response) {
        setUser(response.user);
        setToken(response.accessToken);
        setStatusMessage({ text: `Welcome back, ${response.user.displayName}! Connected successfully.`, type: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'Authentication with Google failed. Please retry.', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    setLoadingAction('sign_out');
    try {
      await logout();
      setUser(null);
      setToken(null);
      setLatestSheetUrl(null);
      setStatusMessage({ text: 'Disconnected from Google Account. Clean session cleared.', type: 'info' });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportSheets = async () => {
    if (!token) return;
    setLoadingAction('export_sheets');
    setStatusMessage(null);
    try {
      const sheetUrl = await exportToGoogleSheets(token, items);
      setLatestSheetUrl(sheetUrl);
      setStatusMessage({ text: 'Google Sheet created and formatted with live catalog values!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Google Sheets generation failed. Verify network scopes.', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBackupDrive = async () => {
    if (!token) return;
    setLoadingAction('backup_drive');
    setStatusMessage(null);
    try {
      const backupName = await backupToGoogleDrive(token, items, logs);
      await loadBackupList(); // Refresh backup list
      setStatusMessage({ text: `Backup file "${backupName}" successfully archived onto Google Drive!`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Archiving backup onto Drive failed.', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestoreFromBackup = async (file: DriveBackupFile) => {
    if (!token) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to load backup "${file.name}"? This action will overwrite your current browser local storage database.`
    );
    if (!isConfirmed) return;

    setLoadingAction(`restore_${file.id}`);
    setStatusMessage(null);
    try {
      const data = await downloadDriveBackup(token, file.id);
      onRestore(data.items, data.logs);
      setStatusMessage({ text: `Database successfully restored back to ${new Date(file.createdTime).toLocaleString()} state!`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Error executing Google Drive restore sequence.', type: 'error' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div id="google-sync-panel" className="bg-dark-card border border-dark-border rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-dark-border bg-dark-sidebar/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Cloud size={18} className="text-gold" />
          <h2 className="font-semibold font-display text-sm tracking-tight">Google Workspace Integration</h2>
        </div>
        {user && (
          <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-4">
        {/* Loading Indicator */}
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <Loader2 size={24} className="animate-spin text-gold mb-2" />
            <p className="text-xs">Initializing Google services...</p>
          </div>
        ) : !user ? (
          /* Sign-In View */
          <div className="space-y-3.5 py-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export equipment catalogs directly into premium-styled <strong className="text-white">Google Sheet</strong> structures and save/restore continuous inventory history logs straight to <strong className="text-white">Google Drive</strong>.
            </p>
            
            {/* Standard styled Sign-In Button */}
            <button
              onClick={handleSignIn}
              disabled={loadingAction === 'sign_in'}
              className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-100 text-[#1f2937] font-semibold text-xs py-2 px-4 border border-zinc-200 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'sign_in' ? (
                <>
                  <Loader2 size={16} className="animate-spin text-dark-bg" />
                  <span>Connecting to Google Account...</span>
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4.5 w-4.5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Logged In Workspace Interface */
          <div className="space-y-4">
            {/* Profile Info */}
            <div className="flex items-center justify-between p-2.5 bg-dark-bg/60 border border-dark-border/40 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Google Profile'} className="h-7 w-7 rounded-full border border-dark-border shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
                    <Users size={14} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-white truncate leading-none">{user.displayName || 'Google Member'}</h4>
                  <p className="text-[9px] text-zinc-500 truncate mt-1">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loadingAction === 'sign_out'}
                title="Disconnect from Google"
                className="p-1 px-2 border border-dark-border bg-dark-bg hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-mono font-bold"
              >
                <LogOut size={10} /> Disconnect
              </button>
            </div>

            {/* Core Workspace Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportSheets}
                disabled={!!loadingAction}
                className="p-3 bg-dark-bg border border-dark-border hover:border-gold/25 rounded-xl text-left transition-all hover:bg-[#151515] group cursor-pointer disabled:opacity-55"
              >
                <FileSpreadsheet size={18} className="text-[#34a853] mb-1.5 transition-transform group-hover:scale-110" />
                <h4 className="text-xs font-bold text-white font-display">Export Sheets</h4>
                <p className="text-[9px] text-zinc-500 leading-tight mt-1">Export formatted live equipment register</p>
              </button>

              <button
                onClick={handleBackupDrive}
                disabled={!!loadingAction}
                className="p-3 bg-dark-bg border border-dark-border hover:border-gold/25 rounded-xl text-left transition-all hover:bg-[#151515] group cursor-pointer disabled:opacity-55"
              >
                <Database size={18} className="text-[#4285f4] mb-1.5 transition-transform group-hover:scale-110" />
                <h4 className="text-xs font-bold text-white font-display">Backup Drive</h4>
                <p className="text-[9px] text-zinc-500 leading-tight mt-1">Archive database configuration snapshot</p>
              </button>
            </div>

            {/* Google Drive Restore / backups section */}
            <div className="border border-dark-border/60 bg-dark-sidebar/10 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => setShowBackupList(!showBackupList)}
                className="w-full p-2.5 flex items-center justify-between text-zinc-400 hover:text-white hover:bg-dark-sidebar/30 transition-colors font-medium text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <FolderOpen size={13} className="text-gold" />
                  <span>Browse Backups in Google Drive ({driveBackups.length})</span>
                </span>
                <span className="text-[10px] text-gold">{showBackupList ? 'Collapse' : 'Expand'}</span>
              </button>

              <AnimatePresence>
                {showBackupList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-dark-border overflow-hidden bg-dark-bg/40 max-h-[180px] overflow-y-auto"
                  >
                    {driveBackups.length === 0 ? (
                      <p className="p-4 text-center text-[10px] text-zinc-500 italic">No back-up copies (store_equipment_backup_*.json) found in your Drive.</p>
                    ) : (
                      <div className="divide-y divide-dark-border/40">
                        {driveBackups.map(file => {
                          const isRestoring = loadingAction === `restore_${file.id}`;
                          return (
                            <div key={file.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#151515] transition-colors">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-white truncate leading-tight">{file.name}</p>
                                <p className="text-[9px] text-zinc-500 mt-0.5">{new Date(file.createdTime).toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => handleRestoreFromBackup(file)}
                                disabled={!!loadingAction}
                                className="px-2 py-1 bg-gold hover:bg-[#b08e4d] disabled:opacity-50 text-dark-bg font-bold rounded text-[9px] transition-colors shrink-0 flex items-center gap-0.5"
                              >
                                {isRestoring ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <>Restore <ArrowRight size={8} /></>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Dynamic sheet viewer callback link */}
        {latestSheetUrl && user && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Spreadsheet Ready</span>
              <p className="text-[10px] text-zinc-300 truncate mt-0.5">Store Equipment Stock Registry Sheet</p>
            </div>
            <a
              href={latestSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-[#34a853] hover:bg-[#2c8d46] text-white font-bold rounded-lg flex items-center gap-1 text-[10px] transition-colors shrink-0 shadow-sm"
            >
              Open <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Feedback / Logs Messaging Box */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className={`p-3 rounded-xl text-xs border flex items-start gap-2 relative overflow-hidden ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                  : statusMessage.type === 'warn'
                  ? 'bg-amber-950/20 border-amber-900/30 text-gold'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/25 border-rose-900/30 text-rose-400'
                  : 'bg-[#151515] border-dark-border text-zinc-400'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={13} className="text-emerald-400" />
                ) : statusMessage.type === 'error' ? (
                  <AlertTriangle size={13} className="text-rose-400" />
                ) : (
                  <RefreshCw size={12} className="text-gold" />
                )}
              </div>
              <p className="pr-4 leading-relaxed text-[11px] font-medium">{statusMessage.text}</p>
              <button 
                onClick={() => setStatusMessage(null)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
