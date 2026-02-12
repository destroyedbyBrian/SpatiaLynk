import { create } from 'zustand';
import {
  Explanation,
  Location,
  POIInfo,
  RecommendationResponse
} from '../services/MPRApi';

interface RecommendationState {
  recommendations: RecommendationResponse | null;
  userLocation: Location | null;
  currentPrompt: string;
  
  loading: boolean;
  error: string | null;
  
  level0: POIInfo[];
  level1: POIInfo[];
  level2: POIInfo[];
  
  explanations0: Explanation[];
  explanations1: Explanation[];
  explanations2: Explanation[];
  
  selectedLevel: number;
  selectedPOI: POIInfo | null;
  
  setRecommendations: (data: RecommendationResponse) => void;
  setUserLocation: (location: Location | null) => void;
  setCurrentPrompt: (prompt: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedLevel: (level: number) => void;
  setSelectedPOI: (poi: POIInfo | null) => void;
  clearRecommendations: () => void;
  clearError: () => void;
  
  getRecommendationsByLevel: (level: number) => POIInfo[];
  getExplanationsByLevel: (level: number) => Explanation[];
  getTotalRecommendationsCount: () => number;
  hasRecommendations: () => boolean;
}

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  recommendations: null,
  userLocation: null,
  currentPrompt: '',
  loading: false,
  error: null,
  level0: [],
  level1: [],
  level2: [],
  explanations0: [],
  explanations1: [],
  explanations2: [],
  selectedLevel: 0,
  selectedPOI: null,

  setRecommendations: (response) => set({
    recommendations: response,
    level0: response.recommendations.level_0,
    level1: response.recommendations.level_1,
    level2: response.recommendations.level_2,
    explanations0: response.recommendations.level_0
      .map(poi => poi.explanation)
      .filter((exp): exp is Explanation => exp !== undefined),
    explanations1: response.recommendations.level_1
      .map(poi => poi.explanation)
      .filter((exp): exp is Explanation => exp !== undefined),
    explanations2: response.recommendations.level_2
      .map(poi => poi.explanation)
      .filter((exp): exp is Explanation => exp !== undefined),
  }),

  setUserLocation: (location) => set({ userLocation: location }),

  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setSelectedLevel: (level) => set({ selectedLevel: level }),

  setSelectedPOI: (poi) => set({ selectedPOI: poi }),

  clearRecommendations: () => set({
    recommendations: null,
    level0: [],
    level1: [],
    level2: [],
    explanations0: [],
    explanations1: [],
    explanations2: [],
    selectedPOI: null,
    currentPrompt: '',
    error: null,
  }),

  clearError: () => set({ error: null }),

  getRecommendationsByLevel: (level) => {
    const state = get();
    switch (level) {
      case 0: return state.level0;
      case 1: return state.level1;
      case 2: return state.level2;
      default: return [];
    }
  },

  getExplanationsByLevel: (level) => {
    const state = get();
    switch (level) {
      case 0: return state.explanations0;
      case 1: return state.explanations1;
      case 2: return state.explanations2;
      default: return [];
    }
  },

  getTotalRecommendationsCount: () => {
    const state = get();
    return (
      state.level0.length +
      state.level1.length +
      state.level2.length
    );
  },

  hasRecommendations: () => {
    const state = get();
    return state.recommendations !== null;
  },
}));