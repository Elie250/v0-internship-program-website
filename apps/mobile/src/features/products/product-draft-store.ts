import { create } from 'zustand'

type ProductDraftState = {
  pendingBarcode: string | null
  pendingPhotoUri: string | null
  setPendingBarcode: (value: string) => void
  setPendingPhotoUri: (value: string) => void
  consumeBarcode: () => string | null
  consumePhotoUri: () => string | null
}

export const useProductDraft = create<ProductDraftState>((set, get) => ({
  pendingBarcode: null,
  pendingPhotoUri: null,
  setPendingBarcode: (value) => set({ pendingBarcode: value }),
  setPendingPhotoUri: (value) => set({ pendingPhotoUri: value }),
  consumeBarcode: () => {
    const value = get().pendingBarcode
    set({ pendingBarcode: null })
    return value
  },
  consumePhotoUri: () => {
    const value = get().pendingPhotoUri
    set({ pendingPhotoUri: null })
    return value
  },
}))
