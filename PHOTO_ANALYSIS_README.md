# Photo Analysis Service

A comprehensive facial skincare analysis service that uses OpenAI Vision API to analyze photos and track progress over time.

## Features

- **Facial Analysis**: Analyze skin clarity, texture, and under-eye area
- **Progress Tracking**: Compare current photos with previous ones
- **Real User Data**: Uses actual sleep quality, stress level, and routine streak from Supabase
- **Encouraging Feedback**: AI-generated feedback tailored for young men
- **Cost Optimization**: Image compression and caching
- **Error Handling**: Robust error handling with fallback responses
- **TypeScript Support**: Full TypeScript types and interfaces

## Setup

### 1. Install Dependencies

```bash
npm install expo-image-manipulator expo-image-picker
```

### 2. Environment Variables

Add your OpenAI API key to your environment variables:

```bash
# .env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Permissions

Add the following permissions to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to analyze your skin progress."
        }
      ]
    ]
  }
}
```

## Usage

### Basic Photo Analysis with Real User Data

```typescript
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis';

function MyComponent() {
  const { analyzing, analysisResult, analysisError, analyzePhoto } = usePhotoAnalysis(userId);

  const handleAnalyze = async () => {
    await analyzePhoto({
      photoUrl: 'path/to/photo.jpg',
      userId: 'user123'
    });
    // User habits are automatically fetched from Supabase
  };

  return (
    <View>
      <TouchableOpacity onPress={handleAnalyze} disabled={analyzing}>
        <Text>{analyzing ? 'Analyzing...' : 'Analyze Photo'}</Text>
      </TouchableOpacity>
      
      {analysisResult && (
        <View>
          <Text>Clarity: {analysisResult.clarity}/10</Text>
          <Text>Texture: {analysisResult.texture}/10</Text>
          <Text>Under-Eyes: {analysisResult.underEyes}/10</Text>
          <Text>Overall: {analysisResult.overallScore}/10</Text>
          <Text>{analysisResult.feedback}</Text>
        </View>
      )}
      
      {analysisError && <Text style={{color: 'red'}}>{analysisError}</Text>}
    </View>
  );
}
```

### Photo Comparison with Real User Data

```typescript
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis';

function ProgressComponent() {
  const { comparing, comparisonResult, comparisonError, comparePhotos } = usePhotoAnalysis(userId);

  const handleCompare = async () => {
    await comparePhotos(
      'path/to/current.jpg',
      'path/to/previous.jpg'
    );
    // User habits are automatically fetched from Supabase
  };

  return (
    <View>
      <TouchableOpacity onPress={handleCompare} disabled={comparing}>
        <Text>{comparing ? 'Comparing...' : 'Compare Photos'}</Text>
      </TouchableOpacity>
      
      {comparisonResult && (
        <View>
          <Text>Clarity Improvement: {comparisonResult.clarityImprovement}%</Text>
          <Text>Texture Improvement: {comparisonResult.textureImprovement}%</Text>
          <Text>Under-Eyes Improvement: {comparisonResult.underEyesImprovement}%</Text>
          <Text>Overall Improvement: {comparisonResult.overallImprovement}%</Text>
          <Text>{comparisonResult.comparisonFeedback}</Text>
        </View>
      )}
      
      {comparisonError && <Text style={{color: 'red'}}>{comparisonError}</Text>}
    </View>
  );
}
```

### Using the Demo Component

```typescript
import { PhotoAnalysisDemo } from '../components/PhotoAnalysisDemo';

function App() {
  return (
    <View style={{flex: 1}}>
      <PhotoAnalysisDemo userId="user123" />
    </View>
  );
}
```

## API Reference

### Types

#### `SkinAnalysisResult`
```typescript
interface SkinAnalysisResult {
  clarity: number; // 1-10 score
  texture: number; // 1-10 score
  underEyes: number; // 1-10 score
  overallScore: number; // 1-10 score
  feedback: string;
  areasOfConcern: string[];
  improvements: string[];
  direction: string; // User direction for improvement
  timestamp: string;
}
```

