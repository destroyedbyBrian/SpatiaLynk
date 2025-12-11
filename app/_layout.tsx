import { Tabs } from "expo-router";
import { CircleUserRound, Map, MapPinHouse, MapPinned } from 'lucide-react-native';


export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Home',
          tabBarIcon: () => <Map size={24} />
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          headerShown: false,
          title: 'Map',
          tabBarIcon: () => <MapPinned size={24} />
        }} 
      />
      <Tabs.Screen 
        name="favourites" 
        options={{ 
          headerShown: false,
          title: 'Saved POIs',
          tabBarIcon: () => <MapPinHouse size={24} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          headerShown: false,
          title: 'Profile',
          tabBarIcon: () => <CircleUserRound size={24} />
        }} 
      />
    </Tabs>
  )
    
}
