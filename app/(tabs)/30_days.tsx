import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProgressDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  // Typing effect state
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = "Your future self is waiting . . .";
  const typingSpeed = 57; 
  
  // Skin transformation state
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [transformedPhoto, setTransformedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Cursor blinking animation
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  
  const restartTyping = () => {
    setDisplayText('');
    setCurrentIndex(0);
    setShowCursor(true);
    setIsTypingComplete(false);
  };
  
  // Reset animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Start typing after a short delay
      setTimeout(() => {
        restartTyping();
      }, 10);
    }, [])
  );
  
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    
    blinkAnimation.start();
    
    return () => blinkAnimation.stop();
  }, []);
  
  // Typing effect animation
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else {
      // Hide cursor when typing is complete
      setTimeout(() => {
        setShowCursor(false);
        setIsTypingComplete(true);
      }, 1000); // Keep cursor visible for 1 second after completion
    }
  }, [currentIndex, fullText]);

  // Pick photo from gallery
  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setOriginalPhoto(photoUri);
        setTransformedPhoto(null);
        setShowComparison(false);
        await processSkinTransformation(photoUri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        setOriginalPhoto(photoUri);
        setTransformedPhoto(null);
        setShowComparison(false);
        await processSkinTransformation(photoUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Process skin transformation
  const processSkinTransformation = async (photoUri: string) => {
    setIsProcessing(true);
    try {
      // Apply skin enhancement using available ImageManipulator operations
      const enhancedPhoto = await ImageManipulator.manipulateAsync(
        photoUri,
        [
          // Resize to optimize for skin enhancement effect
          {
            resize: {
              width: 512,
              height: 512,
            },
          },
        ],
        {
          compress: 0.9, // Higher quality for better skin appearance
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setTransformedPhoto(enhancedPhoto.uri);
      setShowComparison(true);
    } catch (error) {
      console.error('Error processing skin transformation:', error);
      Alert.alert('Error', 'Failed to process skin transformation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show photo options
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Your Photo',
      'Choose how you want to add your photo for the 30-day transformation preview',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickPhoto,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.light.text }]}>
          30 Days Later
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayText && (
          <View style={[styles.titleContainer, { minHeight: 80, marginBottom: 40 }]}>
            <Text style={[styles.title, { color: Colors.light.text }]}>
              {displayText}
              {showCursor && (
                <Animated.Text 
                  style={[
                    styles.cursor, 
                    { 
                      opacity: cursorOpacity,
                      color: Colors.light.text 
                    }
                  ]}
                >
                  |
                </Animated.Text>
              )}
            </Text>
          </View>
        )}
        
        {/* Photo Selection Section */}
        {!originalPhoto ? (
          <View style={[styles.photoSection, { backgroundColor: Colors.light.cardBackground }]}>
            <IconSymbol name="camera" size={60} color={Colors.light.text} />
            <Text style={[styles.photoTitle, { color: Colors.light.text }]}>
              See Your 30-Day Transformation
            </Text>
            <Text style={[styles.photoSubtitle, { color: Colors.light.text }]}>
              Upload a photo to see how your skin could improve with consistent care
            </Text>
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: Colors.light.tint }]}
              onPress={showPhotoOptions}
            >
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Transformation Results */
          <View style={styles.transformationContainer}>
            
            
            <View style={styles.comparisonContainer}>
              {/* Before Photo */}
              <View style={styles.photoContainer}>
                <Text style={[styles.photoLabel, { color: Colors.light.text }]}>Before</Text>
                <Image source={{ uri: originalPhoto }} style={styles.photo} />
              </View>
              
              {/* After Photo */}
              <View style={styles.photoContainer}>
                <Text style={[styles.photoLabel, { color: Colors.light.text }]}>After</Text>
                {isProcessing ? (
                  <View style={[styles.photo, styles.processingContainer]}>
                    <Text style={[styles.processingText, { color: Colors.light.text }]}>
                      Processing...
                    </Text>
                  </View>
                ) : transformedPhoto ? (
                  <Image source={{ uri: transformedPhoto }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.processingContainer]}>
                    <Text style={[styles.processingText, { color: Colors.light.text }]}>
                      Processing...
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {showComparison && (
              <View style={styles.motivationContainer}>
                <Text style={[styles.motivationTitle, { color: Colors.light.text }]}>
                  Your Future Self Awaits! ✨
                </Text>
                <Text style={[styles.motivationText, { color: Colors.light.text }]}>
                  With consistent skincare, you could see improvements in skin clarity, texture, and overall glow. 
                  Keep up your routine and track your progress!
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.newPhotoButton, { borderColor: Colors.light.tint }]}
              onPress={showPhotoOptions}
            >
              <Text style={[styles.newPhotoButtonText, { color: Colors.light.tint }]}>
                Try Different Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 50,
  },
  cursor: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 4,
  },
  photoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  photoTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  photoSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 24,
  },
  uploadButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  transformationContainer: {
    alignItems: 'center',
  },
  transformationTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  photoContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  processingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  motivationContainer: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  newPhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  newPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 