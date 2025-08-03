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
  Share,
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
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  
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

  const getMoodColor = (rating: number) => {
    switch (rating) {
      case 1:
        return '#FF6B6B'; // Red for sad
      case 2:
        return '#FFB86C'; // Orange for neutral
      case 3:
        return '#4ECDC4'; // Teal for happy
      case 4:
        return '#96CEB4'; // Green for very happy
      case 5:
        return '#DDA0DD'; // Pink for ecstatic
      default:
        return '#E0E0E0'; // Gray for no rating
    }
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

  const getAvailableMonths = () => {
    const months = new Set<string>();
    
    // Add current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    months.add(currentMonthKey);
    
    // Add months with photos
    photos.forEach(photo => {
      const date = new Date(photo.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      months.add(monthKey);
    });
    
    return Array.from(months).map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      return { month, year };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const getCurrentDisplayMonth = () => {
    if (selectedMonth) {
      return selectedMonth;
    }
    // Default to current month regardless of photos
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  };

  const formatMonthYear = (month: number, year: number) => {
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleShareProgress = async () => {
    if (!user) {
      console.error('User not logged in, cannot share progress.');
      return;
    }

    const baseUrl = 'https://your-app-url.com/progress'; // Replace with your actual app URL
    const shareUrl = `${baseUrl}?userId=${user.id}`;

    try {
      await Share.share({
        message: `Check out my skincare progress! \n\n${shareUrl}`,
      });
      console.log('Progress shared successfully!');
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
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
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { fontSize: Math.max(24, width * 0.06), color: Colors.light.text }]}>
                Your Progress
              </Text>
              <Text style={[styles.subtitle, { fontSize: Math.max(14, width * 0.035), color: Colors.light.text }]}>
                Track your skincare journey
              </Text>
            </View>
          </View>
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
              Check Ins
            </Text>
          </View>
        </View>

        {photos.length >= 2 && (
          <View style={[styles.transformationContainer, { backgroundColor: Colors.light.background, padding: Math.max(20, width * 0.05), borderRadius: Math.max(12, width * 0.03), marginBottom: 32 }]}>
            <Text style={[styles.transformationTitle, { fontSize: Math.max(18, width * 0.045), color: Colors.light.text, marginBottom: Math.max(16, width * 0.04) }]}>
              Transformation Progress
            </Text>
            
            <View style={styles.transformationComparison}>
              {/* Day 1 Photo */}
              <View style={styles.transformationPhotoContainer}>
                <Image 
                  source={{ uri: photos[photos.length - 1].photo_url }} 
                  style={[styles.transformationPhoto, { width: Math.max(160, width * 0.4), height: Math.max(160, width * 0.4) }]} 
                />
                <Text style={[styles.transformationDayLabel, { fontSize: Math.max(12, width * 0.03), color: Colors.light.text, marginTop: 8 }]}>
                  Day 1
                </Text>
                <Text style={[styles.transformationDate, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text, opacity: 0.7 }]}>
                  {new Date(photos[photos.length - 1].created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              {/* Most Recent Photo */}
              <View style={styles.transformationPhotoContainer}>
                <Image 
                  source={{ uri: photos[0].photo_url }} 
                  style={[styles.transformationPhoto, { width: Math.max(160, width * 0.4), height: Math.max(160, width * 0.4) }]} 
                />
                <Text style={[styles.transformationDayLabel, { fontSize: Math.max(12, width * 0.03), color: Colors.light.text, marginTop: 8 }]}>
                  Day {photos.length}
                </Text>
                <Text style={[styles.transformationDate, { fontSize: Math.max(10, width * 0.025), color: Colors.light.text, opacity: 0.7 }]}>
                  {new Date(photos[0].created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.shareSection}>
              <Text style={[styles.transformationPrompt, { fontSize: Math.max(12, width * 0.03), color: Colors.light.text }]}>
                Share your progress!
              </Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShareProgress}
              >
                <IconSymbol name="square.and.arrow.up" size={24} color="#8FAE8B" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Progress Banner */}
        <View style={styles.progressBanner}>
          <Text style={styles.progressTitle}>
            Your skin clarity improved by{' '}
            <Text style={styles.progressPercentage}>+23%</Text>
          </Text>
          <Text style={styles.progressSubtitle}>
            Keep going - you're on fire! 🔥
          </Text>
        </View>

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
            
            {/* Calendar Container */}
            <View style={styles.calendarContainer}>
              {/* Month Header */}
              <View style={styles.monthHeader}>
                <TouchableOpacity 
                  style={styles.monthSelector}
                  onPress={() => setShowMonthDropdown(!showMonthDropdown)}
                >
                  <Text style={styles.monthText}>
                    {(() => {
                      const currentMonth = getCurrentDisplayMonth();
                      return formatMonthYear(currentMonth.month, currentMonth.year);
                    })()}
                  </Text>
                  <IconSymbol 
                    name={showMonthDropdown ? "chevron.up" : "chevron.down"} 
                    size={16} 
                    color="#424242" 
                  />
                </TouchableOpacity>
                
                {/* Dropdown Menu */}
                {showMonthDropdown && (
                  <View style={styles.dropdownMenu}>
                    {getAvailableMonths().map((monthData, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedMonth(monthData);
                          setShowMonthDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {formatMonthYear(monthData.month, monthData.year)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Week Headers */}
              <View style={styles.weekHeaders}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekHeaderText}>{day}</Text>
                ))}
              </View>
              
              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  if (photos.length === 0) return null;
                  
                  const currentMonth = getCurrentDisplayMonth();
                  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
                  const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month, 1).getDay();
                  const calendarDays = [];
                  
                  // Add empty cells for days before the month starts
                  for (let i = 0; i < firstDayOfMonth; i++) {
                    calendarDays.push({ type: 'empty', day: null });
                  }
                  
                  // Add all days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    // Find if there's a photo for this date
                    const photoForDay = photos.find(photo => {
                      const photoDate = new Date(photo.created_at);
                      return photoDate.getDate() === day && 
                             photoDate.getMonth() === currentMonth.month &&
                             photoDate.getFullYear() === currentMonth.year;
                    });
                    
                    if (photoForDay) {
                      calendarDays.push({ 
                        type: 'photo', 
                        day: day, 
                        photo: photoForDay 
                      });
                    } else {
                      calendarDays.push({ 
                        type: 'empty', 
                        day: day 
                      });
                    }
                  }
                  
                  return calendarDays.map((item, index) => (
                    <View key={index} style={styles.calendarCell}>
                      {item.type === 'photo' && item.photo ? (
                        <TouchableOpacity
                          style={[
                            styles.dateCircle,
                            { backgroundColor: getMoodColor(item.photo.mood_rating) },
                            selectedPhoto?.id === item.photo.id && styles.selectedCalendarCell
                          ]}
                          onPress={() => handlePhotoPress(item.photo)}
                        >
                          <Text style={styles.dateText}>{item.day}</Text>
                        </TouchableOpacity>
                      ) : item.day ? (
                        <View style={styles.emptyDateCircle}>
                          <Text style={styles.emptyDateText}>{item.day}</Text>
                        </View>
                      ) : (
                        <View style={styles.calendarCell} />
                      )}
                    </View>
                  ));
                })()}
              </View>
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

            {photos.length > 30 && (
              <TouchableOpacity style={[styles.viewMoreButton, { paddingVertical: Math.max(12, width * 0.03) }]}>
                <Text style={[styles.viewMoreText, { fontSize: Math.max(14, width * 0.035), color: Colors.light.tint }]}>
                  View all {photos.length} days
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerText: {
    alignItems: 'center',
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
  shareButton: {
    padding: 10,
    backgroundColor: '#F0F8F0',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: 320,
    alignSelf: 'center',
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    zIndex: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#424242',
  },
  weekHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekHeaderText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '400',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarCell: {
    width: '14.285%', // Exactly 1/7 of the width
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedCalendarCell: {
    borderWidth: 2,
    borderColor: '#8FAE8B',
    borderRadius: 20,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyDateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0', // Gray for empty cells
  },
  emptyDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575', // Darker gray for empty cells
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
  transformationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  transformationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  transformationComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 15,
  },
  transformationPhotoContainer: {
    alignItems: 'center',
    backgroundColor: "#F0F8F0",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',

  },
  transformationPhoto: {
    borderRadius: 10,
    borderColor: '#E0E0E0',
  },
  transformationDayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  transformationDate: {
    fontSize: 10,
    opacity: 0.7,
  },
  transformationPrompt: {
    fontSize: 15,
    color: '#424242',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
  },
  progressBanner: {
    backgroundColor: '#E8F5E9', // Light green background
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a0000	', // Dark green for title
    textAlign: 'center',
    lineHeight: 22,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32', // Dark green for percentage
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#454547', // Dark green for subtitle
    textAlign: 'center',
    marginTop: 4,
  },
  shareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
  },
}); 
