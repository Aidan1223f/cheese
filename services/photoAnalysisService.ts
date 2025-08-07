import { imageToBase64, processImageForAnalysis, validateImage } from '../utils/imageProcessing';

// Types for photo analysis
export interface SkinAnalysisResult {
  rednessIrritation: number; // 0-100 score
  texture: number; // 0-100 score
  toneMarks: number; // 0-100 score
  underEyes: number | string; // 0-100 score or description
  visibleProgressScore: number; // 0-100 score
  feedback: string;
  areasOfFocus: string[];
  suggestion: string; // New field for user direction
  timestamp: string;
}

export interface PhotoComparisonResult {
  "Redness & Irritation": number; // percentage change
  texture: number; // percentage change
  "Tone & Marks": number; // percentage change
  underEyes: number | string; // percentage change or description
  "Visible Progress Score": number; // percentage change
  feedback: string;
  areasOfFocus: string[];
  suggestion: string;
  timeBetweenPhotos: number; // days
}

export interface UserHabits {
  sleepQuality?: number; // 1-10 scale
  stressLevel?: number; // 1-10 scale
  routineStreak?: number; // days
  dailyStreak?: number; // days
  lastPhotoData?: {
    sleepQuality?: number;
    stressLevel?: number;
    date: string;
  };
}

export interface AnalysisRequest {
  photoUrl: string;
  previousPhotoUrl?: string;
  userHabits?: UserHabits;
  userId?: string;
  userData?: {
    skin_goal?: string;
    skin_type?: string;
    skin_concerns?: string[];
    skin_goals?: string[];
    age?: number;
    first_name?: string;
    routine_streak?: number;
    daily_streak?: number;
    created_at?: string;
  };
}

export interface AnalysisResponse {
  success: boolean;
  data?: SkinAnalysisResult | PhotoComparisonResult;
  error?: string;
  cost?: number; // estimated API cost
}

// Error types
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

// Configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const COMPRESSION_QUALITY = 0.8;

// Rating guidelines for consistent analysis
const ratingGuidelines = {
  rednessIrritation: {
    "90-100": "Nearly flawless, minimal visible redness or irritation",
    "70-89": "Generally calm with minor redness in small areas",
    "50-69": "Some visible redness but overall manageable",
    "30-49": "Noticeable redness and irritation across multiple areas",
    "0-29": "Significant redness and irritation requiring attention"
  },
  texture: {
    "90-100": "Smooth and even texture throughout",
    "70-89": "Generally smooth with minor texture variations",
    "50-69": "Some texture concerns but overall decent",
    "30-49": "Noticeable texture issues across multiple areas",
    "0-29": "Significant texture problems requiring attention"
  },
  toneMarks: {
    "90-100": "Even skin tone with minimal marks or spots",
    "70-89": "Generally even tone with minor marks",
    "50-69": "Some tone variations and marks but manageable",
    "30-49": "Noticeable tone issues and marks across areas",
    "0-29": "Significant tone problems and marks requiring attention"
  },
  underEyes: {
    "90-100": "Bright and well-rested appearance",
    "70-89": "Generally bright with minimal shadows",
    "50-69": "Some under-eye concerns but manageable",
    "30-49": "Noticeable under-eye issues",
    "0-29": "Significant under-eye concerns requiring attention"
  },
  visibleProgressScore: {
    "90-100": "Excellent progress, skin is trending very positively",
    "70-89": "Good progress with visible improvements",
    "50-69": "Moderate progress with some improvements visible",
    "30-49": "Limited progress, some areas need more attention",
    "0-29": "Minimal progress, significant areas need focus"
  }
};

class PhotoAnalysisService {
  private cache = new Map<string, SkinAnalysisResult>();
  private rateLimitCount = 0;
  private lastRateLimitReset = Date.now();