#### `PhotoComparisonResult`
```typescript
interface PhotoComparisonResult {
  clarityImprovement: number; // percentage
  textureImprovement: number; // percentage
  underEyesImprovement: number; // percentage
  overallImprovement: number; // percentage
  comparisonFeedback: string;
  timeBetweenPhotos: number; // days
}
```

#### `UserHabits` (Real Data from Supabase)
```typescript
interface UserHabits {
  sleepQuality?: number; // 1-10 scale from recent photos
  stressLevel?: number; // 1-10 scale from recent photos
  routineStreak?: number; // days from user table
  dailyStreak?: number; // days from user table
  lastPhotoData?: {
    sleepQuality?: number;
    stressLevel?: number;
    date: string;
  };
}
```

### Service Functions

#### `analyzePhoto(request: AnalysisRequest)`
Analyzes a single photo for skincare tracking.

**Parameters:**
- `request.photoUrl`: URL or path to the photo
- `request.userId?`: Optional user ID for fetching habits from Supabase
- `request.userHabits?`: Optional user habits (will use Supabase data if not provided)

**Returns:** `Promise<AnalysisResponse>`

#### `comparePhotos(currentPhotoUrl, previousPhotoUrl, userHabits?)`
Compares two photos to track progress.

**Parameters:**
- `currentPhotoUrl`: URL or path to current photo
- `previousPhotoUrl`: URL or path to previous photo
- `userHabits?`: Optional user habits (will use Supabase data if not provided)

**Returns:** `Promise<AnalysisResponse>`

### Hook Methods

#### `usePhotoAnalysis(userId?)`
Returns an object with the following properties:

- `analyzing`: Boolean indicating if analysis is in progress
- `comparing`: Boolean indicating if comparison is in progress
- `analysisResult`: Current analysis result
- `comparisonResult`: Current comparison result
- `analysisError`: Error from analysis operation
- `comparisonError`: Error from comparison operation
- `analyzePhoto()`: Function to analyze a photo
- `comparePhotos()`: Function to compare photos
- `clearResults()`: Function to clear all results
- `clearErrors()`: Function to clear all errors
- `getCacheStats()`: Function to get cache statistics
- `clearCache()`: Function to clear the cache

## Data Sources

The service now uses real user data from Supabase:

### User Table Fields
- `routine_streak`: Number of consecutive days following skincare routine
- `daily_streak`: Number of consecutive days using the app

### Skin Photos Table Fields
- `sleep_quality`: Sleep quality rating (1-10) from photo submissions
- `stress_level`: Stress level rating (1-10) from photo submissions

The service automatically fetches the most recent photo data for sleep quality and stress level, and uses the current streak data from the user table.

## Error Handling

The service includes comprehensive error handling:

```typescript
export class PhotoAnalysisError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_PHOTO' | 'API_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INSUFFICIENT_CREDITS',
    public details?: any
  ) {
    super(message);
    this.name = 'PhotoAnalysisError';
  }
}
```

Common error codes:
- `INVALID_PHOTO`: Invalid image format or URL
- `API_ERROR`: OpenAI API error
- `NETWORK_ERROR`: Network connectivity issues
- `RATE_LIMIT`: API rate limit exceeded
- `INSUFFICIENT_CREDITS`: Insufficient API credits

## Cost Optimization

The service includes several cost optimization features:

1. **Image Compression**: Automatically compresses images to reduce API costs
2. **Caching**: Caches results to avoid duplicate API calls
3. **Size Limits**: Enforces maximum image size limits
4. **Quality Settings**: Configurable compression quality

## Image Processing

The service uses `expo-image-manipulator` for image processing:

- **Resize**: Maintains aspect ratio while resizing
- **Compress**: Reduces file size for API upload
- **Format Conversion**: Converts to optimal format for API
- **Validation**: Validates image format and size

## Prompt Engineering

The service uses carefully crafted prompts for:

1. **Analysis Prompts**: Focus on specific facial areas (clarity, texture, under-eyes)
2. **Comparison Prompts**: Generate percentage improvements
3. **Encouraging Tone**: Tailored for young male audience
4. **Real Data Connection**: Links improvements to actual user habits from Supabase

