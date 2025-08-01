import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface PhotoUploadProps {
  onPhotoTaken: (uri: string) => void;
  onRetake?: () => void;
  photoUri?: string;
  disabled?: boolean;
}

export function PhotoUpload({ onPhotoTaken, onRetake, photoUri, disabled }: PhotoUploadProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (disabled) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoTaken(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors.light.text }]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors.light.text }]}>
          No access to camera
        </Text>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={onRetake}
            disabled={disabled}
          >
            <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <View style={styles.guideFrame} />
        <Text style={styles.guideText}>Tap to take your daily photo</Text>
        
        <TouchableOpacity
          style={[
            styles.captureButton, 
            { backgroundColor: Colors.light.tint },
            disabled && styles.disabledButton
          ]}
          onPress={takePicture}
          disabled={disabled}
        >
          <IconSymbol name="camera.fill" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 20,
  },
  guideFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 125,
    opacity: 0.8,
    marginBottom: 20,
  },
  guideText: {
    color: Colors.light.text,
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.text,
  },
}); 