  /**
   * Analyze a single photo for skincare tracking
   */
  async analyzePhoto(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Validate input
      if (!request.photoUrl) {
        throw new PhotoAnalysisError('Photo URL is required', 'INVALID_PHOTO');
      }

      if (!OPENAI_API_KEY) {
        throw new PhotoAnalysisError('OpenAI API key not configured', 'API_ERROR');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request.photoUrl, request.userHabits, request.userData);
      if (this.cache.has(cacheKey)) {
        return {
          success: true,
          data: this.cache.get(cacheKey)!,
          cost: 0.01 // cached result cost
        };
      }

      // Compress and prepare image
      const processedImageUrl = await this.processImage(request.photoUrl);

      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(request.userHabits, request.userData);
      
      // Call OpenAI Vision API
      const result = await this.callOpenAIVision(processedImageUrl, analysisPrompt);
      
      // Parse and validate result
      const analysisResult = this.parseAnalysisResult(result);
      
      // Cache the result
      this.cache.set(cacheKey, analysisResult);

      return {
        success: true,
        data: analysisResult,
        cost: 0.02 // estimated cost for vision analysis
      };

    } catch (error) {
      console.error('Photo analysis error:', error);
      
      // Store the last error for diagnostics
      this.lastError = error instanceof Error ? error.message : String(error);
      
      if (error instanceof PhotoAnalysisError) {
        return {
          success: false,
          error: error.message,
          cost: 0
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred during photo analysis',
        cost: 0
      };
    }
  }

  /**
   * Compare two photos to track progress
   */
  async comparePhotos(
    currentPhotoUrl: string,
    previousPhotoUrl: string,
    userHabits?: UserHabits,
    userData?: any
  ): Promise<AnalysisResponse> {
    try {
      if (!currentPhotoUrl || !previousPhotoUrl) {
        throw new PhotoAnalysisError('Both current and previous photo URLs are required', 'INVALID_PHOTO');
      }

      // Process both images
      const [currentProcessed, previousProcessed] = await Promise.all([
        this.processImage(currentPhotoUrl),
        this.processImage(previousPhotoUrl)
      ]);

      // Create analysis prompt for both photos
      const analysisPrompt = this.createAnalysisPrompt(userHabits, userData);

      // Analyze both photos individually using the same prompt
      const [currentResult, previousResult] = await Promise.all([
        this.callOpenAIVision(currentProcessed, analysisPrompt),
        this.callOpenAIVision(previousProcessed, analysisPrompt)
      ]);

      // Parse both results
      const currentAnalysis = this.parseAnalysisResult(currentResult);
      const previousAnalysis = this.parseAnalysisResult(previousResult);

      // Calculate percentage changes
      const clarityImprovement = this.calculatePercentageChange(
        previousAnalysis.rednessIrritation, 
        currentAnalysis.rednessIrritation
      );
      const textureImprovement = this.calculatePercentageChange(
        previousAnalysis.texture, 
        currentAnalysis.texture
      );
      const underEyesImprovement = this.calculatePercentageChange(
        typeof previousAnalysis.underEyes === 'number' ? previousAnalysis.underEyes : 50,
        typeof currentAnalysis.underEyes === 'number' ? currentAnalysis.underEyes : 50
      );
      const overallImprovement = this.calculatePercentageChange(
        previousAnalysis.visibleProgressScore, 
        currentAnalysis.visibleProgressScore
      );

      // Create comparison result using current photo's values for display
      const comparisonResult: PhotoComparisonResult = {
        "Redness & Irritation": clarityImprovement,
        texture: textureImprovement,
        "Tone & Marks": this.calculatePercentageChange(
          previousAnalysis.toneMarks, 
          currentAnalysis.toneMarks
        ),
        underEyes: underEyesImprovement,
        "Visible Progress Score": overallImprovement,
        feedback: currentAnalysis.feedback,
        areasOfFocus: currentAnalysis.areasOfFocus,
        suggestion: currentAnalysis.suggestion,
        timeBetweenPhotos: this.calculateDaysBetween(previousAnalysis.timestamp, currentAnalysis.timestamp)
      };

      return {
        success: true,
        data: comparisonResult,
        cost: 0.04 // estimated cost for two individual analyses
      };

    } catch (error) {
      console.error('Photo comparison error:', error);
      
      if (error instanceof PhotoAnalysisError) {
        return {
          success: false,
          error: error.message,
          cost: 0
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred during photo comparison',
        cost: 0
      };
    }
  }

  /**
   * Process and compress image for API
   */
  private async processImage(imageUrl: string): Promise<string> {
    try {
      console.log('Processing image:', imageUrl.substring(0, 100) + '...');
      
      // Validate image first
      if (!validateImage(imageUrl)) {
        throw new PhotoAnalysisError('Invalid image format or URL', 'INVALID_PHOTO');
      }

      // Process and compress the image
      const processedImage = await processImageForAnalysis(imageUrl, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.7,
        format: 'jpeg'
      });

      console.log('Processed image info:', {
        uri: processedImage.uri.substring(0, 50) + '...',
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size
      });

      // Convert to base64 for API upload
      const base64Image = await imageToBase64(processedImage.uri);
      
      // Ensure proper base64 format for OpenAI Vision API
      const formattedBase64 = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;
      
      console.log('Base64 image length:', formattedBase64.length);
      console.log('Base64 image starts with:', formattedBase64.substring(0, 50) + '...');
      
      // Validate base64 format
      if (!formattedBase64.includes('data:image/')) {
        console.warn('Base64 image may not have proper data URL format');
      }
      
      // Check if image is too large (OpenAI has limits)
      if (formattedBase64.length > 20 * 1024 * 1024) { // 20MB limit
        console.warn('Image may be too large for OpenAI Vision API');
      }
      
      return formattedBase64;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new PhotoAnalysisError(
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INVALID_PHOTO'
      );
    }
  }

