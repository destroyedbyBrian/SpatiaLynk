import { SafeAreaContainer } from "@/constant/GlobalStyles";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { ArrowUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { styled } from "styled-components";
import {
  getRecommendations,
  RecommendationResponse
} from '../services/MPRApi';
import { useRecommendationStore } from '../store/recommendationStore';


const userId = "6b60d5cf-63cc-4dc4-9bbe-74da03df19db"

export default function Index() {
  const router = useRouter()
  const rs = useRecommendationStore(s => s.recommendations)
  const loading = useRecommendationStore(s => s.loading)
  const setLoading = useRecommendationStore(s => s.setLoading)
  const setRecommendations = useRecommendationStore(s => s.setRecommendations)
  const [prompt, setPrompt] = useState<string>("");
  const {userLocation, setUserLocation} = useRecommendationStore()
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false)
  const suggestedPrompts = [
    "Cafes Near Me",
    "Hiking Trails Nearby",
    "Parks in Punggol",
    "Malls in Orchard",
  ]

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
    }, []);
  

  const handleSuggestion = (item: string) => {
    setPrompt(item)
    setShowKeyboard(false)
    Keyboard.dismiss()
  }

  const handleRecommendations = async () => {
    if (!prompt.trim()) {
      Alert.alert('Empty Search', 'Please enter a search query');
      return;
    }
    setLoading(true)
    try {
      const response: RecommendationResponse = await getRecommendations({
        userId,
        prompt: prompt.trim(),
        currentLocation: userLocation ? {
          latitude: userLocation.latitude,
           longitude: userLocation.longitude,
        } : undefined,
      })

      setRecommendations(response);
      console.log('Recommendations saved to state');

      router.navigate('/map')
      
      // Show success message
      Alert.alert(
        'Success!', 
        `Found ${response.recommendations.level_0.length} individual places for you!`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to get recommendations. Please try again.');
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOutsidePress = () => {
    if (showKeyboard) {
      setShowKeyboard(false);
      Keyboard.dismiss();
    }
  }

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaContainer>
        <Pressable onPress={handleRecommendations}>
          <Text>Test</Text>
        </Pressable>
        {loading ? (
          <ActivityIndicator />
          ) : rs && rs.recommendations.level_0 && rs.recommendations.level_0.length > 0 ? (
            <ScrollView>
              {rs.recommendations.level_0.map((poi) => (
                <View
                  key={poi.poi_id}
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#e0e0e0'
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>{poi.name}</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>{poi.details.category}</Text>
                  <Text style={{ fontSize: 12, color: '#999' }}>Score: {poi.score.toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
              No recommendations available.
            </Text>
          )}
        {!prompt &&
          <SuggestedScrollView 
            horizontal={true} 
            $keyboard={showKeyboard}
            showsHorizontalScrollIndicator={false}
          >
            {suggestedPrompts.map((item, index) => {
              return (
                <SuggestedPromptsContainer key={index} onPress={() => handleSuggestion(item)}>
                  <SuggestedPromptsText key={index}>{item}</SuggestedPromptsText>
                </SuggestedPromptsContainer>
              )
            })}
          </SuggestedScrollView>
        }
        <PromptTextInputWrapper $keyboard={showKeyboard} onStartShouldSetResponder={() => true}>
          <PromptText 
            onChangeText={setPrompt}
            value={prompt}
            placeholder="Search for activites or areas"
            placeholderTextColor={"#878787"}
            multiline={true}
            onFocus={() => setShowKeyboard(true)}
          />
            {prompt && 
              <IconContainer onPress={handleRecommendations}>
                <ArrowUp size={24} color={'white'} />
              </IconContainer>
            }
        </PromptTextInputWrapper>
      </SafeAreaContainer>
    </TouchableWithoutFeedback>
  )
}

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
`
const PromptText = styled(TextInput)`
  font-size: 18px;
  text-align: left;
  line-height: 24px;
  padding: 0;
`
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
`
const SuggestedScrollView = styled(ScrollView)<{ $keyboard?: boolean}>`
  width: 100%;
  position: absolute;
  margin-horizontal: 10px;
  bottom: ${props => props.$keyboard ? '340px' : '110px'};
`
const SuggestedPromptsContainer = styled(Pressable)`
  background-color: #F5F5F5;
  border-radius: 16px;
  margin-right: 10px;
`
const SuggestedPromptsText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  padding: 14px;
`
