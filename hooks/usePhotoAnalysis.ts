import { useCallback, useState } from 'react';
import {
  analyzePhoto,
  comparePhotos,
  photoAnalysisService,
  type AnalysisRequest,
  type PhotoComparisonResult,
  type SkinAnalysisResult,
  type UserHabits
} from '../services/photoAnalysisService';
import { useUserHabits } from './useUserHabits';

export interface UsePhotoAnalysisReturn {
  // Analysis state
  analyzing: boolean;
  comparing: boolean;
  
  // Results
  analysisResult: SkinAnalysisResult | null;
  comparisonResult: PhotoComparisonResult | null;
  
  // Errors
  analysisError: string | null;
  comparisonError: string | null;
  
  // Actions
  analyzePhoto: (request: AnalysisRequest) => Promise<void>;
  comparePhotos: (
    currentPhotoUrl: string, 
    previousPhotoUrl: string, 
    userHabits?: UserHabits,
    userData?: any,
    currentPhotoTimestamp?: string,
    previousPhotoTimestamp?: string
  ) => Promise<void>;
  
  // Utilities
  clearResults: () => void;
  clearErrors: () => void;
  getCacheStats: () => { size: number; keys: string[] };
  clearCache: () => void;
}

export function usePhotoAnalysis(userId?: string): UsePhotoAnalysisReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<PhotoComparisonResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  
  // Get real user habits from Supabase
  const { habits: userHabits, loading: habitsLoading, error: habitsError } = useUserHabits(userId);

  const handleAnalyzePhoto = useCallback(async (request: AnalysisRequest) => {
    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Use real user habits from Supabase if not provided in request
      const finalRequest = {
        ...request,
        userHabits: request.userHabits || userHabits
      };
      
      const response = await analyzePhoto(finalRequest);
      
      if (response.success && response.data) {
        setAnalysisResult(response.data as SkinAnalysisResult);
        setAnalysisError(null);
      } else {
        setAnalysisError(response.error || 'Analysis failed');
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('Photo analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setAnalysisResult(null);
    } finally {
      setAnalyzing(false);
    }
  }, [userHabits]);

  const handleComparePhotos = useCallback(async (
    currentPhotoUrl: string,
    previousPhotoUrl: string,
    providedUserHabits?: UserHabits,
    userData?: any,
    currentPhotoTimestamp?: string,
    previousPhotoTimestamp?: string
  ) => {
    setComparing(true);
    setComparisonError(null);
    
    try {
      // Use real user habits from Supabase if not provided
      const finalUserHabits = providedUserHabits || userHabits;
      
      const response = await comparePhotos(
        currentPhotoUrl, 
        previousPhotoUrl, 
        finalUserHabits,
        userData,
        currentPhotoTimestamp,
        previousPhotoTimestamp
      );
      
      if (response.success && response.data) {
        setComparisonResult(response.data as PhotoComparisonResult);
        setComparisonError(null);
      } else {
        setComparisonError(response.error || 'Comparison failed');
        setComparisonResult(null);
      }
    } catch (error) {
      console.error('Photo comparison error:', error);
      setComparisonError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setComparisonResult(null);
    } finally {
      setComparing(false);
    }
  }, [userHabits]);

  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    setComparisonResult(null);
  }, []);

  const clearErrors = useCallback(() => {
    setAnalysisError(null);
    setComparisonError(null);
  }, []);

  const getCacheStats = useCallback(() => {
    return photoAnalysisService.getCacheStats();
  }, []);

  const clearCache = useCallback(() => {
    photoAnalysisService.clearCache();
  }, []);

  return {
    analyzing,
    comparing,
    analysisResult,
    comparisonResult,
    analysisError,
    comparisonError,
    analyzePhoto: handleAnalyzePhoto,
    comparePhotos: handleComparePhotos,
    clearResults,
    clearErrors,
    getCacheStats,
    clearCache,
  };
} 