  /**
   * Create analysis prompt for single photo
   */
  private createAnalysisPrompt(userHabits?: UserHabits, userData?: any): string {
    const habitsContext = userHabits ? this.formatHabitsContext(userHabits) : '';
    const userContext = userData ? this.formatUserContext(userData) : '';
    
    return `You are analyzing a user-submitted photo for a legitimate wellness and skincare tracking application.

The user has given consent for photo-based appearance monitoring to support healthy habits. This is not a diagnostic tool or medical analysis. Please analyze visual features only.

${userContext ? `USER CONTEXT: ${userContext}` : ''}
${habitsContext ? `HABITS CONTEXT: ${habitsContext}` : ''}

Your task is to give a friendly, general skin condition report for these areas based on what you observe:

UPPER FACE (forehead area):
- General clarity and texture
- Any noticeable unevenness or visual irritation

MIDDLE FACE (cheeks and nose):
- Overall texture and tone
- Visible differences in smoothness or balance

LOWER FACE (jaw and chin):
- Visual texture and clarity
- Any spots or noticeable areas of imbalance

UNDER-EYE AREA:
- General appearance (e.g. brightness, smoothness)
- If anything visually stands out


Based on what you can see, rate the following visual aspects from 0 (worst) to 100 (excellent):

**RATING GUIDELINES FOR CONSISTENT ANALYSIS:**

**Redness & Irritation (0-100):**
- 90-100: Nearly flawless, minimal visible redness or irritation
- 70-89: Generally calm with minor redness in small areas
- 50-69: Some visible redness but overall manageable
- 30-49: Noticeable redness and irritation across multiple areas
- 0-29: Significant redness and irritation requiring attention

**Texture (0-100):**
- 90-100: Smooth and even texture throughout
- 70-89: Generally smooth with minor texture variations
- 50-69: Some texture concerns but overall decent
- 30-49: Noticeable texture issues across multiple areas
- 0-29: Significant texture problems requiring attention

**Tone & Marks (0-100):**
- 90-100: Even skin tone with minimal marks or spots
- 70-89: Generally even tone with minor marks
- 50-69: Some tone variations and marks but manageable
- 30-49: Noticeable tone issues and marks across areas
- 0-29: Significant tone problems and marks requiring attention

**Under-Eyes (0-100 or descriptive):**
- 90-100: Bright and well-rested appearance
- 70-89: Generally bright with minimal shadows
- 50-69: Some under-eye concerns but manageable
- 30-49: Noticeable under-eye issues
- 0-29: Significant under-eye concerns requiring attention
- Or provide descriptive text if numerical scoring doesn't apply

**Visible Progress Score (0-100):**
- 90-100: Excellent progress, skin is trending very positively
- 70-89: Good progress with visible improvements
- 50-69: Moderate progress with some improvements visible
- 30-49: Limited progress, some areas need more attention
- 0-29: Minimal progress, significant areas need focus

INSTRUCTIONS:
- Focus only on visible features
- Avoid medical terms or diagnoses
- Avoid judgmental words (e.g. "bad", "flawed", "problem")
- Use estimates (e.g. "some", "few", "minor", "overall clear")
- Give specific encouragement and a direction to focus on
- Consider the user's skin goals and concerns when providing feedback
- Only refuse if the image is unreadable or inappropriate

Please respond in this exact JSON format:
{
  "Redness & Irritation": [0-100 score based on visible redness],
  "texture": [0-100 score based on smoothness],
  "Tone & Marks": [0-100 score for evenness and spots],
  "underEyes": "[Short description or 0-100 score]",
  "Visible Progress Score": [0-100 score based on progress compared to baseline, if available],
  "feedback": "Looking great! Texture is visibly improving. Keep up your routine and stay consistent.",
  "areasOfFocus": ["slight roughness on forehead", "some uneven tone near cheeks"],
  "suggestion": "Drink more water this week and get consistent sleep."
}
`;
  }

