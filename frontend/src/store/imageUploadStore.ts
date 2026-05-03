import { create } from 'zustand';

interface ImageUploadState {
  selectedFile: File | null;
  clearSelectedFile: () => void;
  setSelectedFile: (file: File | null) => void;
}

export const useImageUploadStore = create<ImageUploadState>((set) => ({
  selectedFile: null,
  clearSelectedFile: () => set({ selectedFile: null }),
  setSelectedFile: (file) => set({ selectedFile: file }),
}));
