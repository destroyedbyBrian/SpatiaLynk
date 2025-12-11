import * as Location from 'expo-location';
import { AppleMaps } from 'expo-maps';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';


const locationList = [
  {
    name: "Marina Bay Area",
    stores: [
      {
        name: "Marina Bay Sands",
        point: [1.2834, 103.8607],
        category: "Shopping"
      },
      {
        name: "Gardens by the Bay",
        point: [1.2816, 103.8636],
        category: "Attraction"
      },
      {
        name: "Merlion Park",
        point: [1.2868, 103.8545],
        category: "Landmark"
      }
    ]
  },
  {
    name: "Orchard Road",
    stores: [
      {
        name: "ION Orchard",
        point: [1.3041, 103.8318],
        category: "Shopping"
      },
      {
        name: "Takashimaya",
        point: [1.3030, 103.8352],
        category: "Shopping"
      },
      {
        name: "Paragon",
        point: [1.3037, 103.8354],
        category: "Shopping"
      }
    ]
  },
  {
    name: "Chinatown",
    stores: [
      {
        name: "Buddha Tooth Relic Temple",
        point: [1.2813, 103.8444],
        category: "Cultural"
      },
      {
        name: "Chinatown Street Market",
        point: [1.2838, 103.8443],
        category: "Shopping"
      },
      {
        name: "Maxwell Food Centre",
        point: [1.2806, 103.8449],
        category: "Food"
      }
    ]
  },
];

const markersApple = [
  {
    coordinates: {
      latitude: 1.2834,
      longitude: 103.8607,
    },
    title: "Marina Bay Sands",
    subtitle: "Shopping",
    tintColor: "red",
    systemImage: "cart.fill"
  }
]

const Map = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationIndex, setLocationIndex] = useState(0);
  const ref = useRef<AppleMaps.MapView>(null)

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    }

    getCurrentLocation();
  }, []);

  const cameraPosition = {
    coordinates: {
      latitude: locationList[locationIndex].stores[0].point[0],
      longitude: locationList[locationIndex].stores[0].point[1],
    },
    zoom: 14
  }

  const handleChangeWithRef = (direction: "next" | "prev") => {
    const newIndex = locationIndex + (direction === "next" ? 1 : -1);
    const nextLocation = locationList[newIndex]

    ref.current?.setCameraPosition({
      coordinates: {
        latitude: nextLocation.stores[0].point[0],
        longitude: nextLocation.stores[0].point[1],
      },
      zoom: 14
    })

    setLocationIndex(newIndex);
  }

  const renderMapControls = () => {
    return (
      <View>
        <Pressable onPress={() => handleChangeWithRef("prev")}>
          <Text>Prev</Text>
        </Pressable>
         <Pressable onPress={() => handleChangeWithRef("next")}>
          <Text>Next</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <>
      <AppleMaps.View style={{ flex: 1 }}
        ref={ref}
        cameraPosition={cameraPosition}
        markers={markersApple}
      />
      {/* <SafeAreaView>
        {renderMapControls()}
      </SafeAreaView> */}
    </>
  )
}

export default Map

// LocationGeocodedAddress (reverse geocoding) : lat/long -> human readable address
// LocationGeocodedLocation (forward geocoding) : address -> lat/long


// onCameraMove
// onMarkerPress
// onPOIPress