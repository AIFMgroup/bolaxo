import { create } from 'zustand'

export interface BuyerPreferences {
  regions: string[]
  industries: string[]
  revenueMin: string
  revenueMax: string
  ebitdaMin: string
  ebitdaMax: string
  buyerType: 'operational' | 'financial' | ''
  emailAlerts: boolean
}

export interface BuyerProfile {
  verified: boolean
  bankIdVerified: boolean
  linkedInUrl: string
  companyInfo: string
  createdAt: Date | null
}

type MatchStatus =
  | 'saved'
  | 'unsaved'
  | 'invite_sent'
  | 'nda_signed'
  | 'dd_start'

interface MatchEvent {
  listingId: string
  status: MatchStatus
  note?: string
  timestamp: string
}

interface BuyerStore {
  preferences: BuyerPreferences
  profile: BuyerProfile
  savedObjects: string[]
  compareList: string[]
  shortlist: string[]
  ndaRequestedObjects: string[] // Objects where user has requested NDA access
  matchEvents: MatchEvent[]
  updatePreferences: (prefs: Partial<BuyerPreferences>) => void
  updateProfile: (profile: Partial<BuyerProfile>) => void
  toggleSaved: (objectId: string) => void
  toggleCompare: (objectId: string) => void
  toggleShortlist: (objectId: string) => void
  requestNDA: (objectId: string) => void // Request NDA access (not yet approved)
  clearCompare: () => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  logMatchEvent: (listingId: string, status: MatchStatus, note?: string) => void
  getLatestStatus: (objectId: string) => MatchEvent | undefined
  hasRequestedNDA: (objectId: string) => boolean // Check if NDA has been requested
}

const initialPreferences: BuyerPreferences = {
  regions: [],
  industries: [],
  revenueMin: '',
  revenueMax: '',
  ebitdaMin: '',
  ebitdaMax: '',
  buyerType: '',
  emailAlerts: true,
}

const initialProfile: BuyerProfile = {
  verified: false,
  bankIdVerified: false,
  linkedInUrl: '',
  companyInfo: '',
  createdAt: null,
}

export const useBuyerStore = create<BuyerStore>((set, get) => ({
  preferences: initialPreferences,
  profile: initialProfile,
  savedObjects: [],
  compareList: [],
  shortlist: [],
  ndaRequestedObjects: [],
  matchEvents: [],

  updatePreferences: (prefs) => {
    set((state) => ({
      preferences: { ...state.preferences, ...prefs }
    }))
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  updateProfile: (profile) => {
    set((state) => ({
      profile: { ...state.profile, ...profile }
    }))
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  toggleSaved: (objectId) => {
    set((state) => {
      const alreadySaved = state.savedObjects.includes(objectId)
      const updatedSaved = alreadySaved
        ? state.savedObjects.filter((id) => id !== objectId)
        : [...state.savedObjects, objectId]

      return {
        savedObjects: updatedSaved,
        matchEvents: [
          ...state.matchEvents,
          {
            listingId: objectId,
            status: alreadySaved ? 'unsaved' : 'saved',
            timestamp: new Date().toISOString()
          }
        ]
      }
    })
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  toggleCompare: (objectId) => {
    set((state) => {
      const inList = state.compareList.includes(objectId)
      const newList = inList
        ? state.compareList.filter(id => id !== objectId)
        : state.compareList.length < 3
          ? [...state.compareList, objectId]
          : state.compareList
      return { compareList: newList }
    })
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  toggleShortlist: (objectId) => {
    set((state) => ({
      shortlist: state.shortlist.includes(objectId)
        ? state.shortlist.filter(id => id !== objectId)
        : [...state.shortlist, objectId]
    }))
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  requestNDA: (objectId) => {
    set((state) => {
      const alreadyRequested = state.ndaRequestedObjects.includes(objectId)
      if (alreadyRequested) {
        return state
      }

      return {
        ndaRequestedObjects: [...state.ndaRequestedObjects, objectId],
        matchEvents: [
          ...state.matchEvents,
          {
            listingId: objectId,
            status: 'nda_signed',
            timestamp: new Date().toISOString()
          }
        ]
      }
    })
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  clearCompare: () => {
    set({ compareList: [] })
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  logMatchEvent: (objectId: string, status: MatchStatus, note?: string) => {
    set((state) => ({
      matchEvents: [
        ...state.matchEvents,
        {
          listingId: objectId,
          status,
          note,
          timestamp: new Date().toISOString()
        }
      ]
    }))
    setTimeout(() => get().saveToLocalStorage(), 100)
  },

  getLatestStatus: (objectId: string) => {
    const events = get().matchEvents
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].listingId === objectId) return events[i]
    }
    return undefined
  },

  hasRequestedNDA: (objectId: string) => {
    return get().ndaRequestedObjects.includes(objectId)
  },

  saveToLocalStorage: () => {
    const { preferences, profile, savedObjects, compareList, shortlist, ndaRequestedObjects, matchEvents } = get()
    if (typeof window !== 'undefined') {
      localStorage.setItem('bolagsportalen_buyer', JSON.stringify({
        preferences,
        profile,
        savedObjects,
        compareList,
        shortlist,
        ndaSignedObjects: ndaRequestedObjects, // Keep old key for backward compatibility
        ndaRequestedObjects, // Add new key for future
        matchEvents,
      }))
    }
  },

  loadFromLocalStorage: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bolagsportalen_buyer')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          // Support both old and new key names for backward compatibility
          if (data.ndaSignedObjects && !data.ndaRequestedObjects) {
            data.ndaRequestedObjects = data.ndaSignedObjects
          }
          set(data)
        } catch (e) {
          console.error('Failed to load buyer data', e)
        }
      }
    }
  },
}))

