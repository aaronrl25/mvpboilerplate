import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { feedService, Post } from '@/services/feedService';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Error fetching location');
      } finally {
        setLoading(false);
      }
    })();

    // Subscribe to all posts to show on map
    // In a real app, you'd probably use a geoquery here to only fetch nearby posts
    const unsubscribe = feedService.getGlobalFeed((newPosts) => {
      const postsWithLocation = newPosts.filter(p => p.latitude && p.longitude);
      setPosts(postsWithLocation);
    });

    return () => unsubscribe();
  }, []);

  const centerOnUser = async () => {
    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <ThemedView style={styles.centerContent}>
        <ActivityIndicator size="large" color={themeColors.tint} />
        <ThemedText style={styles.loadingText}>Fetching your location...</ThemedText>
      </ThemedView>
    );
  }

  if (errorMsg) {
    return (
      <ThemedView style={styles.centerContent}>
        <IconSymbol name="info.circle.fill" size={48} color={themeColors.icon} />
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.tint }]} onPress={centerOnUser}>
          <ThemedText style={styles.buttonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords.latitude || 37.78825,
          longitude: location?.coords.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        region={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You are here"
            description="Your current location"
            pinColor={themeColors.tint}
          />
        )}

        {posts.map((post) => (
          <Marker
            key={post.id}
            coordinate={{
              latitude: post.latitude!,
              longitude: post.longitude!,
            }}
            title={post.userDisplayName}
            description={post.content}
            onCalloutPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
          >
            <View style={styles.postMarker}>
              {post.userPhotoURL ? (
                <Image source={{ uri: post.userPhotoURL }} style={styles.markerAvatar} />
              ) : (
                <View style={[styles.markerAvatar, { backgroundColor: themeColors.tint }]}>
                  <IconSymbol name="person.fill" size={12} color="#fff" />
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity 
        style={[styles.myLocationButton, { backgroundColor: themeColors.background }]} 
        onPress={centerOnUser}
      >
        <IconSymbol name="paperplane.fill" size={24} color={themeColors.tint} />
      </TouchableOpacity>

      <View style={styles.overlayHeader}>
        <ThemedText type="title" style={styles.headerTitle}>Map Explorer</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlayHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerTitle: {
    color: '#000',
    fontSize: 20,
  },
  postMarker: {
    padding: 2,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
