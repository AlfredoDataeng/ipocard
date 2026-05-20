import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/LoginScreen';
import StudentDashboard from './src/screens/StudentDashboard';
import CantinaScanner from './src/screens/CantinaScanner';
import CantinaPOS from './src/screens/CantinaPOS';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#000c3b" />
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000c3b',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(15, 43, 146, 0.4)',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '900',
              fontSize: 16,
              letterSpacing: 0.5,
            },
            cardStyle: {
              backgroundColor: '#000c3b'
            }
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentDashboard" 
            component={StudentDashboard} 
            options={{ 
              title: 'PORTAL DO ESTUDANTE',
              headerLeft: () => null // Hide back button for dashboard security
            }}
          />
          <Stack.Screen 
            name="CantinaScanner" 
            component={CantinaScanner} 
            options={{ 
              title: 'TERMINAL DE LEITURA',
              headerLeft: () => null
            }}
          />
          <Stack.Screen 
            name="CantinaPOS" 
            component={CantinaPOS} 
            options={{ 
              title: 'REGISTAR COMPRAS',
              headerLeft: () => null
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
