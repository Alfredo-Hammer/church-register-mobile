import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import WelcomeScreen from "../screens/WelcomeScreen";
import JoinChurchScreen from "../screens/JoinChurchScreen";
import MemberHomeScreen from "../screens/MemberHomeScreen";
import GroupsScreen from "../screens/GroupsScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ConferenceListScreen from "../screens/ConferenceListScreen";
import SessionPickerScreen from "../screens/SessionPickerScreen";
import ScannerScreen from "../screens/ScannerScreen";
import EventListScreen from "../screens/EventListScreen";
import AttendanceScreen from "../screens/AttendanceScreen";

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

export default function RootNavigator() {
  const { user, joinedChurch, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ConferenceList" component={ConferenceListScreen} options={{ title: "Conferencias" }} />
            <Stack.Screen name="SessionPicker" component={SessionPickerScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
            <Stack.Screen name="EventList" component={EventListScreen} options={{ title: "Asistencia" }} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
          </>
        ) : joinedChurch ? (
          <>
            <Stack.Screen name="MemberHome" component={MemberHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: "Grupos y ministerios" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="JoinChurch" component={JoinChurchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
