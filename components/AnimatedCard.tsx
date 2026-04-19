import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Movie } from '@/services/movieService';
import MovieCard from '@/components/MovieCard';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD_X = SCREEN_WIDTH * 0.4;
const SWIPE_THRESHOLD_Y = SCREEN_HEIGHT * 0.15;

interface AnimatedCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ movie, onSwipe, isTop }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
        [-15, 15],
        Extrapolate.CLAMP
      );
      scale.value = interpolate(
        event.translationY,
        [-SWIPE_THRESHOLD_Y, 0],
        [1.1, 1],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (event.translationY < -SWIPE_THRESHOLD_Y) {
                    // Super Like
                    translateY.value = withSpring(-SCREEN_HEIGHT * 1.5, {}, () => runOnJS(onSwipe)('up'));
                  } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD_X) {
                    const direction = event.translationX > 0 ? 'right' : 'left';
                    // Like or Dislike
                    translateX.value = withSpring(Math.sign(event.translationX) * SCREEN_WIDTH * 1.5, {}, () => runOnJS(onSwipe)(direction));
                  } else {
        // Reset position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));
  
  const cardStyle = [styles.card, isTop && animatedCardStyle];

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={cardStyle}>
        <MovieCard movie={movie} translateX={translateX} />
        <Animated.View style={[styles.superLikeIndicator]}>
          <IconSymbol name="star.fill" size={40} color={Colors.dark.tint} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  superLikeIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0, // This will be animated based on swipe up
  },
});
