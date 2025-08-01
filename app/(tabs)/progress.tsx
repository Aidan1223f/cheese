import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { SkinPhoto } from '@/constants/database.types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<SkinPhoto[]>([]);
  const [loading, setLoading] = useState(false); // Start as false, will be set to true when user is available
  const [selectedPhoto, setSelectedPhoto] = useState<SkinPhoto | null>(null);
  const [streak, setStreak] = useState(0);
  const [averageMood, setAverageMood] = useState(0);
  const [averageSleep, setAverageSleep] = useState(0);
  const [averageStress, setAverageStress] = useState(0);
  const [averageFlareUps, setAverageFlareUps] = useState(0);
  
  const colorScheme = useColorScheme();
  const { user, getSkinPhotos, getStreak, signOut } = useSupabase();
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Dynamic photo size based on screen width
  const photoSize = Math.max(80, (width - 60) / 3);

  useEffect(() => {
    console.log('Progress: user state:', user);
    if (user) {
      console.log('Progress: Loading data for user:', user.id);
      loadData();
    } else {
      console.log('Progress: No user, setting loading to false');
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    console.log('Progress: Starting loadData');
    setLoading(true);
    try {
      console.log('Progress: Fetching photos and streak');
      const [photosData, currentStreak] = await Promise.all([
        getSkinPhotos(30),
        getStreak(),
      ]);
      
      console.log('Progress: Data received - photos:', photosData.length, 'streak:', currentStreak);
      setPhotos(photosData);
      setStreak(currentStreak);
      
      if (photosData.length > 0) {
        const totalMood = photosData.reduce((sum, photo) => sum + photo.mood_rating, 0);
        const avgMood = Math.round(totalMood / photosData.length);
        console.log('Progress: Average mood calculated:', avgMood);
        setAverageMood(avgMood);
        
        // Calculate averages for new metrics
        const photosWithSleep = photosData.filter(photo => photo.sleep_quality !== null);
        if (photosWithSleep.length > 0) {
          const totalSleep = photosWithSleep.reduce((sum, photo) => sum + (photo.sleep_quality || 0), 0);
          const avgSleep = Math.round(totalSleep / photosWithSleep.length);
          setAverageSleep(avgSleep);
        }
        
        const photosWithStress = photosData.filter(photo => photo.stress_level !== null);
        if (photosWithStress.length > 0) {
          const totalStress = photosWithStress.reduce((sum, photo) => sum + (photo.stress_level || 0), 0);
          const avgStress = Math.round(totalStress / photosWithStress.length);
          setAverageStress(avgStress);
        }
        
        const photosWithFlareUps = photosData.filter(photo => photo.flare_ups !== null);
        if (photosWithFlareUps.length > 0) {
          const totalFlareUps = photosWithFlareUps.reduce((sum, photo) => sum + (photo.flare_ups || 0), 0);
          const avgFlareUps = Math.round(totalFlareUps / photosWithFlareUps.length);
          setAverageFlareUps(avgFlareUps);
        }
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      console.log('Progress: Setting loading to false');
      setLoading(false);
    }
  };

  const handlePhotoPress = (photo: SkinPhoto) => {
    setSelectedPhoto(selectedPhoto?.id === photo.id ? null : photo);
  };

  const getMoodEmoji = (rating: number) => {
    const emojis = ['😔', '😕', '😐', '🙂', '😊'];
    return emojis[rating - 1] || '😐';
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { text: 'Glow Master', emoji: '👑', color: '#FFD700' };
    if (streak >= 21) return { text: 'Consistency King', emoji: '🌟', color: '#FF6B6B' };
    if (streak >= 14) return { text: 'Two Week Warrior', emoji: '🔥', color: '#4ECDC4' };
    if (streak >= 7) return { text: 'Week Warrior', emoji: '💪', color: '#45B7D1' };
    if (streak >= 3) return { text: 'Getting Started', emoji: '🌱', color: '#96CEB4' };
    return { text: 'New Glow', emoji: '✨', color: '#DDA0DD' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };



  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Loading your progress...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no user, show empty state (shouldn't happen in tabs, but just in case)
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.emptyContainer}>
                      <IconSymbol name="person.circle" size={Math.max(50, width * 0.12)} color="#007AFF" />
          <Text style={[styles.emptyTitle, { fontSize: Math.max(18, width * 0.045), color: Colors.light.text }]}>
            No user data
          </Text>
          <Text style={[styles.emptyText, { fontSize: Math.max(14, width * 0.035), color: Colors.light.text }]}>
            Please sign in to view your progress
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: Math.max(24, width * 0.06), color: Colors.light.text }]}>
            Your Progress
          </Text>
          <Text style={[styles.subtitle, { fontSize: Math.max(14, width * 0.035), color: Colors.light.text }]}>
            Track your skincare journey
          </Text>
          <TouchableOpacity 
            style={[styles.signOutButton, { backgroundColor: Colors.light.tint }]}
            onPress={() => {
              signOut();
              router.replace('/auth');
            }}
          >
            <Text style={[styles.signOutText, { color: '#fff' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
            <IconSymbol name="flame.fill" size={Math.max(20, width * 0.05)} color="#FF6B6B" />
            <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
              Day Streak
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
            <IconSymbol name="heart.fill" size={Math.max(20, width * 0.05)} color="#4ECDC4" />
            <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
              {averageMood}
            </Text>
            <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
              Avg Mood
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
            <IconSymbol name="camera.fill" size={Math.max(20, width * 0.05)} color="#45B7D1" />
            <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
              {photos.length}
            </Text>
            <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
              Photos
            </Text>
          </View>
        </View>

        {averageSleep > 0 && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
              <IconSymbol name="bed.double.fill" size={Math.max(20, width * 0.05)} color="#9B59B6" />
              <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
                {averageSleep}
              </Text>
              <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
                Sleep
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
              <IconSymbol name="brain.head.profile" size={Math.max(20, width * 0.05)} color="#E74C3C" />
              <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
                {averageStress}
              </Text>
              <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
                Stress
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.light.background, padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={Math.max(20, width * 0.05)} color="#F39C12" />
              <Text style={[styles.statNumber, { fontSize: Math.max(20, width * 0.05), color: Colors.light.text }]}>
                {averageFlareUps}
              </Text>
              <Text style={[styles.statLabel, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text }]}>
                Flare-ups
              </Text>
            </View>
          </View>
        )}

        {streak > 0 && (() => {
          const badge = getStreakBadge(streak);
          return (
            <View style={[styles.badgeContainer, { backgroundColor: (badge?.color || '#DDA0DD') + '20', padding: Math.max(15, width * 0.04), borderRadius: Math.max(10, width * 0.025) }]}>
              <Text style={[styles.badgeEmoji, { fontSize: Math.max(28, width * 0.07) }]}>{badge?.emoji || '✨'}</Text>
              <Text style={[styles.badgeText, { fontSize: Math.max(16, width * 0.04), color: Colors.light.text }]}>
                {badge?.text || 'New Glow'}
              </Text>
              <Text style={[styles.badgeSubtext, { fontSize: Math.max(12, width * 0.03), color: Colors.light.text }]}>
                {streak} day{streak > 1 ? 's' : ''} streak!
              </Text>
            </View>
          );
        })()}

        {photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="camera" size={Math.max(50, width * 0.12)} color="#007AFF" />
            <Text style={[styles.emptyTitle, { fontSize: Math.max(18, width * 0.045), color: Colors.light.text }]}>
              No photos yet
            </Text>
            <Text style={[styles.emptyText, { fontSize: Math.max(14, width * 0.035), color: Colors.light.text }]}>
              Take your first daily photo to start tracking your progress!
            </Text>
          </View>
        ) : (
          <View style={styles.photosSection}>
            <Text style={[styles.sectionTitle, { fontSize: Math.max(16, width * 0.04), color: Colors.light.text }]}>
              Your Journey
            </Text>
            <View style={styles.photoGrid}>
              {photos.slice(0, 9).map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    { width: photoSize, height: photoSize, marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
                    selectedPhoto?.id === photo.id && styles.selectedPhoto
                  ]}
                  onPress={() => handlePhotoPress(photo)}
                >
                  <Image source={{ uri: photo.photo_url }} style={styles.photo} />
                  <View style={styles.photoOverlay}>
                    <Text style={[styles.photoMood, { fontSize: Math.max(14, width * 0.035) }]}>{getMoodEmoji(photo.mood_rating)}</Text>
                    <Text style={[styles.photoDate, { fontSize: Math.max(8, width * 0.02) }]}>{formatDate(photo.created_at)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {selectedPhoto && (
              <View style={[styles.selectedPhotoDetails, { borderRadius: Math.max(10, width * 0.025) }]}>
                <Image source={{ uri: selectedPhoto.photo_url }} style={[styles.selectedPhotoImage, { height: Math.max(180, width * 0.45) }]} />
                <View style={[styles.selectedPhotoInfo, { padding: Math.max(12, width * 0.03) }]}>
                  <Text style={[styles.selectedPhotoDate, { fontSize: Math.max(14, width * 0.035), color: Colors.light.text }]}>
                    {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={[styles.selectedPhotoMood, { fontSize: Math.max(12, width * 0.03), color: Colors.light.text }]}>
                    Mood: {getMoodEmoji(selectedPhoto.mood_rating)} {selectedPhoto.mood_rating}/5
                  </Text>
                </View>
              </View>
            )}

            {photos.length > 9 && (
              <TouchableOpacity style={[styles.viewMoreButton, { paddingVertical: Math.max(12, width * 0.03) }]}>
                <Text style={[styles.viewMoreText, { fontSize: Math.max(14, width * 0.035), color: Colors.light.tint }]}>
                  View all {photos.length} photos
                </Text>
                <IconSymbol name="chevron.right" size={Math.max(14, width * 0.035)} color={Colors.light.tint} />
              </TouchableOpacity>
            )}
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
  scrollContent: {
    padding: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  badgeContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  photosSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  selectedPhoto: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  photoMood: {
    fontSize: 16,
    textAlign: 'center',
  },
  photoDate: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedPhotoDetails: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedPhotoImage: {
    width: '100%',
    height: 200,
  },
  selectedPhotoInfo: {
    padding: 15,
  },
  selectedPhotoDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  selectedPhotoMood: {
    fontSize: 14,
    opacity: 0.7,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 
