import { SafeAreaContainer } from "@/constant/GlobalStyles";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { ArrowUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { styled } from "styled-components";
import {
  checkAPIHealth,
  getRecommendations,
  RecommendationResponse
} from '../services/MPRApi';
import { useRecommendationStore } from '../store/recommendationStore';

const userId = "84273d4e-1e2c-4baf-8f0d-7b4f2ef833d0";

export default function Index() {
  const router = useRouter();
  const rs = useRecommendationStore(s => s.recommendations);
  const explanations0 = useRecommendationStore(s => s.explanations0);
  const loading = useRecommendationStore(s => s.loading);
  const setLoading = useRecommendationStore(s => s.setLoading);
  const setRecommendations = useRecommendationStore(s => s.setRecommendations);
  const [prompt, setPrompt] = useState<string>("");
  const { userLocation, setUserLocation } = useRecommendationStore();
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [expandedPOI, setExpandedPOI] = useState<string | null>(null);
  
  const suggestedPrompts = [
    "Cafes Near Me",
    "Restaurants Nearby",
    "Malls Near Me",
  ];

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    }

    getCurrentLocation();
    checkAPIHealth();
  }, []);

  const handleSuggestion = (item: string) => {
    setPrompt(item);
    setShowKeyboard(false);
    Keyboard.dismiss();
  };

  const handleRecommendations = async () => {
    if (!prompt.trim()) {
      Alert.alert('Empty Search', 'Please enter a search query');
      return;
    }
    
    setLoading(true);
    
    try {
      const response: RecommendationResponse = await getRecommendations({
        userId,
        prompt: prompt.trim(),
        currentLocation: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        } : undefined,
      });

      setRecommendations(response);
      console.log('Recommendations saved to state');

      router.navigate('/map');
      
      Alert.alert(
        'Success!', 
        `Found ${response.recommendations.level_0.length} individual places for you!`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOutsidePress = () => {
    if (showKeyboard) {
      setShowKeyboard(false);
      Keyboard.dismiss();
    }
  };

  // Get explanation for a specific POI
  const getExplanationForPOI = (poiId: string) => {
    return explanations0.find(exp => exp.poi_id === poiId);
  };

  // Toggle expanded state
  const toggleExpanded = (poiId: string) => {
    setExpandedPOI(expandedPOI === poiId ? null : poiId);
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaContainer>
        {loading ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color="#0E6DE8" />
            <Text style={{ marginTop: 12, color: '#666' }}>Getting recommendations...</Text>
          </LoadingContainer>
        ) : rs && rs.recommendations.level_0 && rs.recommendations.level_0.length > 0 ? (
          <ResultsScrollView>
            <ResultsHeader>
              <ResultsTitle>Found {rs.recommendations.level_0.length} places</ResultsTitle>
              <ViewMapButton onPress={() => router.navigate('/map')}>
                <ViewMapButtonText>View on Map 🗺️</ViewMapButtonText>
              </ViewMapButton>
            </ResultsHeader>

            {rs.recommendations.level_0.map((poi) => {
              const explanation = getExplanationForPOI(poi.poi_id);
              const isExpanded = expandedPOI === poi.poi_id;

              return (
                <POICard key={poi.poi_id}>
                  {/* Main POI Info */}
                  <POIMainInfo>
                    <POIName>{poi.name}</POIName>
                    
                    <POIDetailsRow>
                      <POICategory>{poi.details.category}</POICategory>
                      {poi.details.price && (
                        <POIPrice>${poi.details.price}</POIPrice>
                      )}
                    </POIDetailsRow>

                    <POIDetailsRow>
                      {poi.details.region && (
                        <POIRegion>📍 {poi.details.region}</POIRegion>
                      )}
                      <POIScore>⭐ Score: {poi.score.toFixed(2)}</POIScore>
                    </POIDetailsRow>
                  </POIMainInfo>

                  {/* Explanation Section */}
                  {explanation && (
                    <>
                      <ExplanationToggle onPress={() => toggleExpanded(poi.poi_id)}>
                        <ExplanationToggleText>
                          {isExpanded ? '▼' : '▶'} Why this recommendation?
                        </ExplanationToggleText>
                      </ExplanationToggle>

                      {isExpanded && (
                        <ExplanationContainer>
                          {/* Human-readable explanation */}
                          <ExplanationText>{explanation.human_explanation}</ExplanationText>

                          {/* Top factors */}
                          {explanation.top_factors && explanation.top_factors.length > 0 && (
                            <FactorsContainer>
                              <FactorsTitle>Key Factors:</FactorsTitle>
                              {explanation.top_factors.map((factor, index) => (
                                <FactorItem key={index}>
                                  <FactorBullet>•</FactorBullet>
                                  <FactorText>{factor}</FactorText>
                                </FactorItem>
                              ))}
                            </FactorsContainer>
                          )}
                        </ExplanationContainer>
                      )}
                    </>
                  )}

                  {/* Quick Actions */}
                  <ActionsRow>
                    <ActionButton onPress={() => {
                      // Navigate to map and highlight this POI
                      useRecommendationStore.getState().setSelectedPOI(poi);
                      router.navigate('/map');
                    }}>
                      <ActionButtonText>📍 Show on Map</ActionButtonText>
                    </ActionButton>

                    <ActionButton onPress={() => {
                      Alert.alert(
                        poi.name,
                        explanation?.human_explanation || 'No explanation available',
                        [{ text: 'OK' }]
                      );
                    }}>
                      <ActionButtonText>ℹ️ Details</ActionButtonText>
                    </ActionButton>
                  </ActionsRow>
                </POICard>
              );
            })}
          </ResultsScrollView>
        ) : (
          <EmptyStateContainer>
            <EmptyStateText>
              No recommendations available.{'\n'}
              Search for places to get started!
            </EmptyStateText>
          </EmptyStateContainer>
        )}

        {/* Suggested Prompts */}
        {!prompt && (
          <SuggestedScrollView 
            horizontal={true} 
            $keyboard={showKeyboard}
            showsHorizontalScrollIndicator={false}
          >
            {suggestedPrompts.map((item, index) => (
              <SuggestedPromptsContainer key={index} onPress={() => handleSuggestion(item)}>
                <SuggestedPromptsText>{item}</SuggestedPromptsText>
              </SuggestedPromptsContainer>
            ))}
          </SuggestedScrollView>
        )}

        {/* Search Input */}
        <PromptTextInputWrapper $keyboard={showKeyboard} onStartShouldSetResponder={() => true}>
          <PromptText 
            onChangeText={setPrompt}
            value={prompt}
            placeholder="Search for activities or areas"
            placeholderTextColor={"#878787"}
            multiline={true}
            onFocus={() => setShowKeyboard(true)}
          />
          {prompt && (
            <IconContainer onPress={handleRecommendations}>
              <ArrowUp size={24} color={'white'} />
            </IconContainer>
          )}
        </PromptTextInputWrapper>
      </SafeAreaContainer>
    </TouchableWithoutFeedback>
  );
}

