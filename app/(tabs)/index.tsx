import RecommendationCard from "@/components/rating";
import { SafeAreaContainer } from '@/constant/GlobalStyles';
import { hasPermission } from '@/permissons';
import { supabase } from '@/services/supabase';
import { useUserAuthStore } from '@/store/userAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { styled } from "styled-components";
import {
  addUser,
  checkAPIHealth,
  Explanation,
  getExplanation,
  getRecommendations,
  POIInfo,
  RecommendationResponse,
  recordInteraction
} from '../../services/MPRApi';
import { useRecommendationStore } from '../../store/recommendationStore';

let SIM_LOCATION = {"latitude": 1.329, "longitude": 103.776}

export default function RecommendationTabs() {
  const router = useRouter();
  
  const rs = useRecommendationStore(s => s.recommendations);
  const level0 = useRecommendationStore(s => s.level0);
  const level1 = useRecommendationStore(s => s.level1);
  const level2 = useRecommendationStore(s => s.level2);
  const explanations0 = useRecommendationStore(s => s.explanations0);
  const explanations1 = useRecommendationStore(s => s.explanations1);
  const explanations2 = useRecommendationStore(s => s.explanations2);
  const selectedLevel = useRecommendationStore(s => s.selectedLevel);
  const setSelectedLevel = useRecommendationStore(s => s.setSelectedLevel);
  const loading = useRecommendationStore(s => s.loading);
  const setLoading = useRecommendationStore(s => s.setLoading);
  const setRecommendations = useRecommendationStore(s => s.setRecommendations);
  const setUserLocation = useRecommendationStore(s => s.setUserLocation);
  const userLocation = useRecommendationStore(s => s.userLocation);
  const setSelectedPOI = useRecommendationStore(s => s.setSelectedPOI);
  
  const [prompt, setPrompt] = useState<string>("");
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [expandedPOI, setExpandedPOI] = useState<string | null>(null);
  // Track which POIs we've recorded interactions for to avoid duplicates
  const [recordedInteractions, setRecordedInteractions] = useState<Set<string>>(new Set());
  
  const { user } = useUserAuthStore()
  const userId = user?.id
  const isHydrated = useUserAuthStore((s) => s.isHydrated);

  // Workflow 1: Cold Start - Register user with recommendation system
  useEffect(() => {
    async function registerUserForRecommendations() {
      if (!userId) return;
      
      try {
        // Get user interests from metadata or preferences
        const interests = user?.user_metadata?.interests || "general";
        
        await addUser({
          user_id: userId,
          interests: Array.isArray(interests) ? interests.join(";") : interests
        });
        
        console.log('User registered with recommendation system:', userId);
      } catch (error) {
        console.error('Failed to register user for recommendations:', error);
        // Non-fatal error, don't alert user
      }
    }

    if (userId) {
      registerUserForRecommendations();
    }
  }, [userId, user?.user_metadata?.interests]);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      setUserLocation({
        latitude: SIM_LOCATION.latitude,
        longitude: SIM_LOCATION.longitude
      })
    }

    getCurrentLocation();
    checkAPIHealth();
  }, []);

  if (!isHydrated) {
    return (
      <SafeAreaContainer>
        <LoadingContainer>
          <ActivityIndicator size="large" color="#0E6DE8" />
        </LoadingContainer>
      </SafeAreaContainer>
    );
  }

  const userRole = (user?.user_metadata?.role as string)?.toLowerCase() ?? 'unregistered';
  
  const suggestedPrompts = [
    "Things to do Near Me",
    "Cafes Near Me",
    "Gyms Near Me",
  ];

  const handleSuggestion = (item: string) => {
    setPrompt(item);
    setShowKeyboard(false);
    Keyboard.dismiss();
  };

  const handleRecommendations = async () => {
    if (!hasPermission(userRole, 'canGeneratePrompts')) {
      Alert.alert('Login Required', 'Please log in to generate recommendations');
      router.navigate('/(user-auth)/login')
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Empty Search', 'Please enter a search query');
      return;
    }

    setLoading(true);

    try {
      // Workflow 2: Get recommendations with explanations
      const response: RecommendationResponse = await getRecommendations({
        userId: userId!, // We know userId exists because of permission check
        prompt: prompt.trim(),
        currentLocation: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        } : undefined,
        includeExplanations: true  // Request explanations with recommendations
      });

      setRecommendations(response);
      setSelectedLevel(0); 

      // Log explanation data for debugging (Workflow 3)
      if (response.recommendations.level_0.length > 0) {
        const firstPoi = response.recommendations.level_0[0];
        if (firstPoi?.explanation) {
          console.log('First POI explanation:', firstPoi.explanation.human_explanation);
          console.log('Confidence:', firstPoi.explanation.confidence_indicator); // "strong", "good", or "potential"
        }
      }

      Alert.alert(
        'Success!', 
        `Found ${response.recommendations.level_0.length} places, ${response.recommendations.level_1.length} areas, and ${response.recommendations.level_2.length} districts!`
      );

      setPrompt('')

      const payload = {
        user_id: userId,
        search_query: prompt.trim(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("search_history")
        .insert(payload);

      if (error) console.error('Failed to save search history:', error)

    } catch (err) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Workflow 4: Record interaction when user engages with POI
  const handleRecordInteraction = async (poi: POIInfo, interactionType: 'view' | 'visit' | 'click' | 'expand' = 'view', value: number = 1.0) => {
    if (!userId || recordedInteractions.has(poi.poi_id)) return;
    
    try {
      await recordInteraction({
        user_id: userId,
        poi_id: poi.poi_id,
        interaction_type: interactionType,
        value: value
      });
      
      // Mark as recorded to avoid duplicate calls
      setRecordedInteractions(prev => new Set(prev).add(poi.poi_id));
      console.log(`Recorded ${interactionType} interaction for ${poi.name}`);
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  // Workflow 5: Get explanation on-demand if not included in initial request
  const fetchExplanationOnDemand = async (poi: POIInfo, level: number): Promise<Explanation | null> => {
    if (!userId) return null;
    
    try {
      const explanation = await getExplanation({
        user_id: userId,
        poi_id: poi.poi_id,
        level: level
      });
      
      return explanation;
    } catch (error) {
      console.error('Failed to fetch explanation on-demand:', error);
      return null;
    }
  };

  const handleOutsidePress = () => {
    if (loading || (rs && rs.recommendations.level_0?.length > 0)) {
      return;
    }
    if (showKeyboard) {
      setShowKeyboard(false);
      Keyboard.dismiss();
    }
  };

  const getCurrentLevelData = (): POIInfo[] => {
    switch(selectedLevel) {
      case 0: return level0;
      case 1: return level1;
      case 2: return level2;
      default: return [];
    }
  };

  const getCurrentExplanations = (): Explanation[] => {
    switch(selectedLevel) {
      case 0: return explanations0;
      case 1: return explanations1;
      case 2: return explanations2;
      default: return [];
    }
  };

  // Updated to support both nested explanations (Workflow 3) and separate arrays
  const getExplanationForPOI = (poi: POIInfo): Explanation | undefined => {
    // First check if explanation is nested in POI (from Workflow 2 with includeExplanations)
    if (poi.explanation) {
      return poi.explanation;
    }
    // Fall back to separate explanation arrays
    return getCurrentExplanations().find(exp => exp.poi_id === poi.poi_id);
  };

  const toggleExpanded = async (poi: POIInfo) => {
    const poiId = poi.poi_id;
    const isExpanded = expandedPOI === poiId;
    
    if (!isExpanded) {
      // Workflow 4: Record expand interaction
      await handleRecordInteraction(poi, 'expand', 0.5);
      
      // Workflow 5: If no explanation available, try to fetch on-demand
      if (!getExplanationForPOI(poi)) {
        const explanation = await fetchExplanationOnDemand(poi, selectedLevel);
        if (explanation) {
          // Store it temporarily or update state as needed
          console.log('Fetched explanation on-demand:', explanation);
        }
      }
    }
    
    setExpandedPOI(isExpanded ? null : poiId);
  };

  const renderLevelTabs = () => (
    <LevelSelector>
      <LevelTab 
        active={selectedLevel === 0} 
        onPress={() => setSelectedLevel(0)}
      >
        <LevelTabText active={selectedLevel === 0}>Places</LevelTabText>
        <LevelCount active={selectedLevel === 0}>{level0.length}</LevelCount>
      </LevelTab>
      <LevelTab 
        active={selectedLevel === 1} 
        onPress={() => setSelectedLevel(1)}
      >
        <LevelTabText active={selectedLevel === 1}>Areas</LevelTabText>
        <LevelCount active={selectedLevel === 1}>{level1.length}</LevelCount>
      </LevelTab>
      <LevelTab 
        active={selectedLevel === 2} 
        onPress={() => setSelectedLevel(2)}
      >
        <LevelTabText active={selectedLevel === 2}>Districts</LevelTabText>
        <LevelCount active={selectedLevel === 2}>{level2.length}</LevelCount>
      </LevelTab>
    </LevelSelector>
  );

  const renderDistrictCard = (item: POIInfo) => {
    const explanation = getExplanationForPOI(item);
    
    return (
      <DistrictCard key={item.poi_id}>
        <DistrictHeader>
          <View style={{ flex: 1 }}>
            <DistrictName>🏙️ {item.name}</DistrictName>
            {item.details?.description && (
              <DistrictDescription>{item.details.description}</DistrictDescription>
            )}
            {/* Workflow 3: Show confidence indicator if available */}
            {explanation?.confidence_indicator && (
              <ConfidenceBadge indicator={explanation.confidence_indicator}>
                <ConfidenceText>{explanation.confidence_indicator.toUpperCase()} MATCH</ConfidenceText>
              </ConfidenceBadge>
            )}
          </View>
          <DistrictBadge>
            <MaterialIcons name="star" size={14} color="white" />
            <DistrictScore>{item.score.toFixed(2)}</DistrictScore>
          </DistrictBadge>
        </DistrictHeader>
        
        <DistrictMeta>
          <MetaItem>
            <MaterialIcons name="location-city" size={16} color="rgba(255,255,255,0.8)" />
            <MetaText>Regional District</MetaText>
          </MetaItem>
          <MetaItem>
            <MaterialIcons name="analytics" size={16} color="rgba(255,255,255,0.8)" />
            <MetaText>Score: {(item.score * 100).toFixed(0)}% match</MetaText>
          </MetaItem>
        </DistrictMeta>

        <ExploreButton onPress={async () => {
          // Workflow 4: Record visit interaction
          await handleRecordInteraction(item, 'visit', 1.0);
          setSelectedPOI(item);
          router.navigate('/map');
        }}>
          <ExploreButtonText>Explore District</ExploreButtonText>
          <MaterialIcons name="arrow-forward" size={18} color="#0E6DE8" />
        </ExploreButton>
      </DistrictCard>
    );
  };

  const renderStreetCard = (item: POIInfo) => {
    const explanation = getExplanationForPOI(item);
    const isExpanded = expandedPOI === item.poi_id;

    return (
      <StreetCard key={item.poi_id}>
        <StreetHeader>
          <View style={{ flex: 1 }}>
            <StreetName>🛣️ {item.name}</StreetName>
            <StreetSubtitle>
              {item.type} • {item.details?.district || 'Unknown District'}
            </StreetSubtitle>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <StreetScore>{item.score.toFixed(2)}</StreetScore>
            <Text style={{ fontSize: 11, color: '#FFB800' }}>Match Score</Text>
          </View>
        </StreetHeader>

        {explanation && (
          <>
            <ExplanationToggle onPress={() => toggleExpanded(item)}>
              <ExplanationToggleText>
                {isExpanded ? '▼' : '▶'} Why this area?
              </ExplanationToggleText>
              {/* Workflow 3: Show confidence indicator */}
              {explanation.confidence_indicator && (
                <ConfidenceChip indicator={explanation.confidence_indicator}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>
                    {explanation.confidence_indicator}
                  </Text>
                </ConfidenceChip>
              )}
            </ExplanationToggle>

            {isExpanded && (
              <ExplanationContainer>
                <ExplanationText>{explanation.human_explanation}</ExplanationText>
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

        <StreetActions>
          <ActionButton onPress={async () => {
            await handleRecordInteraction(item, 'view', 0.8);
            setSelectedPOI(item);
            router.navigate('/map');
          }}>
            <MaterialIcons name="map" size={18} color="#0E6DE8" />
            <ActionButtonText>View Area</ActionButtonText>
          </ActionButton>
        </StreetActions>
      </StreetCard>
    );
  };

  const renderPOICard = (item: POIInfo) => {
    const explanation = getExplanationForPOI(item);
    const isExpanded = expandedPOI === item.poi_id;

    return (
      <POICard key={item.poi_id}>
        <POIMainInfo>
          <POIName>{item.name}</POIName>
          
          <POIDetailsRow>
            <POICategory>{item.details?.category || 'Place'}</POICategory>
            {item.details?.price && (
              <POIPrice>💰 {item.details.price}</POIPrice>
            )}
          </POIDetailsRow>

          <POIDetailsRow>
            <POIRegion>📍 {item.details?.region || 'Nearby'}</POIRegion>
            <View style={{ flexDirection: "row", alignItems: 'center' }}>
              <MaterialIcons name="star" size={16} color="#FFB800" />
              <POIScore>{item.score.toFixed(2)}</POIScore>
            </View>
          </POIDetailsRow>
        </POIMainInfo>

        {explanation && (
          <>
            <ExplanationToggle onPress={() => toggleExpanded(item)}>
              <ExplanationToggleText>
                {isExpanded ? '▼' : '▶'} Why recommended?
              </ExplanationToggleText>
              {explanation.confidence_indicator && (
                <ConfidenceChip indicator={explanation.confidence_indicator}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>
                    {explanation.confidence_indicator}
                  </Text>
                </ConfidenceChip>
              )}
            </ExplanationToggle>

            {isExpanded && (
              <ExplanationContainer>
                <ExplanationText>{explanation.human_explanation}</ExplanationText>
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

        <ActionsContainer>
          <ActionButton onPress={async () => {
            // Workflow 4: Record visit interaction
            await handleRecordInteraction(item, 'visit', 1.0);
            setSelectedPOI(item);
            router.navigate('/map');
          }}>
            <MaterialIcons name="location-pin" size={20} color="#0E6DE8" />
            <ActionButtonText>Map</ActionButtonText>
          </ActionButton>

          <ActionButton onPress={async () => {
            // Workflow 4: Record click interaction
            await handleRecordInteraction(item, 'click', 0.5);
            Alert.alert(
              item.name,
              explanation?.human_explanation || 'No explanation available',
              [{ text: 'OK' }]
            );
          }}>
            <MaterialIcons name="info-outline" size={20} color="#666" />
            <ActionButtonText>Details</ActionButtonText>
          </ActionButton>
        </ActionsContainer>

        <RecommendationCard poiId={item.poi_id} />
      </POICard>
    );
  };

  const renderCard = (item: POIInfo) => {
    switch(selectedLevel) {
      case 0: return renderPOICard(item);
      case 1: return renderStreetCard(item);
      case 2: return renderDistrictCard(item);
      default: return null;
    }
  };

  const getLevelLabel = () => {
    switch(selectedLevel) {
      case 0: return 'individual places';
      case 1: return 'areas & streets';
      case 2: return 'districts';
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaContainer>
        {loading ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color="#0E6DE8" />
            <Text style={{ marginTop: 12, color: '#666' }}>Getting recommendations...</Text>
          </LoadingContainer>
        ) : rs && rs.recommendations && getCurrentLevelData().length > 0 ? (
          <ResultsScrollView>
            <ResultsHeader>
              <ResultsTitle>Recommendations</ResultsTitle>
              {renderLevelTabs()}
              <ResultsSummary>
                Showing {getCurrentLevelData().length} {getLevelLabel()} near you
              </ResultsSummary>
            </ResultsHeader>

            {getCurrentLevelData().map((item) => renderCard(item))}
            
            <View style={{ height: 100 }} />
          </ResultsScrollView>
        ) : (
          <EmptyStateContainer>
            <MaterialIcons name="account-tree" size={48} color="#CCC" />
            <EmptyStateText>
              Search for places to get personalized recommendations across districts, areas, and specific venues.
            </EmptyStateText>
          </EmptyStateContainer>
        )}

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

        <PromptTextInputWrapper $keyboard={showKeyboard} onStartShouldSetResponder={() => true}>
          <PromptText 
            onChangeText={setPrompt}
            value={prompt}
            placeholder="Search for activities or areas..."
            placeholderTextColor={"#878787"}
            multiline={true}
            onFocus={() => setShowKeyboard(true)}
          />
          {prompt && (
            <IconContainer 
              onPress={handleRecommendations}
              hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }} 
            >
              <ArrowUp size={24} color={'white'} />
            </IconContainer>
          )}
        </PromptTextInputWrapper>
      </SafeAreaContainer>
    </TouchableWithoutFeedback>
  );
}

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ResultsScrollView = styled(ScrollView)`
  flex: 1;
  padding-horizontal: 4px;
  margin-top: 20px;
`;

const ResultsHeader = styled(View)`
  margin-bottom: 16px;
`;

const ResultsTitle = styled(Text)`
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
`;

const LevelSelector = styled(View)`
  flex-direction: row;
  background-color: #F5F5F5;
  border-radius: 12px;
  margin-bottom: 16px;
  padding: 4px;
`;

const LevelTab = styled(Pressable)<{ active: boolean }>`
  flex: 1;
  padding-vertical: 8px;
  padding-horizontal: 4px;
  border-radius: 8px;
  background-color: ${props => props.active ? 'white' : 'transparent'};
  align-items: center;
  flex-direction: row;
  justify-content: center;
  gap: 4px;
  shadow-color: ${props => props.active ? '#000' : 'transparent'};
  shadow-offset: ${props => props.active ? '0px 2px' : '0px 0px'};
  shadow-opacity: ${props => props.active ? 0.1 : 0};
  elevation: ${props => props.active ? 2 : 0};
`;

const LevelTabText = styled(Text)<{ active: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? '#0E6DE8' : '#666'};
`;

const LevelCount = styled(Text)<{ active: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.active ? '#0E6DE8' : '#999'};
  background-color: ${props => props.active ? '#E3F2FD' : '#E0E0E0'};
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 10px;
  margin-left: 4px;
`;

const ResultsSummary = styled(Text)`
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 8px;
`;

// Confidence indicator badges (Workflow 3)
const ConfidenceBadge = styled(View)<{ indicator: string }>`
  background-color: ${props => 
    props.indicator === 'strong' ? '#4CAF50' : 
    props.indicator === 'good' ? '#FFB800' : '#FF9800'};
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: 6px;
`;

const ConfidenceChip = styled(View)<{ indicator: string }>`
  background-color: ${props => 
    props.indicator === 'strong' ? '#4CAF50' : 
    props.indicator === 'good' ? '#FFB800' : '#FF9800'};
  padding-horizontal: 6px;
  padding-vertical: 2px;
  border-radius: 10px;
  margin-left: auto;
`;

const ConfidenceText = styled(Text)`
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

// Level 2: District Styles
const DistrictCard = styled(View)`
  background-color: #0E6DE8;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 12px;
  shadow-color: #0E6DE8;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 5;
`;

const DistrictHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const DistrictName = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: white;
  flex: 1;
  margin-right: 12px;
`;

const DistrictDescription = styled(Text)`
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  margin-top: 4px;
  line-height: 20px;
`;

const DistrictBadge = styled(View)`
  background-color: rgba(255,255,255,0.2);
  padding-horizontal: 10px;
  padding-vertical: 6px;
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const DistrictScore = styled(Text)`
  color: white;
  font-weight: 700;
  font-size: 14px;
`;

const DistrictMeta = styled(View)`
  flex-direction: row;
  gap: 16px;
  margin-bottom: 16px;
  margin-top: 4px;
`;

const MetaItem = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const MetaText = styled(Text)`
  color: rgba(255,255,255,0.8);
  font-size: 13px;
`;

const ExploreButton = styled(Pressable)`
  background-color: white;
  padding: 12px;
  border-radius: 10px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const ExploreButtonText = styled(Text)`
  color: #0E6DE8;
  font-weight: 700;
  font-size: 15px;
`;

// Level 1: Street Styles
const StreetCard = styled(View)`
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 10px;
  border-left-width: 4px;
  border-left-color: #FFB800;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const StreetHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const StreetName = styled(Text)`
  font-size: 17px;
  font-weight: 700;
  color: #333;
`;

const StreetSubtitle = styled(Text)`
  font-size: 13px;
  color: #666;
  margin-top: 2px;
`;

const StreetScore = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: #FFB800;
`;

const StreetActions = styled(View)`
  margin-top: 12px;
`;

// Level 0: POI Styles
const POICard = styled(View)`
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e0e0e0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`;

const POIMainInfo = styled(View)`
  margin-bottom: 12px;
`;

const POIName = styled(Text)`
  font-size: 18px;
  font-weight: 700;
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
  font-weight: 600;
  background-color: #E3F2FD;
  padding-horizontal: 8px;
  padding-vertical: 2px;
  border-radius: 4px;
`;

const POIPrice = styled(Text)`
  font-size: 14px;
  color: #2E7D32;
  font-weight: 600;
`;

const POIRegion = styled(Text)`
  font-size: 13px;
  color: #666;
`;

const POIScore = styled(Text)`
  font-size: 14px;
  color: #333;
  font-weight: 700;
  margin-left: 4px;
`;

// Shared Components
const ExplanationToggle = styled(Pressable)`
  padding: 10px;
  background-color: #F5F5F5;
  border-radius: 8px;
  margin-bottom: 8px;
  flex-direction: row;
  align-items: center;
`;

const ExplanationToggleText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #0E6DE8;
  flex: 1;
`;

const ExplanationContainer = styled(View)`
  background-color: #F9F9F9;
  padding: 14px;
  border-radius: 8px;
  border-left-width: 3px;
  border-left-color: #0E6DE8;
  margin-bottom: 12px;
`;

const ExplanationText = styled(Text)`
  font-size: 14px;
  line-height: 20px;
  color: #444;
  margin-bottom: 10px;
`;

const FactorsContainer = styled(View)`
  margin-top: 4px;
`;

const FactorsTitle = styled(Text)`
  font-size: 13px;
  font-weight: 700;
  color: #333;
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
  line-height: 18px;
`;

const ActionsContainer = styled(View)`
  flex-direction: row;
  gap: 8px;
`;

const ActionButton = styled(Pressable)`
  flex: 1;
  flex-direction: row;
  justify-content: center;
  background-color: #F5F5F5;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  border-width: 1px;
  border-color: #E0E0E0;
  gap: 6px;
`;

const ActionButtonText = styled(Text)`
  font-size: 14px;
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
  margin-top: 16px;
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
  width: 95%;
  background-color: #F5F5F5;
  margin-horizontal: 10px;
`;

const PromptText = styled(TextInput)`
  font-size: 18px;
  text-align: left;
  line-height: 24px;
  padding: 0;
  padding-right: 50px;
  min-height: 30px;
`;

const IconContainer = styled(TouchableOpacity)`
  background-color: #0E6DE8;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 24px;
  position: absolute;
  z-index: 10;
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