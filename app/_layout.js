import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android' && !isExpoGo) {
        try {
          const Notifications = require('expo-notifications');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          });
          await Notifications.requestPermissionsAsync();
        } catch (e) {
          console.log("Lỗi khi xin quyền Notifications:", e);
        }
      }
    }
    requestPermissions();
  }, []);
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </AuthProvider>
  );
}
