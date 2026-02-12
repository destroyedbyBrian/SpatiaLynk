const API_BASE_URL = 'https://destroyedbybrian-spatialynk-2-0.hf.space';

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
}

// Request Interfaces
export interface RecommendationRequest {
  userId: string;
  prompt: string;
  currentLocation?: Location;
  includeExplanations?: boolean; // Set to true to get explanation data with recommendations
}

export interface UserProfileRequest {
  user_id: string;
  interests: string; // Semicolon-separated, e.g., "food;coffee;shopping"
}

export interface InteractionPayload {
  user_id: string;
  poi_id: string;
  interaction_type: 'view' | 'click' | 'visit' | 'expand' | 'other';
  value?: number;
  timestamp?: string; // ISO format or mm/dd/yyyy HH:MM:SS
}

export interface ExplanationRequest {
  user_id: string;
  poi_id: string;
  level: number; // 0, 1, or 2
  current_location?: Location;
}

// Response Interfaces
export interface ScoreBreakdown {
  total_score: number;
  feature_based?: {
    raw_score: number;
    contribution: number;
    weight: number;
    description: string;
  };
  graph_based?: {
    raw_score: number;
    contribution: number;
    weight: number;
    description: string;
  };
  distance?: {
    raw_score: number;
    contribution: number;
    weight: number;
    description: string;
  };
  interest_match?: {
    raw_score: number;
    contribution: number;
    weight: number;
    description: string;
  };
}

export interface Explanation {
  poi_id: string;
  poi_name: string;
  level: number;
  human_explanation: string;
  top_factors?: string[];
  reason_flags: {
    visited_before?: boolean;
    very_nearby?: boolean;
    nearby?: boolean;
    matches_interest?: boolean;
    matches_budget?: boolean;
    popular?: boolean;
    highly_popular?: boolean;
    similar_to_past?: boolean;
    in_popular_venue?: boolean;
    has_many_options?: boolean;
    trending_in_area?: boolean;
  };
  active_reasons: string[]; // e.g., ["visited_before", "nearby", "matches_interest"]
  score_breakdown: ScoreBreakdown;
  top_contributing_factors: string[]; // e.g., ["distance", "feature_based", "interest_match"]
  similar_visited_pois: {
    name: string;
    similarity: number;
  }[];
  user_context: {
    name: string;
    interests: string;
    area: string;
    price_sensitivity: string;
  };
  confidence_indicator: string;
}

export interface POIInfo {
  poi_id: string;
  name: string;
  score: number;
  type: 'Individual POI' | 'Container/Venue' | 'District' | string;
  details: {
    category?: string;
    price?: string;
    popularity?: number;
    region?: string;
    latitude?: number;
    longitude?: number;
    num_pois?: number;
    description?: string;
    district?: string;
    num_venues?: number;
    score_components?: {
      joint_embedding?: number;
      spatial?: number;
      interest?: number;
      hierarchical?: number;
      intent_match?: number | null;
      distance_km?: number;
    };
  };
  explanation?: Explanation; // Only present if includeExplanations=true
}

export interface RecommendationSummary {
  total_recommendations: number;
  explanation_stats?: {
    total_recommendations: number;
    average_confidence?: number;
    top_reasons?: [string, number][]; // [reason, count]
  };
  prompt_type?: 'exploratory' | 'category_based' | string;
  detected_intent?: string | null;
}

export interface RecommendationResponse {
  success?: boolean;
  userId?: string;
  prompt: string;
  recommendations: {
    level_0: POIInfo[];
    level_1: POIInfo[];
    level_2: POIInfo[];
  };
  explanations?: {  // Make optional
    level_0: Explanation[];
    level_1: Explanation[];
    level_2: Explanation[];
  };
}

export interface HealthResponse {
  status: string;
  framework_loaded: boolean;
  framework_type: string | null;
  total_users: number;
  total_pois_level_0: number;
  interaction_ready: boolean;
}

export interface ExplanationResponse {
  poi_id: string;
  poi_name: string;
  level: number;
  human_explanation: string;
  reason_flags: Record<string, boolean>;
  active_reasons: string[];
  score_breakdown: ScoreBreakdown;
  top_contributing_factors: string[];
  similar_visited_pois: {name: string; similarity: number}[];
  user_context: {
    name: string;
    interests: string;
    area: string;
    price_sensitivity: string;
  };
  confidence_indicator: string;
}


export const checkAPIHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API health check failed with status: ${response.status}`);
  }
  
  return response.json();
};

export const addUser = async (request: UserProfileRequest): Promise<{success: boolean; user_id: string; idx: number; message: string}> => {
  const response = await fetch(`${API_BASE_URL}/add_user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({detail: 'Unknown error'}));
    throw new Error(error.detail || `Failed to add user with status: ${response.status}`);
  }
  
  return response.json();
};

export const recordInteraction = async (payload: InteractionPayload): Promise<{ok: boolean; user_id: string; poi_id: string}> => {
  const response = await fetch(`${API_BASE_URL}/interaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({detail: 'Unknown error'}));
    throw new Error(error.detail || `Failed to record interaction with status: ${response.status}`);
  }
  
  return response.json();
};

export const getRecommendations = async (
  request: RecommendationRequest
): Promise<RecommendationResponse> => {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: request.userId,
      prompt: request.prompt,
      currentLocation: request.currentLocation,
      includeExplanations: request.includeExplanations ?? true
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Failed to fetch recommendations with status: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  
  console.log('Recommendations received:', {
    level_0_count: data.recommendations?.level_0?.length,
    level_1_count: data.recommendations?.level_1?.length,
    level_2_count: data.recommendations?.level_2?.length,
    mode: data.mode,
    prompt_type: data.summary?.prompt_type
  });

  return data;
};

export const getExplanation = async (request: ExplanationRequest): Promise<ExplanationResponse> => {
  const response = await fetch(`${API_BASE_URL}/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({detail: 'Unknown error'}));
    throw new Error(error.detail || `Failed to fetch explanation with status: ${response.status}`);
  }
  
  return response.json();
};

export const getReasonFlags = async (userId: string, poiId: string, level: number = 0): Promise<{
  user_id: string;
  poi_id: string;
  flags: Record<string, boolean>;
  active_flags: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/explain/flags/${userId}/${poiId}?level=${level}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch flags with status: ${response.status}`);
  }
  
  return response.json();
};

// Helper function to extract active flags as badges
export const getActiveBadges = (explanation?: Explanation): string[] => {
  if (!explanation) return [];
  return explanation.active_reasons || [];
};

// Helper to check if recommendation is high confidence
export const isHighConfidence = (explanation?: Explanation): boolean => {
  return explanation?.confidence_indicator === 'strong';
};