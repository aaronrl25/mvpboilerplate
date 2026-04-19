import { StyledText } from '@/components/themed-text';
import { StyledView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';

// TODO: Replace with actual data from Firestore
const placeholderFollowing = [
  { id: '1', name: 'User 1' },
  { id: '2', name: 'User 2' },
  { id: '3', name: 'User 3' },
];

export default function FollowingScreen() {
  const renderItem = ({ item }: { item: { name: string } }) => (
    <View style={styles.itemContainer}>
      <StyledText>{item.name}</StyledText>
    </View>
  );

  return (
    <StyledView style={styles.container}>
      <StyledText type="title" style={styles.title}>Following</StyledText>
      <FlatList
        data={placeholderFollowing}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<StyledText style={styles.emptyText}>You are not following anyone yet.</StyledText>}
      />
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 20,
  },
  itemContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.card,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
});