## Example Prompts

### Analysis Prompt
```
You are Glow, an expert skincare analyst for young men. Analyze this facial photo for skincare tracking.

Focus on these specific areas and provide scores (1-10, where 10 is perfect):
1. Skin Clarity: Overall clearness, absence of blemishes, even tone
2. Skin Texture: Smoothness, pore visibility, surface irregularities  
3. Under-Eyes: Dark circles, puffiness, fine lines

User habits context: Sleep quality: 7/10, Stress level: 5/10, Routine streak: 14 days, Daily streak: 21 days

Provide your analysis in this exact JSON format:
{
  "clarity": 7,
  "texture": 6,
  "underEyes": 8,
  "overallScore": 7,
  "feedback": "Your skin is looking solid! The texture has improved since last time. Keep up the hydration routine.",
  "areasOfConcern": ["slight texture on forehead", "minor redness on cheeks"],
  "improvements": ["clarity has improved", "under-eyes look brighter"],
  "Direction": "try sleeping 8+ hours a night this week"
}

Be encouraging and specific. Connect improvements to habits when possible. Keep feedback actionable and motivating for young men.
```

### Comparison Prompt
```
You are Glow, analyzing progress between two facial photos for a young man's skincare journey.

Compare the photos and provide percentage improvements (can be negative for declines):
- Skin Clarity improvement: X%
- Skin Texture improvement: X%
- Under-Eyes improvement: X%
- Overall improvement: X%

User habits context: Sleep quality: 8/10, Stress level: 3/10, Routine streak: 21 days, Daily streak: 30 days

Provide your analysis in this exact JSON format:
{
  "ClarityChanges": 15,
  "TextureChanges": 8,
  "UnderEyesChanges": 12,
  "OverallChanges": 11,
  "comparisonFeedback": "Great progress! Your consistency is paying off. The texture improvement is especially noticeable.",
  "timeBetweenPhotos": 14
}

Be encouraging and specific about what's working. Connect improvements to habits when possible.
```

## Best Practices

1. **Image Quality**: Use high-quality, well-lit photos for best results
2. **Consistent Lighting**: Use similar lighting conditions for comparisons
3. **Regular Tracking**: Analyze photos at consistent intervals
4. **Data Collection**: Ensure users provide sleep quality and stress level with photos
5. **Error Handling**: Always handle potential errors gracefully
6. **Cost Management**: Monitor API usage and implement caching
7. **User Experience**: Provide clear feedback during loading states

## Troubleshooting

### Common Issues

1. **"Invalid image format"**: Ensure image is in supported format (JPEG, PNG, WebP)
2. **"API key not configured"**: Check your environment variables
3. **"Network error"**: Check internet connectivity
4. **"Rate limit exceeded"**: Implement exponential backoff
5. **"Insufficient credits"**: Check your OpenAI account balance
6. **"No user data found"**: Ensure user has submitted photos with sleep/stress data

### Debug Mode

Enable debug logging by setting:

```typescript
// In your service configuration
const DEBUG_MODE = true;
```

This will log detailed information about API calls and responses.

## Performance Tips

1. **Cache Results**: Use the built-in caching to avoid duplicate API calls
2. **Compress Images**: Always compress images before analysis
3. **Batch Operations**: Group multiple analyses when possible
4. **Error Recovery**: Implement retry logic for transient failures
5. **Memory Management**: Clear cache periodically to free memory

## Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Image Privacy**: Consider privacy implications of uploading photos
3. **Data Retention**: Implement proper data retention policies
4. **User Consent**: Get explicit consent for photo analysis

## Migration from Hardcoded Values

If you were previously using hardcoded user habits, the service now automatically fetches real data from Supabase. The new `UserHabits` interface includes:

- **Real sleep quality** from recent photo submissions
- **Real stress level** from recent photo submissions  
- **Actual routine streak** from user table
- **Actual daily streak** from user table

The service will fall back to using provided habits if no Supabase data is available, ensuring backward compatibility. 