import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis';
import { PhotoComparisonResult, SkinAnalysisResult } from '../services/photoAnalysisService';

interface PhotoAnalysisDemoProps {
  userId?: string;
}

export function PhotoAnalysisDemo({ userId }: PhotoAnalysisDemoProps) {
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [previousPhoto, setPreviousPhoto] = useState<string | null>(null);

  const {
    analyzing,
    comparing,
    analysisResult,
    comparisonResult,
    analysisError,
    comparisonError,
    analyzePhoto,
    comparePhotos,
    clearResults,
    clearErrors,
  } = usePhotoAnalysis(userId);

  const pickImage = async (isPrevious: boolean = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        if (isPrevious) {
          setPreviousPhoto(photoUri);
        } else {
          setCurrentPhoto(photoUri);
        }
        
        // Clear previous results when new photo is selected
        clearResults();
        clearErrors();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!currentPhoto) {
      Alert.alert('Error', 'Please select a photo first');
      return;
    }

    await analyzePhoto({
      photoUrl: currentPhoto,
      userId,
    });
  };

  const handleComparePhotos = async () => {
    if (!currentPhoto || !previousPhoto) {
      Alert.alert('Error', 'Please select both current and previous photos');
      return;
    }

    await comparePhotos(currentPhoto, previousPhoto);
  };

  const renderScoreBar = (score: number | string, label: string) => (
    <View style={styles.scoreContainer}>
      <Text style={styles.scoreLabel}>{label}</Text>
      {typeof score === 'number' ? (
        <>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreFill, 
                { width: `${score}%` }
              ]} 
            />
          </View>
          <Text style={styles.scoreText}>{score}/100</Text>
        </>
      ) : (
        <Text style={styles.descriptionText}>{score}</Text>
      )}
    </View>
  );

  const renderAnalysisResult = (result: SkinAnalysisResult) => (
    <View style={styles.resultContainer}>
      <Text style={styles.resultTitle}>Analysis Results</Text>
      
      <View style={styles.scoresContainer}>
        {renderScoreBar(result.rednessIrritation, 'Redness & Irritation')}
        {renderScoreBar(result.texture, 'Texture')}
        {renderScoreBar(result.toneMarks, 'Tone & Marks')}
        {renderScoreBar(result.underEyes, 'Under-Eyes')}
        {renderScoreBar(result.visibleProgressScore, 'Progress Score')}
      </View>

      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>Feedback</Text>
        <Text style={styles.feedbackText}>{result.feedback}</Text>
      </View>

      {result.areasOfFocus.length > 0 && (
        <View style={styles.concernsContainer}>
          <Text style={styles.concernsTitle}>Focus Areas</Text>
          {result.areasOfFocus.map((concern: string, index: number) => (
            <Text key={index} style={styles.concernText}>• {concern}</Text>
          ))}
        </View>
      )}

      {result.suggestion && (
        <View style={styles.directionContainer}>
          <Text style={styles.directionTitle}>Suggestion</Text>
          <Text style={styles.directionText}>{result.suggestion}</Text>
        </View>
      )}
    </View>
  );

  const renderComparisonResult = (result: PhotoComparisonResult) => (
    <View style={styles.resultContainer}>
      <Text style={styles.resultTitle}>Progress Comparison</Text>
      
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Clarity</Text>
          <Text style={[
            styles.comparisonValue,
            { color: result.clarityImprovement >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {result.clarityImprovement >= 0 ? '+' : ''}{result.clarityImprovement}%
          </Text>
        </View>
        
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Texture</Text>
          <Text style={[
            styles.comparisonValue,
            { color: result.textureImprovement >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {result.textureImprovement >= 0 ? '+' : ''}{result.textureImprovement}%
          </Text>
        </View>
        
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Overall</Text>
          <Text style={[
            styles.comparisonValue,
            { color: result.overallImprovement >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {result.overallImprovement >= 0 ? '+' : ''}{result.overallImprovement}%
          </Text>
        </View>
      </View>

      <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Under-Eyes</Text>
          <Text style={[
            styles.comparisonValue,
            { color: result.underEyesImprovement >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {result.underEyesImprovement >= 0 ? '+' : ''}{result.underEyesImprovement}%
          </Text>
        </View>

      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>Progress Feedback</Text>
        <Text style={styles.feedbackText}>{result.comparisonFeedback}</Text>
      </View>

      {result.timeBetweenPhotos > 0 && (
        <Text style={styles.timeText}>
          Time between photos: {result.timeBetweenPhotos} days
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Photo Analysis Demo</Text>
      
      {/* Photo Selection */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>Select Photos</Text>
        
        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={() => pickImage(false)}
          >
            <Text style={styles.photoButtonText}>
              {currentPhoto ? 'Change Current Photo' : 'Select Current Photo'}
            </Text>
          </TouchableOpacity>
          
          {currentPhoto && (
            <Image source={{ uri: currentPhoto }} style={styles.photoPreview} />
          )}
        </View>

        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={() => pickImage(true)}
          >
            <Text style={styles.photoButtonText}>
              {previousPhoto ? 'Change Previous Photo' : 'Select Previous Photo (Optional)'}
            </Text>
          </TouchableOpacity>
          
          {previousPhoto && (
            <Image source={{ uri: previousPhoto }} style={styles.photoPreview} />
          )}
        </View>
      </View>

      {/* Analysis Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={[styles.actionButton, !currentPhoto && styles.actionButtonDisabled]}
          onPress={handleAnalyzePhoto}
          disabled={!currentPhoto || analyzing}
        >
          {analyzing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Analyze Photo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            (!currentPhoto || !previousPhoto) && styles.actionButtonDisabled
          ]}
          onPress={handleComparePhotos}
          disabled={!currentPhoto || !previousPhoto || comparing}
        >
          {comparing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Compare Photos</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {(analysisError || comparisonError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>
            {analysisError || comparisonError}
          </Text>
        </View>
      )}

      {/* Results Display */}
      {analysisResult && renderAnalysisResult(analysisResult)}
      {comparisonResult && renderComparisonResult(comparisonResult)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  photoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  scoresContainer: {
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  scoreText: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    color: '#333',
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  concernsContainer: {
    marginBottom: 16,
  },
  concernsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#F44336',
  },
  concernText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 4,
  },
  improvementsContainer: {
    marginBottom: 16,
  },
  improvementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4CAF50',
  },
  improvementText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 4,
  },
  comparisonContainer: {
    marginBottom: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  directionContainer: {
    marginBottom: 16,
  },
  directionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2196F3',
  },
  directionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontStyle: 'italic',
  },
}); 