// Styled Components
const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ResultsScrollView = styled(ScrollView)`
  flex: 1;
  margin-top: 20px;
  margin-bottom: 100px;
`;

const ResultsHeader = styled(View)`
  margin-bottom: 16px;
`;

const ResultsTitle = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const ViewMapButton = styled(Pressable)`
  background-color: #0E6DE8;
  padding: 12px;
  border-radius: 12px;
  align-items: center;
  margin-bottom: 8px;
`;

const ViewMapButtonText = styled(Text)`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const POICard = styled(View)`
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e0e0e0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const POIMainInfo = styled(View)`
  margin-bottom: 12px;
`;

const POIName = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const POIDetailsRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const POICategory = styled(Text)`
  font-size: 14px;
  color: #0E6DE8;
  font-weight: 500;
`;

const POIPrice = styled(Text)`
  font-size: 14px;
  color: #32CD32;
  font-weight: 600;
`;

const POIRegion = styled(Text)`
  font-size: 12px;
  color: #666;
`;

const POIScore = styled(Text)`
  font-size: 12px;
  color: #FF8C00;
  font-weight: 600;
`;

const ExplanationToggle = styled(Pressable)`
  padding: 8px;
  background-color: #F5F5F5;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const ExplanationToggleText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #0E6DE8;
`;

const ExplanationContainer = styled(View)`
  background-color: #F9F9F9;
  padding: 12px;
  border-radius: 8px;
  border-left-width: 3px;
  border-left-color: #0E6DE8;
  margin-bottom: 12px;
`;

const ExplanationText = styled(Text)`
  font-size: 14px;
  line-height: 20px;
  color: #333;
  margin-bottom: 12px;
`;

const FactorsContainer = styled(View)`
  margin-top: 8px;
`;

const FactorsTitle = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
`;

const FactorItem = styled(View)`
  flex-direction: row;
  margin-bottom: 4px;
`;

const FactorBullet = styled(Text)`
  font-size: 14px;
  color: #0E6DE8;
  margin-right: 6px;
  font-weight: bold;
`;

const FactorText = styled(Text)`
  font-size: 13px;
  color: #555;
  flex: 1;
`;

const ActionsRow = styled(View)`
  flex-direction: row;
  gap: 8px;
`;

const ActionButton = styled(Pressable)`
  flex: 1;
  background-color: #F5F5F5;
  padding: 10px;
  border-radius: 8px;
  align-items: center;
  border-width: 1px;
  border-color: #E0E0E0;
`;

const ActionButtonText = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: #333;
`;

const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 32px;
`;

const EmptyStateText = styled(Text)`
  font-size: 16px;
  color: #666;
  text-align: center;
  line-height: 24px;
`;

const PromptTextInputWrapper = styled(View)<{ $keyboard?: boolean}>`
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 1px;
  background-color: white;
  padding-vertical: 14px;
  padding-horizontal: 16px;
  border-radius: 24px;
  align-self: center;
  position: absolute;
  bottom: ${props => props.$keyboard ? '270px' : '40px'};
  width: 100%;
  background-color: #F5F5F5;
`;

const PromptText = styled(TextInput)`
  font-size: 18px;
  text-align: left;
  line-height: 24px;
  padding: 0;
`;

const IconContainer = styled(Pressable)`
  background-color: #0E6DE8;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  position: absolute;
  right: 10px;
  bottom: 10px;
`;

const SuggestedScrollView = styled(ScrollView)<{ $keyboard?: boolean}>`
  width: 100%;
  position: absolute;
  margin-horizontal: 10px;
  bottom: ${props => props.$keyboard ? '340px' : '110px'};
`;

const SuggestedPromptsContainer = styled(Pressable)`
  background-color: #F5F5F5;
  border-radius: 16px;
  margin-right: 10px;
`;

const SuggestedPromptsText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  padding: 14px;
`;