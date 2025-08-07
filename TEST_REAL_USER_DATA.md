# Testing Real User Data Integration

This guide helps you test the updated photo analysis service that now uses real user data from Supabase instead of hardcoded values.

## What Changed

### Before (Hardcoded Values)
```typescript
const userHabits = {
  sleepHours: 7,
  waterIntake: 8,
  stressLevel: 5,
  exerciseFrequency: 4,
  skincareConsistency: 6,
  dietQuality: 7,
};
```

### After (Real Data from Supabase)
```typescript
const userHabits = {
  sleepQuality: 8, // From recent photo submissions
  stressLevel: 3,  // From recent photo submissions
  routineStreak: 14, // From user table
  dailyStreak: 21,   // From user table
  lastPhotoData: {
    sleepQuality: 8,
    stressLevel: 3,
    date: "2024-01-15T10:30:00Z"
  }
};
```

## Testing Steps

### 1. Verify Database Schema

Ensure your Supabase database has the required fields:

**Users Table:**
- `routine_streak` (integer)
- `daily_streak` (integer)

**Skin Photos Table:**
- `sleep_quality` (integer, nullable)
- `stress_level` (integer, nullable)

### 2. Test Data Population

1. **Create a test user** with some streak data:
   ```sql
   UPDATE users 
   SET routine_streak = 14, daily_streak = 21 
   WHERE id = 'your-test-user-id';
   ```

2. **Add test photo data** with sleep/stress ratings:
   ```sql
   INSERT INTO skin_photos (user_id, photo_url, mood_rating, sleep_quality, stress_level)
   VALUES ('your-test-user-id', 'test-photo-url', 8, 7, 4);
   ```

### 3. Test the Integration

#### Method 1: Using the Demo Component

1. **Start your app**:
   ```bash
   npm start
   ```

2. **Navigate to the Home screen** - The photo analysis demo is integrated

3. **Test with real user data**:
   - The demo will automatically fetch user habits from Supabase
   - Select a photo and analyze it
   - Check the console logs to see the real user data being used

#### Method 2: Direct Hook Testing

```typescript
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis';
import { useUserHabits } from '../hooks/useUserHabits';

function TestComponent() {
  const userId = 'your-test-user-id';
  
  // Test the user habits hook
  const { habits, loading, error } = useUserHabits(userId);
  
  // Test the photo analysis hook
  const { analyzing, analyzePhoto } = usePhotoAnalysis(userId);
  
  const testAnalysis = async () => {
    console.log('User habits from Supabase:', habits);
    
    await analyzePhoto({
      photoUrl: 'test-photo-url',
      userId
    });
  };
  
  return (
    <View>
      <Text>Loading: {loading ? 'Yes' : 'No'}</Text>
      <Text>Error: {error || 'None'}</Text>
      <Text>Sleep Quality: {habits.sleepQuality || 'N/A'}</Text>
      <Text>Stress Level: {habits.stressLevel || 'N/A'}</Text>
      <Text>Routine Streak: {habits.routineStreak || 'N/A'}</Text>
      <Text>Daily Streak: {habits.dailyStreak || 'N/A'}</Text>
      
      <TouchableOpacity onPress={testAnalysis}>
        <Text>Test Analysis</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 4. Verify Expected Behavior

#### ✅ What Should Work

1. **Real Data Fetching**: The service should fetch actual user data from Supabase
2. **Fallback Behavior**: If no data exists, it should gracefully handle missing data
3. **Context in Prompts**: The AI prompts should include real user habits
4. **Error Handling**: Should handle database connection issues gracefully

#### ✅ Expected Console Output

When testing, you should see logs like:
```
User habits from Supabase: {
  sleepQuality: 7,
  stressLevel: 4,
  routineStreak: 14,
  dailyStreak: 21,
  lastPhotoData: {
    sleepQuality: 7,
    stressLevel: 4,
    date: "2024-01-15T10:30:00Z"
  }
}
```

#### ✅ Expected AI Prompt Context

The AI should receive prompts like:
```
User habits context: Sleep quality: 7/10, Stress level: 4/10, Routine streak: 14 days, Daily streak: 21 days
```

### 5. Test Edge Cases

#### No User Data
```typescript
// Test with a user that has no photo data
const { habits } = useUserHabits('user-with-no-data');
console.log(habits); // Should show empty or default values
```

#### Missing Streak Data
```typescript
// Test with a user that has no streak data
const { habits } = useUserHabits('user-with-no-streaks');
console.log(habits.routineStreak); // Should be 0 or undefined
```

#### Database Connection Issues
```typescript
// Test error handling when Supabase is unavailable
// Should gracefully fall back to empty habits
```

### 6. Performance Testing

1. **Cache Behavior**: Test that results are properly cached
2. **API Cost**: Verify that real data doesn't increase API costs unnecessarily
3. **Loading States**: Ensure loading states work correctly with real data fetching

## Troubleshooting

### Common Issues

1. **"No user data found"**
   - Ensure user has submitted photos with sleep/stress data
   - Check that the user ID is correct
   - Verify database permissions

2. **"Database connection error"**
   - Check Supabase connection
   - Verify environment variables
   - Check network connectivity

3. **"Empty habits object"**
   - This is normal for new users
   - The service will work with empty habits
   - Consider adding default values

### Debug Mode

Enable detailed logging:

```typescript
// In your component
const { habits, loading, error } = useUserHabits(userId);
console.log('User habits debug:', { habits, loading, error });

// In the photo analysis service
const DEBUG_MODE = true;
```

## Migration Checklist

- [ ] Database schema updated with required fields
- [ ] User has some test data (streaks, photo submissions)
- [ ] Photo analysis service updated to use real data
- [ ] Demo component updated to pass userId
- [ ] Error handling tested for missing data
- [ ] Performance verified with real data
- [ ] Documentation updated

## Next Steps

After successful testing:

1. **Production Deployment**: Deploy the updated service
2. **User Onboarding**: Ensure users provide sleep/stress data with photos
3. **Analytics**: Track how real data improves analysis accuracy
4. **Optimization**: Fine-tune prompts based on real user data patterns 