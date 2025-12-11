import { SafeAreaContainer } from "@/constant/GlobalStyles";
import { ArrowUp } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { styled } from "styled-components";


export default function Index() {
  const [prompt, setPrompt] = useState<string>("");
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false)
  const suggestedPrompts = [
    "Cafes Near Me",
    "Hiking Trails Nearby",
    "Parks in Punggol",
    "Malls in Orchard",
  ]
  const handleSuggestion = (item: string) => {
    setPrompt(item)
  }
  return (
    <TouchableWithoutFeedback onPress={() => {
        setShowKeyboard(false)
        Keyboard.dismiss()
      }}>
      <SafeAreaContainer>
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
        <PromptTextInput $keyboard={showKeyboard}>
          <PromptText 
              onChangeText={setPrompt}
              value={prompt}
              placeholder="Search for activites or areas"
              placeholderTextColor={"#878787"}
              multiline={true}
              onFocus={() => setShowKeyboard(true)}
            />
            {prompt && 
              <IconContainer>
                <ArrowUp size={24} color={'white'} />
              </IconContainer>
            }
        </PromptTextInput>
      </SafeAreaContainer>
    </TouchableWithoutFeedback>
  )
}
const PromptTextInput = styled(View)<{ $keyboard?: boolean}>`
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
  bottom: ${props => props.$keyboard ? '230px' : '40px'};
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
  bottom: ${props => props.$keyboard ? '300px' : '110px'};
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
