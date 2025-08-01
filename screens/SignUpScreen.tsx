import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useSupabase } from '../hooks/useSupabase';

export default function SignUpScreen() {
  const { signUp } = useSupabase();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account');
      } else {
        router.replace('/onboarding');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <Text style={styles.label}>Email</Text>
      <TextInput 
        style={styles.input}
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter your email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        blurOnSubmit={false}
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput 
        ref={passwordRef}
        style={styles.input}
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry
        placeholder="Enter your password"
        returnKeyType="done"
        onSubmitEditing={handleSignUp}
        blurOnSubmit={true}
      />
      
      <Button 
        title={loading ? "Creating Account..." : "Sign Up"} 
        onPress={handleSignUp}
        disabled={loading}
      />
      
      <Button 
        title="Already have an account? Sign In" 
        onPress={() => router.replace('/auth')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
