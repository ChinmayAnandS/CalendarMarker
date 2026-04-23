import { create } from 'zustand';
import type { AppState, ExtractedEvent } from '../shared/types';

interface Store {
  state: AppState;
  setState: (s: AppState) => void;
  updateEvent: (patch: Partial<ExtractedEvent>) => void;
}

export const useStore = create<Store>((set) => ({
  state: { status: 'idle' },
  setState: (s) => set({ state: s }),
  updateEvent: (patch) =>
    set((store) => {
      if (store.state.status !== 'review') return store;
      return { state: { status: 'review', event: { ...store.state.event, ...patch } } };
    }),
}));
