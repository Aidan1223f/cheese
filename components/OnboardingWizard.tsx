import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface OnboardingData {
  first_name: string;
  age: string;
  skin_type: string;
  skin_concerns: string[];
  concerns_duration: string;
  skin_goals: string[];
  has_routine: boolean | null;
  allergies: string;
}

const skinTypes = [
  'Normal',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive',
  'Acne-prone',
];

const skinConcerns = [
  'Acne',
  'Dark spots',
  'Fine lines',
  'Wrinkles',
  'Uneven skin tone',
  'Redness',
  'Dryness',
  'Oiliness',
  'Large pores',
  'Scarring',
];

const concernDurations = [
  'Less than 6 months',
  '6 months to 1 year',
  '1-3 years',
  '3-5 years',
  'More than 5 years',
];

const skinGoals = [
  'Clear acne',
  'Reduce dark spots',
  'Anti-aging',
  'Even skin tone',
  'Hydration',
  'Oil control',
  'Sensitive skin care',
  'Brightening',
];

export default function OnboardingWizard() {
  const colorScheme = useColorScheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    first_name: '',
    age: '',
    skin_type: '',
    skin_concerns: [],
    concerns_duration: '',
    skin_goals: [],
    has_routine: null,
    allergies: '',
  });

  const { user, updateUser } = useSupabase();
  const router = useRouter();

  const updateField = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'skin_concerns' | 'skin_goals', value: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const onboardingData = {
        first_name: data.first_name,
        age: parseInt(data.age) || undefined,
        skin_type: data.skin_type,
        skin_concerns: data.skin_concerns,
        concerns_duration: data.concerns_duration,
        skin_goals: data.skin_goals,
        has_routine: data.has_routine ?? undefined,
        allergies: data.allergies,
        onboarding_completed: true,
      };

      await updateUser(onboardingData);
      router.replace('/checkin');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save onboarding data');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your name?</Text>
            <TextInput
              style={styles.textInput}
              value={data.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              placeholder="Enter your first name"
              autoFocus
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>How old are you?</Text>
            <TextInput
              style={styles.textInput}
              value={data.age}
              onChangeText={(value) => updateField('age', value)}
              placeholder="Enter your age"
              keyboardType="numeric"
              autoFocus
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your skin type?</Text>
            <ScrollView style={styles.optionsContainer}>
              {skinTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    data.skin_type === type && { 
                      backgroundColor: Colors.light.tint,
                      borderColor: Colors.light.tint
                    }
                  ]}
                  onPress={() => updateField('skin_type', type)}
                >
                  <Text style={[
                    styles.optionText,
                    data.skin_type === type && styles.selectedOptionText
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Do you experience any of the following regularly?</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>
            <ScrollView style={styles.optionsContainer}>
              {skinConcerns.map((concern) => (
                <TouchableOpacity
                  key={concern}
                  style={[
                    styles.optionButton,
                    data.skin_concerns.includes(concern) && styles.selectedOption
                  ]}
                  onPress={() => toggleArrayField('skin_concerns', concern)}
                >
                  <Text style={[
                    styles.optionText,
                    data.skin_concerns.includes(concern) && styles.selectedOptionText
                  ]}>
                    {concern}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>How long have you had these concerns?</Text>
            <ScrollView style={styles.optionsContainer}>
              {concernDurations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.optionButton,
                    data.concerns_duration === duration && styles.selectedOption
                  ]}
                  onPress={() => updateField('concerns_duration', duration)}
                >
                  <Text style={[
                    styles.optionText,
                    data.concerns_duration === duration && styles.selectedOptionText
                  ]}>
                    {duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your main skincare goal?</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>
            <ScrollView style={styles.optionsContainer}>
              {skinGoals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionButton,
                    data.skin_goals.includes(goal) && styles.selectedOption
                  ]}
                  onPress={() => toggleArrayField('skin_goals', goal)}
                >
                  <Text style={[
                    styles.optionText,
                    data.skin_goals.includes(goal) && styles.selectedOptionText
                  ]}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Do you follow a skincare routine?</Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  data.has_routine === true && styles.selectedOption
                ]}
                onPress={() => updateField('has_routine', true)}
              >
                <Text style={[
                  styles.optionText,
                  data.has_routine === true && styles.selectedOptionText
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  data.has_routine === false && styles.selectedOption
                ]}
                onPress={() => updateField('has_routine', false)}
              >
                <Text style={[
                  styles.optionText,
                  data.has_routine === false && styles.selectedOptionText
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Do you have any allergies?</Text>
            <Text style={styles.subtitle}>Leave blank if none</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={data.allergies}
              onChangeText={(value) => updateField('allergies', value)}
              placeholder="Enter any allergies (e.g., nuts, dairy, specific ingredients)"
              multiline
              numberOfLines={4}
              autoFocus
            />
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.first_name.trim().length > 0;
      case 1:
        return data.age.trim().length > 0 && !isNaN(parseInt(data.age));
      case 2:
        return data.skin_type.length > 0;
      case 3:
        return data.skin_concerns.length > 0;
      case 4:
        return data.concerns_duration.length > 0;
      case 5:
        return data.skin_goals.length > 0;
      case 6:
        return data.has_routine !== null;
      case 7:
        return true; // Allergies are optional
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of 8
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${((currentStep + 1) / 8) * 100}%`,
                backgroundColor: Colors.light.tint
              }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: Colors.light.tint },
            !canProceed() && styles.disabledButton
          ]}
          onPress={nextStep}
          disabled={!canProceed()}
        >
          <Text style={[
            styles.nextButtonText,
            !canProceed() && styles.disabledButtonText
          ]}>
            {currentStep === 7 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  yesNoButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  nextButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#999',
  },
}); 