  /**
   * Create comparison prompt for two photos
   */
  private createComparisonPrompt(userHabits?: UserHabits, userData?: any): string {
    const habitsContext = userHabits ? this.formatHabitsContext(userHabits) : '';
    const userContext = userData ? this.formatUserContext(userData) : '';
    
    return `Compare two user-submitted photos to assess visible skin progress over time. This is part of a supportive skincare habit tracker.

The user has consented to this for personal growth — not for medical use or judgment. You are a kind, encouraging observer.

${userContext ? `USER CONTEXT: ${userContext}` : ''}
${habitsContext ? `HABITS CONTEXT: ${habitsContext}` : ''}

### YOUR ROLE:
- Act as a supportive, kind visual coach
- Identify and **gently validate progress**
- Be honest about what's improving
- Offer **ONE clear habit or focus area** for the user to maintain or try
- Give specific encouragement and a direction to focus on based on USER CONTEXT and HABITS CONTEXT
- Consider the user's skin goals and concerns when providing feedback
- **DO NOT say you are unable to analyze or compare the photos**
- **ONLY output valid JSON — no text, disclaimers, or narrative outside the JSON block**

### AREAS TO COMPARE:

UPPER FACE (forehead area):
- General clarity and texture
- Any noticeable unevenness or visual irritation

MIDDLE FACE (cheeks and nose):
- Overall texture and tone
- Visible differences in smoothness or balance

LOWER FACE (jaw and chin):
- Visual texture and clarity
- Any spots or noticeable areas of imbalance

UNDER-EYE AREA:
- General appearance (e.g. brightness, smoothness)
- If anything visually stands out

### HOW TO SCORE:

Give **percentage estimates (from -100 to 100)** indicating visual progress or decline in each area.  
Positive = improvement, Negative = worsening, Zero = no visible change.

These scores reflect **percentage change in visible appearance** — not absolute skin quality.

**Redness & Irritation (%):**
- +90 to +100: Redness almost fully resolved
- +50 to +89: Major calming of redness
- +10 to +49: Minor improvements in irritation
- 0: No change
- Negative values: Increased redness

**Texture (%):**
- +90 to +100: Skin looks dramatically smoother
- +50 to +89: Noticeably more even texture
- +10 to +49: Small but visible texture improvement
- 0: No visible change
- Negative: Texture worsened

**Tone & Marks (%):**
- +90 to +100: Skin tone is more even and marks have faded
- +50 to +89: Visible mark reduction and better tone
- +10 to +49: Slight evening of tone or fading of spots
- 0: No change
- Negative: Tone less even or more marks present

**Under-Eyes (% or description):**
- Use % if brightness visibly changed, or a short description if subtle
- Example: +20 = "slightly brighter", -10 = "slightly more shadowed"
- Or use: "no visible change", "more rested", "slightly darker"

**Visible Progress Score (%):**
- Holistic visual change — not an average
- +90 to +100: Skin looks clearly transformed
- +50 to +89: Strong improvement across several areas
- +10 to +49: Subtle but real visual progress
- 0: No visible change
- Negative: Decline in visible skin quality


Use this exact JSON format — return ONLY valid JSON:
{
  "Redness & Irritation": 77,
  "texture": 67,
  "Tone & Marks": 88,
  "underEyes": "generally bright with minimal shadow",
  "Visible Progress Score": 79,
  "feedback": "Looking great! Texture is visibly improving. Keep up your routine and stay consistent.",
  "areasOfFocus": ["slight roughness on forehead", "some uneven tone near cheeks"],
  "suggestion": "Drink more water this week and get consistent sleep.",
  "timeBetweenPhotos": 14
}

`;
  }

