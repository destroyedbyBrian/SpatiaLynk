const API_BASE_URL = 'https://destroyedbybrian-spatialynk-2-0.hf.space';

export interface Location {
  latitude: number;
  longitude: number;
}
export interface RecommendationRequest {
  userId: string;
  prompt: string;
  currentLocation?: Location;
}
export interface POIInfo {
  poi_id: string;
  name: string;
  score: number;
  price: string;
  type: string;
  details: {
    category?: string;
    price?: string;
    popularity?: number | string;
    region?: string;
    textual?: string;
    latitude?: number;
    longitude?: number;
    district?: string;
    num_pois?: number;
    description?: string;
    num_venues?: number;
    num_districts?: number;
    address?: string;
  };
}
export interface Explanation {
  poi_id: string;
  poi_name: string;
  human_explanation: string;
  top_factors: string[];
  score: number;
}
export interface RecommendationResponse {
  success: boolean;
  userId: string;
  prompt: string;
  recommendations: {
    level_0: POIInfo[];
    level_1: POIInfo[];
    level_2: POIInfo[];
  };
  explanations: {
    level_0: Explanation[];
    level_1: Explanation[];
    level_2: Explanation[];
  };
}

export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error(`API health check failed with status: ${response.status}`);
    }
  } catch (err) {
      console.error('API health check failed:', err);
  }
}

export const testUser = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/test-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    console.error('Test User failed:', err)
  }
}

export const getRecommendations = async (request: RecommendationRequest) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Recommendations received:', {
      level_0_count: data.recommendations?.level_0?.length,
      level_1_count: data.recommendations?.level_1?.length,
      level_2_count: data.recommendations?.level_2?.length,
    });

    if (data) {
      console.log('Level 0:', JSON.stringify(data.recommendations.level_0, null, 2));
      console.log('Level 1:', JSON.stringify(data.recommendations.level_1, null, 2));
      console.log('Level 2:', JSON.stringify(data.recommendations.level_2, null, 2));
    }

    return data;
  } catch (err) {
      console.error('Failed to fetch recommendations:', err);
  }
}