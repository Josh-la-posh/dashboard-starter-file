import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Merchant } from '../types/auth';

type MerchantSelectionState = {
  selectedMerchantCode?: string;
  merchants: Merchant[];
};

type MerchantSelectionActions = {
  setMerchant: (code: string) => void;
  setMerchants: (list: Merchant[]) => void;
  getMerchants: () => Merchant[];
  getSelectedMerchant: () => Merchant | undefined;
  clear: () => void;
};

export const useMerchantSelectionStore = create<MerchantSelectionState & MerchantSelectionActions>()(
  persist(
    (set, get) => ({
      selectedMerchantCode: undefined,
      merchants: [],
      setMerchant: (code) => set({ selectedMerchantCode: code }),
      setMerchants: (list) => set(state => ({ merchants: list, selectedMerchantCode: state.selectedMerchantCode || list[0]?.merchantCode })),
      getMerchants: () => get().merchants,
      getSelectedMerchant: () => {
        const code = get().selectedMerchantCode;
        if (!code) return undefined;
        return get().merchants.find(m => m.merchantCode === code);
      },
      clear: () => set({ merchants: [], selectedMerchantCode: undefined })
    }),
    { name: 'merchant-selection' }
  )
);

// Helper to ensure a selected merchant exists (pick first automatically if none)
export function ensureMerchantSelected() {
  const store = useMerchantSelectionStore.getState();
  if (!store.selectedMerchantCode) {
    const first = store.getMerchants()[0];
    if (first) {
      store.setMerchant(first.merchantCode);
    }
  }
}