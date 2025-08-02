import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProgressDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.light.text }]}>
          Progress
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.light.text }]}>
          Your future self is waiting for you
        </Text>
        
        <View style={[styles.imagePlaceholder, { backgroundColor: Colors.light.cardBackground }]}>
          <IconSymbol name="photo" size={60} color={Colors.light.text} />
          <Text style={[styles.placeholderText, { color: Colors.light.text }]}>
            Image placeholder
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
  },
  imagePlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
    opacity: 0.6,
  },
}); 