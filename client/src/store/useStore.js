import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,              // logged in user or null
  jwt: null,               // JWT in memory only
  kingdoms: [],            // all kingdoms (lightweight — position + fog state)
  visitHistory: [],        // usernames visited this session
  activeKingdom: null,     // currently viewed kingdom (full data)
  camera: { cx: 2000, cy: 2000, zoom: 1.0 },
  ravenInFlight: false,
  searchQuery: '',
  searchResult: null,
  hallOfLegends: [],       // top 3 kingdom usernames

  // Actions
  setJwt: (jwt) => set({ jwt }),
  setUser: (user) => set({ user }),
  setKingdoms: (kingdoms) => set({ kingdoms }),
  
  addToVisitHistory: (username) => set((state) => ({ 
     visitHistory: [...new Set([...state.visitHistory, username])] 
  })),
  
  setActiveKingdom: (kingdom) => set({ activeKingdom: kingdom }),
  setCamera: (camera) => set({ camera }),
  setRavenInFlight: (ravenInFlight) => set({ ravenInFlight }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResult: (searchResult) => set({ searchResult }),
  setHallOfLegends: (hallOfLegends) => set({ hallOfLegends }),

  logout: () => set({ user: null, jwt: null }),
}));
