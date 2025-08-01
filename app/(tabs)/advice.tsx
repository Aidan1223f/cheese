import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRAGAgent } from '@/hooks/useRAGAgent';
import { useSupabase } from '@/hooks/useSupabase';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AdviceScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(true);
  
  const colorScheme = useColorScheme();
  const { user } = useSupabase();
  const { generateContextualAdvice, getQuickInsights, isLoading } = useRAGAgent();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    try {
      const userInsights = await getQuickInsights();
      setInsights(userInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      const aiResponse = await generateContextualAdvice(inputText.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating advice:', error);
      Alert.alert('Error', 'Failed to generate advice. Please try again.');
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (!user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const aiResponse = await generateContextualAdvice(question);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating advice:', error);
      Alert.alert('Error', 'Failed to generate advice. Please try again.');
    }
  };

  const getQuickQuestions = () => {
    const questions = [
      "How can I improve my current routine?",
      "What products should I add for my skin type?",
      "Why is my skin feeling different lately?",
      "How can I address my specific concerns?",
    ];
    return questions;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.centerContent}>
          <IconSymbol name="person.crop.circle" size={60} color={Colors.light.tint} />
          <Text style={[styles.emptyTitle, { color: Colors.light.text }]}>Sign in for personalized advice</Text>
          <Text style={[styles.emptyText, { color: Colors.light.text }]}>
            Get context-aware skincare recommendations based on your profile and habits
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: Colors.light.text }]}>Personalized Advice</Text>
              <Text style={[styles.subtitle, { color: Colors.light.text }]}>
                Get context-aware skincare recommendations
              </Text>
            </View>

            {showInsights && insights.length > 0 && (
              <View style={styles.insightsSection}>
                <View style={styles.insightsHeader}>
                  <Text style={[styles.insightsTitle, { color: Colors.light.text }]}>Quick Insights</Text>
                  <TouchableOpacity onPress={() => setShowInsights(false)}>
                    <IconSymbol name="xmark.circle.fill" size={20} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={insights}
                  renderItem={({ item }) => (
                    <View style={[styles.insightCard, { backgroundColor: Colors.light.cardBackground }]}>
                      <IconSymbol name="lightbulb.fill" size={16} color={Colors.light.tint} />
                      <Text style={[styles.insightText, { color: Colors.light.text }]}>{item}</Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.insightsList}
                />
              </View>
            )}

            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <IconSymbol name="brain.head.profile" size={60} color={Colors.light.tint} />
                <Text style={[styles.welcomeTitle, { color: Colors.light.text }]}>
                  Your AI Skin Coach
                </Text>
                
                <View style={styles.quickQuestions}>
                  <Text style={[styles.quickQuestionsTitle, { color: Colors.light.text }]}>Try asking:</Text>
                  {getQuickQuestions().map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.quickQuestion, { borderColor: Colors.light.tint }]}
                      onPress={() => handleQuickQuestion(question)}
                    >
                      <Text style={[styles.quickQuestionText, { color: Colors.light.tint }]}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.chatContainer}>
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[
                    styles.messageContainer,
                    item.sender === 'ai' ? styles.aiMessage : styles.userMessage
                  ]}>
                    <View style={[
                      styles.messageBubble,
                      item.sender === 'ai' ? styles.aiBubble : styles.userBubble,
                      { backgroundColor: item.sender === 'ai' ? Colors.light.cardBackground : Colors.light.tint }
                    ]}>
                      <Text style={[
                        styles.messageText,
                        item.sender === 'ai' ? styles.aiText : styles.userText
                      ]}>
                        {item.text}
                      </Text>
                      <Text style={[
                        styles.timestamp,
                        { color: Colors.light.text + '80' }
                      ]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                )}
                inverted={false}
                contentContainerStyle={{ paddingBottom: 8 }}
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: Colors.light.background,
                  borderColor: Colors.light.tint,
                  color: Colors.light.text
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your skincare..."
                placeholderTextColor={Colors.light.text + '80'}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: Colors.light.tint },
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {messages.length > 0 && (
              <View style={styles.disclaimer}>
                <IconSymbol name="info.circle" size={16} color={Colors.light.text} />
                <Text style={[styles.disclaimerText, { color: Colors.light.text }]}>
                  This is personalized advice based on your data. For medical concerns, please consult a dermatologist.
                </Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  insightsSection: {
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  insightsList: {
    paddingHorizontal: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 30,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  quickQuestions: {
    width: '100%',
  },
  quickQuestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickQuestion: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  quickQuestionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  aiText: {
    color: '#28282B',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 52, // Extra padding to stay above nav bar
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,193,7,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  disclaimerText: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
    flex: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
}); 
