import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComplianceDraft } from '../types/complianceDraft';
import { emptyComplianceDraft } from '../types/complianceDraft';

type DraftState = {
  draft: ComplianceDraft;
};

type DraftActions = {
  update: (partial: Partial<ComplianceDraft>) => void;
  setStepIndex: (index: number) => void;
  markStepComplete: (index: number, totalSteps: number) => void; // increments progress if appropriate
  reset: () => void;
  markSubmitted: () => void; // sets progress to 6 (complete)
};

// Progress model: progress represents number of completed steps (0..6). We'll consider 6 = fully complete.

export const useComplianceDraftStore = create<DraftState & DraftActions>()(
  persist(
    (set, get) => ({
      draft: emptyComplianceDraft(),
      update: (partial) => set({ draft: { ...get().draft, ...partial } }),
      setStepIndex: (index) => set({ draft: { ...get().draft, stepIndex: index } }),
      markStepComplete: (index, totalSteps) => {
        const { draft } = get();
        // Only increment if this step not already reflected in progress
        // progress counts completed steps; if user advances beyond current progress, increment.
        let newProgress = draft.progress;
        if (index >= draft.progress && draft.progress < totalSteps) {
          newProgress = index + 1; // step index completed -> progress is count
        }
        set({ draft: { ...draft, progress: newProgress } });
      },
      reset: () => set({ draft: emptyComplianceDraft() }),
      markSubmitted: () => set({ draft: { ...get().draft, progress: 6 } }),
    }),
    {
      name: 'compliance-draft',
      partialize: (state) => state, // persist entire draft
    }
  )
);

export function syncProgressToLegacyStorage(progress: number) {
  localStorage.setItem('compliance:progress', String(progress));
  window.dispatchEvent(new StorageEvent('storage', { key: 'compliance:progress', newValue: String(progress) }));
}