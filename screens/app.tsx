import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';
// import HomeScreen from './screens/HomeScreen'; // Your main app screen

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
