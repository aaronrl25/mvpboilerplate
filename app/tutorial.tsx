
import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Swipe & Discover',
    description: 'Find your next favorite movie with a simple swipe.',
    lottie: require('@/assets/images/Cinemanewsanimation.json'), // Placeholder
  },
  {
    key: '2',
    title: 'Match with Friends',
    description: 'See your movie taste compatibility with others.',
    lottie: require('@/assets/images/Cinemanewsanimation.json'), // Placeholder
  },
  {
    key: '3',
    title: 'Build Your Watchlist',
    description: 'Save movies to watch later and never lose track.',
    lottie: require('@/assets/images/Cinemanewsanimation.json'), // Placeholder
    },
];

export default function TutorialScreen() {
  const renderItem = ({ item, index }: { item: typeof slides[0] & { lottie?: any }, index: number }) => {
    return (
      <StyledView style={styles.slide}>
                {item.lottie ? (
          <LottieView
            source={item.lottie}
            autoPlay
            loop
            style={styles.lottie}
          />
        ) : (
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        )}
        <StyledText type="title" style={styles.title}>{item.title}</StyledText>
        <StyledText style={styles.description}>{item.description}</StyledText>

        {index === slides.length - 1 && (
          <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
            <StyledText type="button">Get Started</StyledText>
          </TouchableOpacity>
        )}
      </StyledView>
    );
  };

  return (
    <StyledView style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
      />
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
        backgroundColor: Colors.dark.background,

  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 60,
  },
  lottie: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.dark.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 60,
  },
});
