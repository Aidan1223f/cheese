# Testing the Photo Analysis Feature

## Prerequisites

1. **OpenAI API Key**: You need a valid OpenAI API key with access to GPT-4 Vision
2. **Environment Setup**: Create a `.env` file in your project root with:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

## How to Test

### Method 1: Using the Demo Component (Recommended)

1. **Start your app**:
   ```bash
   npm start
   # or
   npx expo start
   ```

2. **Navigate to the Home screen** - The photo analysis demo is now integrated into your home screen

3. **Test Single Photo Analysis**:
   - Tap "Select Current Photo" to choose a facial photo from your device
   - Tap "Analyze Photo" to run the analysis
   - View the results showing scores for clarity, texture, and under-eyes
   - Read the encouraging feedback text

4. **Test Photo Comparison**:
   - Select both a current photo and a previous photo
   - Tap "Compare Photos" to see progress over time
   - View percentage improvements and detailed feedback

### Method 2: Direct API Testing

You can also test the service directly in your code:

```typescript
import { analyzePhoto, comparePhotos } from '../services/photoAnalysisService';

// Test single photo analysis
const result = await analyzePhoto({
  photoUrl: 'path/to/your/photo.jpg',
  userHabits: {
    sleepHours: 7,
    waterIntake: 8,
    stressLevel: 5,
    exerciseFrequency: 4,
    skincareConsistency: 6,
    dietQuality: 7,
  },
  userId: 'test-user-123'
});

console.log('Analysis result:', result);

// Test photo comparison
const comparison = await comparePhotos(
  'path/to/current/photo.jpg',
  'path/to/previous/photo.jpg',
  {
    sleepHours: 8,
    waterIntake: 9,
    stressLevel: 3,
    exerciseFrequency: 5,
    skincareConsistency: 8,
    dietQuality: 8,
  }
);

console.log('Comparison result:', comparison);
```

## What to Test

### ✅ Basic Functionality
- [ ] Photo selection from device gallery
- [ ] Single photo analysis
- [ ] Photo comparison (current vs previous)
- [ ] Score generation (1-10 scale)
- [ ] Encouraging feedback text
- [ ] Error handling for invalid photos

### ✅ User Experience
- [ ] Loading states during analysis
- [ ] Clear error messages
- [ ] Intuitive UI for photo selection
- [ ] Results display with visual score bars
- [ ] Responsive design

### ✅ Technical Features
- [ ] Image compression and optimization
- [ ] Caching to reduce API costs
- [ ] TypeScript type safety
- [ ] Error handling with fallback responses

## Expected Results

### Single Photo Analysis
You should see:
- **Scores**: Clarity (1-10), Texture (1-10), Under-Eyes (1-10), Overall (1-10)
- **Feedback**: Encouraging text tailored for young men
- **Areas of Concern**: Specific issues identified
- **Improvements**: Suggested actions based on user habits

### Photo Comparison
You should see:
- **Percentage Improvements**: e.g., "15% improvement in skin clarity"
- **Detailed Analysis**: Changes in specific areas
- **Progress Feedback**: Encouraging text about progress
- **Habit Correlation**: Connection between improvements and user habits

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check your `.env` file has the correct API key
   - Ensure the key has GPT-4 Vision access

2. **"Permission Denied" Error**
   - Make sure you've granted photo library permissions
   - Check `app.json` has the correct permissions

3. **"Network Error"**
   - Check your internet connection
   - Verify OpenAI API is accessible

4. **"Image Processing Error"**
   - Try with a different photo
   - Ensure the photo is a valid image format

### Debug Mode

To see detailed logs, add this to your component:

```typescript
import { photoAnalysisService } from '../services/photoAnalysisService';

// Enable debug mode
photoAnalysisService.setDebugMode(true);
```

## Cost Optimization Tips

1. **Image Compression**: The service automatically compresses images to reduce API costs
2. **Caching**: Results are cached to avoid duplicate API calls
3. **Error Handling**: Fallback responses prevent unnecessary API calls on errors

## Next Steps

After testing:
1. **Integration**: Integrate the service into your main app flow
2. **Customization**: Adjust prompts for your specific use case
3. **Analytics**: Add tracking for user engagement
4. **Performance**: Monitor API usage and optimize as needed 