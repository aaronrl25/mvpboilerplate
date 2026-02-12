import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppSelector } from '@/hooks/useRedux';
import { todoService, Todo, TODO_CATEGORIES } from '@/services/todoService';
import { SearchBar } from '@/components/SearchBar';

export default function ListScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodo, setNewTodo] = useState({ 
    title: '', 
    description: '', 
    imageUrl: '',
    category: TODO_CATEGORIES[0].id 
  });
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      const unsubscribe = todoService.subscribeToTodos(user.uid, (fetchedTodos) => {
        setTodos(fetchedTodos);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTodos(todos);
    } else {
      const filtered = todos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          todo.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTodos(filtered);
    }
  }, [todos, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && user) {
      try {
        setUploading(true);
        const downloadUrl = await todoService.uploadTodoPhoto(user.uid, result.assets[0].uri);
        setNewTodo({ ...newTodo, imageUrl: downloadUrl });
      } catch (error) {
        Alert.alert('Upload Error', 'Failed to upload image');
        console.error(error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title || !user) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await todoService.addTodo(user.uid, newTodo);
      setModalVisible(false);
      setNewTodo({ title: '', description: '', imageUrl: '', category: TODO_CATEGORIES[0].id });
    } catch (error) {
      Alert.alert('Error', 'Failed to add todo');
      console.error(error);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      await todoService.updateTodo(todo.id, { completed: !todo.completed });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTodo = async (id: string) => {
    Alert.alert('Delete Todo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => todoService.deleteTodo(id) },
    ]);
  };

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const category = TODO_CATEGORIES.find(c => c.id === item.category) || TODO_CATEGORIES[0];
    
    return (
      <View style={[styles.todoItem, item.completed && styles.todoItemCompleted]}>
        <TouchableOpacity 
          style={styles.todoCheck} 
          onPress={() => toggleTodo(item)}
        >
          <IconSymbol 
            name={item.completed ? "checkmark.circle.fill" : "circle"} 
            size={24} 
            color={item.completed ? "#4CAF50" : "#ccc"} 
          />
        </TouchableOpacity>
        
        <View style={styles.todoContent}>
          <View style={styles.todoHeaderInfo}>
            <ThemedText style={[styles.todoTitle, item.completed && styles.textCompleted]}>
              {item.title}
            </ThemedText>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <ThemedText style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={styles.todoDescription}>{item.description}</ThemedText>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.todoImage} />
          )}
        </View>

        <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteButton}>
          <IconSymbol name="trash.fill" size={20} color="#FF5252" /> 
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Todo List</ThemedText>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <IconSymbol name="plus" size={28} color="#2196F3" />
        </TouchableOpacity>
      </ThemedView>

      <SearchBar onSearch={handleSearch} placeholder="Search todos..." />
      
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : filteredTodos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="list.bullet" size={64} color="#ccc" />
          <ThemedText style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'Your list is empty'}
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search query' : 'Add a todo with photo to get started'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>New Todo</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={newTodo.title}
              onChangeText={(text) => setNewTodo({ ...newTodo, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              value={newTodo.description}
              onChangeText={(text) => setNewTodo({ ...newTodo, description: text })}
            />

            <ThemedText style={styles.modalLabel}>Category</ThemedText>
            <View style={styles.categoryContainer}>
              {TODO_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    newTodo.category === cat.id && { backgroundColor: cat.color + '30', borderColor: cat.color }
                  ]}
                  onPress={() => setNewTodo({ ...newTodo, category: cat.id })}
                >
                  <ThemedText style={[styles.categoryOptionText, newTodo.category === cat.id && { color: cat.color }]}>
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {uploading ? (
                <ActivityIndicator color="#2196F3" />
              ) : newTodo.imageUrl ? (
                <Image source={{ uri: newTodo.imageUrl }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <IconSymbol name="paperplane.fill" size={32} color="#666" />
                  <ThemedText>Add Photo</ThemedText>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.addButton]} 
                onPress={handleAddTodo}
              >
                <ThemedText style={styles.buttonText}>Add Todo</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  loader: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  todoCheck: {
    marginRight: 12,
    marginTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  textCompleted: {
    textDecorationLine: 'line-through',
  },
  todoDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  todoImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtext: {
    opacity: 0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
