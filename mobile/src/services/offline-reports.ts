import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { toast } from '@/services/toast';

export interface PendingReport {
  idempotencyKey: string;
  imageUrl: string;
  condition: string;
  description?: string;
  latitude: number;
  longitude: number;
  addressHint?: string;
  createdAt: string;
}

interface OfflineReportStore {
  queue: PendingReport[];
  isSyncing: boolean;
  enqueueReport: (report: Omit<PendingReport, 'idempotencyKey' | 'createdAt'>) => Promise<void>;
  flushQueue: () => Promise<void>;
  loadQueue: () => Promise<void>;
}

const STORAGE_KEY = '@petmatch_offline_reports';

export const useOfflineReportStore = create<OfflineReportStore>((set, get) => ({
  queue: [],
  isSyncing: false,

  loadQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ queue: JSON.parse(stored) });
      }
    } catch {
      // Ignore load error
    }
  },

  enqueueReport: async (reportData) => {
    const newReport: PendingReport = {
      ...reportData,
      idempotencyKey: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedQueue = [...get().queue, newReport];
    set({ queue: updatedQueue });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));

    toast.info({
      title: 'Αποθηκεύτηκε εκτός σύνδεσης',
      body: 'Η αναφορά θα σταλεί μόλις συνδεθείτε στο διαδίκτυο.',
    });
  },

  flushQueue: async () => {
    const { queue, isSyncing } = get();
    if (queue.length === 0 || isSyncing) return;

    set({ isSyncing: true });
    const remainingQueue: PendingReport[] = [];
    let syncedCount = 0;

    for (const report of queue) {
      try {
        await api.post('/reports', report);
        syncedCount++;
      } catch {
        remainingQueue.push(report);
      }
    }

    set({ queue: remainingQueue, isSyncing: false });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));

    if (syncedCount > 0) {
      toast.success({
        title: 'Επιτυχής συγχρονισμός',
        body: `Απεστάλησαν ${syncedCount} αναφορές που εκκρεμούσαν.`,
      });
    }
  },
}));
