// // LocationGeocodedAddress (reverse geocoding) : lat/long -> human readable address
// // LocationGeocodedLocation (forward geocoding) : address -> lat/long

// // onCameraMove
// // onMarkerPress
// // onPOIPress

import { AppleMaps } from 'expo-maps';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRecommendationStore } from '../store/recommendationStore';

type MapLevel = 0 | 1 | 2 | 3;

const Map = () => {
  const { 
    level0, 
    level1, 
    level2, 
    level3, 
    userLocation, 
    selectedPOI, 
    setSelectedPOI,
    selectedLevel,
    setSelectedLevel,
  } = useRecommendationStore();
  
  const [currentLevel, setCurrentLevel] = useState<MapLevel>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const mapRef = useRef<AppleMaps.MapView>(null);

  // Get POIs for current level
  const getCurrentLevelData = () => {
    switch (currentLevel) {
      case 0: return level0;
      case 1: return level1;
      case 2: return level2;
      case 3: return level3;
      default: return [];
    }
  };

  const currentLevelData = getCurrentLevelData();

  // Default camera position
  const getInitialCameraPosition = () => {
    if (userLocation) {
      return {
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        zoom: 14,
      };
    }
    return {
      coordinates: { latitude: 1.3521, longitude: 103.8198 },
      zoom: 12,
    };
  };

  const [cameraPosition, setCameraPosition] = useState(getInitialCameraPosition());

  // Update camera when level changes or recommendations load
  useEffect(() => {
    const data = getCurrentLevelData();
    if (data.length > 0) {
      setCurrentIndex(0);
      zoomToCurrentLevelPOI(0);
    }
  }, []);

  // Zoom level based on map level
  const getZoomForLevel = (level: MapLevel): number => {
    switch (level) {
      case 0: return 16; // Individual POIs - zoomed in
      case 1: return 15; // Containers - slightly zoomed out
      case 2: return 13; // Districts - more zoomed out
      case 3: return 11; // Regions - very zoomed out
      default: return 14;
    }
  };

  // Get all markers for current level
  const getMarkersForCurrentLevel = (): AppleMaps.Marker[] => {
    const data = getCurrentLevelData();
    
    return data
      .filter(poi => {
        // For Level 0, check direct coordinates
        if (currentLevel === 0) {
          return poi.details.latitude && poi.details.longitude;
        }
        // For higher levels, check if spatial data exists
        return poi.details.latitude && poi.details.longitude;
      })
      .map((poi) => ({
        id: poi.poi_id,
        coordinates: {
          latitude: poi.details.latitude!,
          longitude: poi.details.longitude!,
        },
        title: poi.name,
        subtitle: getSubtitleForLevel(poi, currentLevel),
        tintColor: getColorForLevel(currentLevel, poi.details.category),
        systemImage: getIconForLevel(currentLevel, poi.details.category),
      }));
  };

  // Get subtitle based on level
  const getSubtitleForLevel = (poi: any, level: MapLevel): string => {
    switch (level) {
      case 0:
        return poi.details.category || 'Place';
      case 1:
        return `${poi.details.num_pois || 0} places`;
      case 2:
        return `${poi.details.num_venues || 0} venues`;
      case 3:
        return `${poi.details.num_districts || 0} districts`;
      default:
        return '';
    }
  };

  // Get color based on level
  const getColorForLevel = (level: MapLevel, category?: string): string => {
    // Level 0: Color by category
    if (level === 0) {
      return getCategoryColor(category);
    }
    
    // Higher levels: Different colors per level
    const levelColors = {
      1: '#9370DB', // Purple for containers
      2: '#FF8C00', // Orange for districts
      3: '#32CD32', // Green for regions
    };
    
    return levelColors[level] || '#0E6DE8';
  };

  // Get icon based on level
  const getIconForLevel = (level: MapLevel, category?: string): string => {
    if (level === 0) {
      return getCategoryIcon(category);
    }
    
    const levelIcons = {
      1: 'building.2.fill',        // Containers
      2: 'map.fill',                // Districts
      3: 'globe.americas.fill',     // Regions
    };
    
    return levelIcons[level] || 'mappin.circle.fill';
  };

  // Category color (for Level 0)
  const getCategoryColor = (category?: string): string => {
    if (!category) return '#0E6DE8';
    const categoryLower = category.toLowerCase();
    
    const colorMap: { [key: string]: string } = {
      'cafe': '#8B4513',
      'restaurant': '#FF6347',
      'shopping_mall': '#9370DB',
      'park': '#32CD32',
      'cinema': '#FF1493',
      'gym': '#FF8C00',
    };

    for (const [key, color] of Object.entries(colorMap)) {
      if (categoryLower.includes(key)) return color;
    }
    return '#0E6DE8';
  };

  // Category icon (for Level 0)
  const getCategoryIcon = (category?: string): string => {
    if (!category) return 'mappin';
    const categoryLower = category.toLowerCase();
    
    const iconMap: { [key: string]: string } = {
      'cafe': 'cup.and.saucer.fill',
      'restaurant': 'fork.knife',
      'shopping_mall': 'cart.fill',
      'park': 'leaf.fill',
      'cinema': 'film.fill',
      'gym': 'figure.run',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key)) return icon;
    }
    return 'mappin.circle.fill';
  };

  // Move camera to coordinates
  const moveCameraToCoordinates = (latitude: number, longitude: number, zoom: number) => {
    mapRef.current?.setCameraPosition({
      coordinates: { latitude, longitude },
      zoom,
    });

    setCameraPosition({
      coordinates: { latitude, longitude },
      zoom,
    });
  };

  // Zoom to specific POI at current level
  const zoomToCurrentLevelPOI = (index: number) => {
    const data = getCurrentLevelData();
    if (index < 0 || index >= data.length) return;

    const poi = data[index];
    if (poi.details.latitude && poi.details.longitude) {
      moveCameraToCoordinates(
        poi.details.latitude,
        poi.details.longitude,
        getZoomForLevel(currentLevel)
      );
      setCurrentIndex(index);
      setSelectedPOI(poi);
    }
  };

  // Navigate between POIs
  const handleNavigatePOI = (direction: 'next' | 'prev') => {
    const data = getCurrentLevelData();
    if (data.length === 0) return;

    const newIndex = direction === 'next'
      ? (currentIndex + 1) % data.length
      : (currentIndex - 1 + data.length) % data.length;

    zoomToCurrentLevelPOI(newIndex);
  };

  // Get level name
  const getLevelName = (level: MapLevel): string => {
    const names = {
      0: 'Individual Places',
      1: 'Venues & Malls',
      2: 'Districts',
      3: 'Regions',
    };
    return names[level];
  };

  // Fit all markers
  const fitAllMarkers = () => {
    const data = getCurrentLevelData();
    if (data.length === 0) return;

    const validPOIs = data.filter(poi => poi.details.latitude && poi.details.longitude);
    if (validPOIs.length === 0) return;

    const latitudes = validPOIs.map(poi => poi.details.latitude!);
    const longitudes = validPOIs.map(poi => poi.details.longitude!);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = maxLat - minLat;
    const lngDelta = maxLng - minLng;
    const maxDelta = Math.max(latDelta, lngDelta);

    const zoom = Math.floor(14 - Math.log2(maxDelta / 0.01));

    moveCameraToCoordinates(centerLat, centerLng, Math.max(10, Math.min(16, zoom)));
  };

  const markers = getMarkersForCurrentLevel();

  return (
    <View style={styles.container}>
      <AppleMaps.View
        ref={mapRef}
        style={styles.map}
        cameraPosition={cameraPosition}
        markers={markers}
      />

      {/* Level Selector (Top) */}
      <View style={styles.levelSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelSelector}
        >
          {[0, 1, 2, 3].map((level) => {
            const data = level === 0 ? level0 : level === 1 ? level1 : level === 2 ? level2 : level3;
            const isSelected = currentLevel === level;
            const count = data.length;

            return (
              <Pressable
                key={level}
                style={[styles.levelButton, isSelected && styles.levelButtonSelected]}
                onPress={() => {
                  setCurrentLevel(level as MapLevel);
                  setSelectedLevel(level as MapLevel);
                }}
              >
                <Text style={[styles.levelButtonText, isSelected && styles.levelButtonTextSelected]}>
                  {getLevelName(level as MapLevel)}
                </Text>
                <Text style={[styles.levelButtonCount, isSelected && styles.levelButtonCountSelected]}>
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Controls Overlay */}
      {currentLevelData.length > 0 && (
        <View style={styles.controlsContainer}>
          {/* Info Bar */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Level {currentLevel}: {currentIndex + 1} / {currentLevelData.length}
            </Text>
            <Text style={styles.infoSubtext}>
              {currentLevelData[currentIndex]?.name || 'No POI selected'}
            </Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View />
            {/* Navigation */}
            <View style={styles.navigationButtons}>
              <Pressable
                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
                onPress={() => handleNavigatePOI('prev')}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navButtonText}>← Prev</Text>
              </Pressable>

              <Pressable
                style={[styles.navButton, currentIndex === currentLevelData.length - 1 && styles.navButtonDisabled]}
                onPress={() => handleNavigatePOI('next')}
                disabled={currentIndex === currentLevelData.length - 1}
              >
                <Text style={styles.navButtonText}>Next →</Text>
              </Pressable>
            </View>

            {/* Utility */}
            <View style={styles.utilityButtons}>
              <Pressable style={styles.utilButton} onPress={fitAllMarkers}>
                <Text style={styles.utilButtonText}>Fit All</Text>
              </Pressable>

              <Pressable style={styles.utilButton} onPress={() => {
                if (userLocation) {
                  moveCameraToCoordinates(userLocation.latitude, userLocation.longitude, 15);
                }
              }}>
                <Text style={styles.utilButtonText}>📍 Me</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Empty State */}
      {currentLevelData.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No {getLevelName(currentLevel).toLowerCase()} recommendations yet.
            {'\n'}Search for places to see them on the map!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  levelSelectorContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  levelSelector: {
    paddingHorizontal: 16,
    gap: 8,
  },
  levelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelButtonSelected: {
    backgroundColor: '#0E6DE8',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  levelButtonTextSelected: {
    color: '#fff',
  },
  levelButtonCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelButtonCountSelected: {
    color: '#0E6DE8',
    backgroundColor: '#fff',
  },
  controlsContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    pointerEvents: 'auto',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    pointerEvents: 'auto',
  },
  drillButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  drillButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  drillButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    backgroundColor: '#0E6DE8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  utilityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  utilButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  utilButtonText: {
    color: '#0E6DE8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 32,
    pointerEvents: 'none',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
  },
});

export default Map;