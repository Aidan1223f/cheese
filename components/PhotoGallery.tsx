import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PhotoGalleryProps {
  photos: string[];
  style?: any;
}

export function PhotoGallery({ photos, style }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const { width: screenWidth } = Dimensions.get('window');

  const openPhotoModal = (index: number) => {
    setSelectedPhoto(index);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const goToNextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

  const goToPreviousPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoContainer}
            onPress={() => openPhotoModal(index)}
          >
            <Image source={{ uri: photo }} style={styles.photo} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Full-screen photo modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closePhotoModal}
          >
            <IconSymbol name="xmark.circle.fill" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
          >
            {photos.map((photo, index) => (
              <View key={index} style={styles.modalPhotoContainer}>
                <Image source={{ uri: photo }} style={styles.modalPhoto} />
              </View>
            ))}
          </ScrollView>
          
          {photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {selectedPhoto !== null ? selectedPhoto + 1 : 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  photoContainer: {
    marginRight: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPhotoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPhoto: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
    resizeMode: 'contain',
  },
  photoCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 