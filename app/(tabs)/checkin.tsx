import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOpenAIChat } from '@/hooks/useOpenAIChat';
import { useSupabase } from '@/hooks/useSupabase';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [flareUps, setFlareUps] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const getMoodEmoji = (rating: number) => {
    const emojis = ['😔', '😕', '😖', '🙂', '😊'];
    return emojis[rating - 1] || '😐';
  };

  const getSleepEmoji = (rating: number) => {
    const emojis = ['😴', '😪', '😴', '😌', '😊'];
    return emojis[rating - 1] || '😴';
  };

  const getStressEmoji = (rating: number) => {
    const emojis = ['😊', '😌', '😐', '😨', '😰'];
    return emojis[rating - 1] || '😐';
  };

  const getFlareUpEmoji = (rating: number) => {
    const emojis = ['😊', '🙂', '😐', '😣', '😖'];
    return emojis[rating - 1] || '😐';
  };

  const handleMoodRating = (rating: number) => {
    setMoodRating(rating);
  };

  const handleSleepQuality = (rating: number) => {
    setSleepQuality(rating);
  };

  const handleStressLevel = (rating: number) => {
    setStressLevel(rating);
  };

  const handleFlareUps = (rating: number) => {
    setFlareUps(rating);
  };

  const questions = [
    {
      title: "How's your skin feeling today?",
      value: moodRating,
      setValue: setMoodRating,
      getEmoji: getMoodEmoji,
      labels: ['Poor', 'Fair', 'Okay', 'Good', 'Great']
    },
    {
      title: "How was your sleep quality?",
      value: sleepQuality,
      setValue: setSleepQuality,
      getEmoji: getSleepEmoji,
      labels: ['Poor', 'Fair', 'Okay', 'Good', 'Great']
    },
    {
      title: "What's your stress level?",
      value: stressLevel,
      setValue: handleStressLevel,
      getEmoji: getStressEmoji,
      labels: ['None', 'Low', 'Normal', 'High', 'Severe']
    },
    {
      title: "Any skin flare-ups?",
      value: flareUps,
      setValue: handleFlareUps,
      getEmoji: getFlareUpEmoji,
      labels: ['None', 'Slight', 'Mild', 'Moderate', 'Severe']
    }
  ];
  
  const camera = useRef<any>(null);
  const router = useRouter();
  
  const colorScheme = useColorScheme();
  const { user, uploadPhoto, saveSkinPhoto, getDailyStreak } = useSupabase();
  const { sendMessage, loading: aiLoading } = useOpenAIChat('checkin');
  const { width } = useWindowDimensions();



  useEffect(() => {
    if (user) {
      loadStreak();
    }
  }, [user]);

  const loadStreak = async () => {
    if (user) {
      const currentStreak = await getDailyStreak();
      setStreak(currentStreak);
    }
  };

  const handlePhotoTaken = (uri: string) => {
    setPhotoUri(uri);
    setShowQuestions(false);
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
    setShowQuestions(false);
    setMoodRating(null);
    setSleepQuality(null);
    setStressLevel(null);
    setFlareUps(null);
    setAiMessage(null);
  };

  const handleProceedToQuestions = () => {
    setShowQuestions(true);
    setCurrentQuestionIndex(0);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (photoUri) {
      setShowQuestions(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoUri || moodRating === null) {
      Alert.alert('Error', 'Please take a photo and rate your mood');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photo to Supabase Storage
      const photoUrl = await uploadPhoto(photoUri);
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      // Save to database with enhanced data
      const savedPhoto = await saveSkinPhoto(photoUrl, moodRating, {
        sleepQuality,
        stressLevel,
        flareUps,
      });
      if (!savedPhoto) {
        throw new Error('Failed to save photo data');
      }

      // Get AI encouragement with enhanced context
      const context = `User took a daily photo and rated their skin mood as ${moodRating}/5`;
      const additionalContext = [
        sleepQuality !== null && `Sleep quality: ${sleepQuality}/5`,
        stressLevel !== null && `Stress level: ${stressLevel}/5`,
        flareUps !== null && `Flare-ups: ${flareUps}/5`,
      ].filter(Boolean).join(', ');
      
      const aiResponse = await sendMessage(
        `${context}${additionalContext ? `. Additional factors: ${additionalContext}` : ''}. Give them personalized encouragement and tips based on their ratings.`
      );

      if (aiResponse) {
        setAiMessage(aiResponse);
      }

      // Update streak
      await loadStreak();

      Alert.alert('Success', 'Daily check-in completed! ✨', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home')
        }
      ]);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      Alert.alert('Error', 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingSection = (
    title: string,
    rating: number | null,
    onRating: (rating: number) => void,
    getEmoji: (rating: number) => string,
    labels: string[]
  ) => (
    <View style={styles.ratingSection}>
      <Text style={[styles.ratingTitle, { color: Colors.light.text }]}>
        {title}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.ratingButton,
              rating === r && styles.ratingButtonSelected,
              { borderColor: Colors.light.tint, borderWidth: 2, backgroundColor: rating === r ? Colors.light.tint : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={() => onRating(r)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={[styles.ratingEmoji, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {getEmoji(r)}
            </Text>
            <Text style={[styles.ratingText, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {r}
            </Text>
            <Text style={[styles.ratingLabel, { color: rating === r ? '#fff' : Colors.light.text }]}>
              {labels[r - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      {!showQuestions && !photoUri ? (
        <View style={styles.fullScreenCamera}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="front"
            ratio="1:1"
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => {
                    setPhotoUri(null); // Reset photo state when skipping
                    setShowQuestions(true);
                  }}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.centerGuide}>
                <View style={styles.faceGuideFrame} />
                <Text style={styles.cameraText}>
                  Position your face in the frame
                </Text>
              </View>
              
              <View style={styles.bottomControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={async () => {
                    if (camera.current) {
                      const photo = await camera.current.takePictureAsync({
                        quality: 0.8,
                        skipProcessing: true
                      });
                      handlePhotoTaken(photo.uri);
                    }
                  }}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      ) : photoUri && !showQuestions ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.light.text }]}>
              Daily Check-In
            </Text>
            <Text style={[styles.subtitle, { color: Colors.light.text }]}>
              {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak! 🔥` : 'Start your journey today'}
            </Text>
          </View>

          <View>
            <View style={styles.photoPreviewContainer}>
              <Text style={[styles.photoPreviewTitle, { color: Colors.light.text }]}>
                Your Photo
              </Text>
              <View style={styles.photoPreview}>
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetakePhoto}
                  disabled={isSubmitting}
                >
                  <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: Colors.light.tint }]}
                onPress={handleProceedToQuestions}
                disabled={isSubmitting}
              >
                <Text style={styles.continueButtonText}>Continue to Questions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.light.text }]}>
              Daily Check-In
            </Text>
            <Text style={[styles.subtitle, { color: Colors.light.text }]}>
              {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} streak! 🔥` : 'Start your journey today'}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
          </View>

          {renderRatingSection(
            questions[currentQuestionIndex].title,
            questions[currentQuestionIndex].value,
            questions[currentQuestionIndex].setValue,
            questions[currentQuestionIndex].getEmoji,
            questions[currentQuestionIndex].labels
          )}

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={handlePreviousQuestion}
            >
              <IconSymbol name="chevron.left" size={24} color={Colors.light.tint} />
              <Text style={[styles.navButtonText, { color: Colors.light.tint }]}>
                {currentQuestionIndex === 0 && photoUri ? 'Back to Photo' : 'Previous'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNextQuestion}
              disabled={questions[currentQuestionIndex].value === null}
            >
              <Text style={[styles.navButtonText, { color: '#fff' }]}>
                {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
              </Text>
              {currentQuestionIndex < questions.length - 1 && (
                <IconSymbol name="chevron.right" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {aiMessage && (
          <View style={styles.aiMessageContainer}>
            <View style={[styles.aiMessage, { backgroundColor: Colors.light.cardBackground }]}>
              <IconSymbol name="sparkles" size={20} color={Colors.light.tint} />
              <Text style={[styles.aiMessageText, { color: Colors.light.text }]}>
                {aiMessage}
              </Text>
            </View>
          </View>
        )}

        
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  prevButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  cameraText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    marginBottom: 40,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1001,
  },
  centerGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  faceGuideFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 20,
    opacity: 0.8,
    marginBottom: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1001,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  photoSection: {
    marginBottom: 32,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSection: {
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  ratingButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 60,
    height: 80,
    marginHorizontal: 4,
  },
  ratingButtonSelected: {
    transform: [{ scale: 1.05 }],
  },
  ratingEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  aiMessageContainer: {
    marginVertical: 20,
  },
  aiMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  aiMessageText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },

  photoPreviewContainer: {
    marginBottom: 25,
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  photoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    minHeight: 150,
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  continueButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

}); 
