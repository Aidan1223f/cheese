import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  console.log('SignInScreen: Component rendered');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [skinGoal, setSkinGoal] = useState('');
  const [loading, setLoading] = useState(false);
  
  const passwordRef = useRef<TextInput>(null);
  const skinGoalRef = useRef<TextInput>(null);
  
  const colorScheme = useColorScheme();
  const { signIn, signUp } = useSupabase();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handleSubmit = async () => {
    console.log('handleSubmit called', { email, password, isSignUp, skinGoal });
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !skinGoal) {
      Alert.alert('Error', 'Please tell us about your skin goal');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
      } else {
        console.log('Calling signIn', { email, password });
        const { data, error } = await signIn(email, password);
        console.log('signIn result', { data, error });
        if (error) throw error;
        Alert.alert('Success', 'Signed in successfully!');
        router.replace('/checkin');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingHorizontal: Math.max(20, width * 0.08) }]}>
          <View style={styles.header}>
            <IconSymbol name="sparkles" size={Math.max(60, width * 0.13)} color={Colors.light.tint} />
            <Text style={[styles.title, { color: Colors.light.text, fontSize: Math.max(28, width * 0.07) }]}>
              Cleanse
            </Text>
            <Text style={[styles.subtitle, { color: Colors.light.text, fontSize: Math.max(16, width * 0.045) }]}>
              {isSignUp ? 'Create your account to start your skincare journey' : 'Habitualize your skincare routine.'}
            </Text>
          </View>

          <View style={[styles.form, { width: '100%', maxWidth: 420, alignSelf: 'center' }]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors.light.background,
                  borderColor: Colors.light.tint,
                  color: Colors.light.text,
                  fontSize: Math.max(16, width * 0.045),
                  paddingVertical: Math.max(14, width * 0.035),
                  paddingHorizontal: Math.max(16, width * 0.04),
                },
              ]}
              placeholder="Email"
              placeholderTextColor={Colors.light.text + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                {
                  backgroundColor: Colors.light.background,
                  borderColor: Colors.light.tint,
                  color: Colors.light.text,
                  fontSize: Math.max(16, width * 0.045),
                  paddingVertical: Math.max(14, width * 0.035),
                  paddingHorizontal: Math.max(16, width * 0.04),
                },
              ]}
              placeholder="Password"
              placeholderTextColor={Colors.light.text + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType={isSignUp ? "next" : "done"}
              onSubmitEditing={() => {
                if (isSignUp) {
                  skinGoalRef.current?.focus();
                } else {
                  handleSubmit();
                }
              }}
              blurOnSubmit={!isSignUp}
            />

            {isSignUp && (
              <TextInput
                ref={skinGoalRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.light.background,
                    borderColor: Colors.light.tint,
                    color: Colors.light.text,
                    fontSize: Math.max(16, width * 0.045),
                    paddingVertical: Math.max(14, width * 0.035),
                    paddingHorizontal: Math.max(16, width * 0.04),
                  },
                ]}
                placeholder="What's your main skin goal? (e.g., clear acne, anti-aging, hydration)"
                placeholderTextColor={Colors.light.text + '80'}
                value={skinGoal}
                onChangeText={setSkinGoal}
                multiline
                numberOfLines={2}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={true}
              />
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: Colors.light.tint,
                  borderColor: Colors.light.text,
                  borderWidth: 1,
                  paddingVertical: Math.max(16, width * 0.04),
                  borderRadius: Math.max(12, width * 0.03),
                },
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitButtonText, { fontSize: Math.max(18, width * 0.05), color: '#fff', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }]}> 
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, { backgroundColor: 'transparent' }]}
              onPress={() => {
                if (isSignUp) {
                  setIsSignUp(false);
                } else {
                  router.push('/signup');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchText, { color: Colors.light.tint, fontSize: Math.max(16, width * 0.045), textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 1 }]}> 
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