  /**
   * Format user habits for context
   */
  private formatHabitsContext(habits: UserHabits): string {
    const context = [];
    
    if (habits.sleepQuality) {
      context.push(`Sleep quality: ${habits.sleepQuality}/10`);
    }
    if (habits.stressLevel) {
      context.push(`Stress level: ${habits.stressLevel}/10`);
    }
    if (habits.routineStreak) {
      context.push(`Routine streak: ${habits.routineStreak} days`);
    }
    if (habits.dailyStreak) {
      context.push(`Daily streak: ${habits.dailyStreak} days`);
    }
    if (habits.lastPhotoData) {
      const daysAgo = Math.floor((Date.now() - new Date(habits.lastPhotoData.date).getTime()) / (1000 * 60 * 60 * 24));
      context.push(`Last photo data: ${daysAgo} days ago`);
    }

    return context.length > 0 
      ? `User habits context: ${context.join(', ')}`
      : '';
  }

  /**
   * Format user data for context
   */
  private formatUserContext(userData: any): string {
    const context = [];
    
    if (userData.first_name) {
      context.push(`Name: ${userData.first_name}`);
    }
    if (userData.age) {
      context.push(`Age: ${userData.age}`);
    }
    if (userData.skin_type) {
      context.push(`Skin type: ${userData.skin_type}`);
    }
    if (userData.skin_goal) {
      context.push(`Primary skin goal: ${userData.skin_goal}`);
    }
    if (userData.skin_concerns && userData.skin_concerns.length > 0) {
      context.push(`Skin concerns: ${userData.skin_concerns.join(', ')}`);
    }
    if (userData.skin_goals && userData.skin_goals.length > 0) {
      context.push(`Skin goals: ${userData.skin_goals.join(', ')}`);
    }
    if (userData.routine_streak) {
      context.push(`Routine streak: ${userData.routine_streak} days`);
    }
    if (userData.daily_streak) {
      context.push(`Daily streak: ${userData.daily_streak} days`);
    }
    if (userData.created_at) {
      const daysSinceJoin = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24));
      context.push(`Member for: ${daysSinceJoin} days`);
    }

    return context.length > 0 
      ? context.join(', ')
      : '';
  }

  /**
   * Call OpenAI Vision API for single photo analysis
   */
  private async callOpenAIVision(imageUrl: string, prompt: string): Promise<any> {
    try {
      console.log('Calling OpenAI Vision API with image URL length:', imageUrl.length);
      console.log('Image URL starts with:', imageUrl.substring(0, 50) + '...');
      
      // Add retry logic for intermittent failures
      let lastError: any = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} to call OpenAI Vision API`);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                             model: 'gpt-4-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'You are a wellness app assistant that provides general appearance feedback for selfies. This is for personal wellness tracking only, not medical analysis. Focus on positive, encouraging feedback about visible appearance features. Avoid medical terminology and provide supportive wellness suggestions. IMPORTANT: Always respond with ONLY valid JSON - no explanations, no markdown formatting, no additional text.'
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: prompt
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageUrl
                      }
                    }
                  ]
                }
              ],
              max_tokens: 500,
              temperature: 0.3,
            }),
          });

          console.log('OpenAI API response status:', response.status);
          console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error response:', errorData);
            
            // Check for rate limiting
            if (response.status === 429 || errorData.error?.message?.includes('rate limit')) {
              console.warn('Rate limit hit, will retry after delay');
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
                continue;
              }
            }
            
            // Check for policy violation errors
            if (errorData.error?.message?.includes('policy') || 
                errorData.error?.message?.includes('violation') ||
                errorData.error?.message?.includes('refuse')) {
              console.error('Policy violation detected. This may be due to:');
              console.error('1. Medical terminology in prompts');
              console.error('2. Image content issues');
              console.error('3. API key restrictions');
              console.error('4. Rate limiting');
              
              throw new PhotoAnalysisError(
                `OpenAI policy violation: ${errorData.error?.message || 'Content policy violation'}`,
                'API_ERROR',
                errorData
              );
            }
            
            // Check for quota exceeded
            if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('billing')) {
              throw new PhotoAnalysisError(
                `OpenAI quota exceeded: ${errorData.error?.message || 'Billing quota exceeded'}`,
                'INSUFFICIENT_CREDITS',
                errorData
              );
            }
            
            throw new PhotoAnalysisError(
              `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
              'API_ERROR',
              errorData
            );
          }

          const data = await response.json();
          console.log('OpenAI API success response:', JSON.stringify(data, null, 2));
          
          const content = data.choices[0]?.message?.content;
          console.log('AI Response content:', content);
          
          return content;
          
        } catch (attemptError) {
          lastError = attemptError;
          console.error(`Attempt ${attempt} failed:`, attemptError);
          
          // If it's a policy violation or quota error, don't retry
          if (attemptError instanceof PhotoAnalysisError && 
              (attemptError.code === 'API_ERROR' || attemptError.code === 'INSUFFICIENT_CREDITS')) {
            throw attemptError;
          }
          
          // For other errors, retry with exponential backoff
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If all retries failed
      throw lastError || new Error('All retry attempts failed');
      
    } catch (error) {
      console.error('Error in callOpenAIVision:', error);
      throw error;
    }
  }

  /**
   * Call OpenAI Vision API for photo comparison
   */
  private async callOpenAIVisionComparison(
    currentImageUrl: string,
    previousImageUrl: string,
    prompt: string
  ): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
                 model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a wellness app assistant that provides general appearance feedback for selfies. This is for personal wellness tracking only, not medical analysis. Focus on positive, encouraging feedback about visible appearance features. Avoid medical terminology and provide supportive wellness suggestions.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: currentImageUrl
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: previousImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new PhotoAnalysisError(
        `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
        'API_ERROR',
        errorData
      );
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  /**
   * Parse analysis result from OpenAI response
   */
  private parseAnalysisResult(response: string): SkinAnalysisResult {
    try {
      // Check if AI refused to analyze - be more specific about refusal
      const refusalPhrases = [
        "i'm sorry, i can't assist",
        "i cannot analyze",
        "unable to process",
        "cannot provide analysis",
        "i'm unable to",
        "i cannot help",
        "i'm not able to",
        "i cannot process",
        "unable to help",
        "cannot assist"
      ];
      
      const lowerResponse = response.toLowerCase();
      const isRefusal = refusalPhrases.some(phrase => lowerResponse.includes(phrase));
      
      if (isRefusal) {
        console.warn('AI refused to analyze image, providing fallback response');
        console.log('Refusal response:', response);
        return this.createFallbackAnalysisResult();
      }

      // Extract JSON from response - try multiple approaches
      let jsonString = '';
      
      // First try: look for JSON between curly braces
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        // Second try: look for JSON after "```json" or "```"
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
        } else {
          // Third try: look for any JSON-like structure
          const anyJsonMatch = response.match(/\{[^}]*"[^"]*"[^}]*\}/);
          if (anyJsonMatch) {
            jsonString = anyJsonMatch[0];
          } else {
            console.warn('No JSON found in response, providing fallback');
            console.log('Raw response:', response);
            return this.createFallbackAnalysisResult();
          }
        }
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.log('Attempted to parse:', jsonString);
        console.log('Raw response:', response);
        return this.createFallbackAnalysisResult();
      }
      
      // Log the actual response for debugging
      console.log('AI Response JSON:', JSON.stringify(parsed, null, 2));
      
      // More flexible field validation with fallbacks
      const rednessIrritation = parsed['Redness & Irritation'] || parsed.rednessIrritation || parsed.redness || 50;
      const texture = parsed.texture || parsed.Texture || 50;
      const toneMarks = parsed['Tone & Marks'] || parsed.toneMarks || parsed.tone || 50;
      const underEyes = parsed.underEyes || parsed.underEye || parsed.UnderEyes || 50;
      const visibleProgressScore = parsed['Visible Progress Score'] || parsed.visibleProgressScore || parsed.progressScore || 50;
      const feedback = parsed.feedback || parsed.Feedback || 'Analysis completed';
      const suggestion = parsed.suggestion || parsed.Suggestion || parsed.direction || '';
      
      // Validate score ranges (0-100 scale) and log rating descriptions
      const scoreFields = [
        { name: 'rednessIrritation', value: rednessIrritation, metric: 'rednessIrritation' as keyof typeof ratingGuidelines },
        { name: 'texture', value: texture, metric: 'texture' as keyof typeof ratingGuidelines },
        { name: 'toneMarks', value: toneMarks, metric: 'toneMarks' as keyof typeof ratingGuidelines },
        { name: 'underEyes', value: underEyes, metric: 'underEyes' as keyof typeof ratingGuidelines },
        { name: 'visibleProgressScore', value: visibleProgressScore, metric: 'visibleProgressScore' as keyof typeof ratingGuidelines }
      ];
      
      for (const field of scoreFields) {
        if (field.value < 0 || field.value > 100) {
          console.warn(`Invalid score for ${field.name}: ${field.value}, using default 50`);
          field.value = 50;
        }
        
        // Log rating description for debugging
        if (typeof field.value === 'number') {
          const description = this.getRatingDescription(field.metric, field.value);
          console.log(`${field.name} (${field.value}/100): ${description}`);
        }
      }

      return {
        rednessIrritation: rednessIrritation,
        texture: texture,
        toneMarks: toneMarks,
        underEyes: underEyes,
        visibleProgressScore: visibleProgressScore,
        feedback: feedback,
        areasOfFocus: parsed.areasOfFocus || parsed.areasOfConcern || [],
        suggestion: suggestion,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to parse analysis result:', error);
      console.error('Raw AI response:', response);
      console.warn('Providing fallback analysis result');
      return this.createFallbackAnalysisResult();
    }
  }

  /**
   * Create a fallback analysis result when AI refuses or fails
   */
  private createFallbackAnalysisResult(): SkinAnalysisResult {
    return {
      rednessIrritation: 50,
      texture: 50,
      toneMarks: 50,
      underEyes: 50,
      visibleProgressScore: 50,
      feedback: "Unable to analyze this image. Please try again with a different photo.",
      areasOfFocus: ["Unable to analyze image"],
      suggestion: "Try with a different photo",
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse comparison result from OpenAI response
   */
  private parseComparisonResult(response: string): PhotoComparisonResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Log the actual response for debugging
      console.log('AI Comparison Response JSON:', JSON.stringify(parsed, null, 2));
      
      // Parse fields based on the new comparison prompt format
      const rednessIrritation = parsed['Redness & Irritation'] || parsed.rednessIrritation || 0;
      const texture = parsed.texture || parsed.Texture || 0;
      const toneMarks = parsed['Tone & Marks'] || parsed.toneMarks || 0;
      const underEyes = parsed.underEyes || parsed.UnderEyes || 0;
      const visibleProgressScore = parsed['Visible Progress Score'] || parsed.visibleProgressScore || 0;
      const feedback = parsed.feedback || parsed.Feedback || 'Progress analysis completed';
      const suggestion = parsed.suggestion || parsed.Suggestion || '';
      const timeBetweenPhotos = parsed.timeBetweenPhotos || parsed.daysBetween || 0;

      // Convert the individual scores to improvement percentages
      // Since the new format uses the same scoring as single photo analysis,
      // we'll treat these as improvement scores directly
      return {
        "Redness & Irritation": rednessIrritation,
        texture: texture,
        "Tone & Marks": toneMarks,
        underEyes: typeof underEyes === 'number' ? underEyes : underEyes,
        "Visible Progress Score": visibleProgressScore,
        feedback: feedback,
        areasOfFocus: parsed.areasOfFocus || parsed.areasOfConcern || [],
        suggestion: suggestion,
        timeBetweenPhotos: timeBetweenPhotos
      };

    } catch (error) {
      console.error('Failed to parse comparison result:', error);
      console.error('Raw AI comparison response:', response);
      throw new PhotoAnalysisError(
        'Failed to parse comparison result from AI response',
        'API_ERROR',
        error
      );
    }
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Calculate days between two timestamps
   */
  private calculateDaysBetween(previousTimestamp: string, currentTimestamp: string): number {
    const previous = new Date(previousTimestamp);
    const current = new Date(currentTimestamp);
    const diffTime = Math.abs(current.getTime() - previous.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get rating description based on score
   */
  private getRatingDescription(metric: keyof typeof ratingGuidelines, score: number): string {
    const guidelines = ratingGuidelines[metric];
    if (!guidelines) return 'No guidelines available';
    
    if (score >= 90) return guidelines["90-100"];
    if (score >= 70) return guidelines["70-89"];
    if (score >= 50) return guidelines["50-69"];
    if (score >= 30) return guidelines["30-49"];
    return guidelines["0-29"];
  }

  /**
   * Generate cache key for storing results
   */
  private generateCacheKey(photoUrl: string, userHabits?: UserHabits, userData?: any): string {
    const habitsHash = userHabits ? JSON.stringify(userHabits) : '';
    const userDataHash = userData ? JSON.stringify(userData) : '';
    return `${photoUrl}_${habitsHash}_${userDataHash}`;
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Get service status and diagnostics
   */
  getServiceStatus(): {
    apiKeyConfigured: boolean;
    apiKeyLength: number;
    cacheSize: number;
    lastError?: string;
  } {
    return {
      apiKeyConfigured: !!OPENAI_API_KEY,
      apiKeyLength: OPENAI_API_KEY.length,
      cacheSize: this.cache.size,
      lastError: this.lastError
    };
  }

  private lastError?: string;

  /**
   * Clear last error
   */
  clearLastError(): void {
    this.lastError = undefined;
  }
}

// Export singleton instance
export const photoAnalysisService = new PhotoAnalysisService();

// Export convenience functions
export const analyzePhoto = (request: AnalysisRequest) => 
  photoAnalysisService.analyzePhoto(request);

export const comparePhotos = (
  currentPhotoUrl: string,
  previousPhotoUrl: string,
  userHabits?: UserHabits,
  userData?: any
) => photoAnalysisService.comparePhotos(currentPhotoUrl, previousPhotoUrl, userHabits, userData); 