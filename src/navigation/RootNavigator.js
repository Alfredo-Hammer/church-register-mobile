import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import WelcomeScreen from "../screens/WelcomeScreen";
import JoinChurchScreen from "../screens/JoinChurchScreen";
import MemberHomeScreen from "../screens/MemberHomeScreen";
import GroupsScreen from "../screens/GroupsScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import MembersScreen from "../screens/MembersScreen";
import MemberDetailScreen from "../screens/MemberDetailScreen";
import VisitorsScreen from "../screens/VisitorsScreen";
import VisitorDetailScreen from "../screens/VisitorDetailScreen";
import BaptismsScreen from "../screens/BaptismsScreen";
import BaptismDetailScreen from "../screens/BaptismDetailScreen";
import LeadersScreen from "../screens/LeadersScreen";
import LeaderDetailScreen from "../screens/LeaderDetailScreen";
import ActivitiesScreen from "../screens/ActivitiesScreen";
import ActivityDetailScreen from "../screens/ActivityDetailScreen";
import ResumenScreen from "../screens/ResumenScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ConferenceListScreen from "../screens/ConferenceListScreen";
import SessionPickerScreen from "../screens/SessionPickerScreen";
import ScannerScreen from "../screens/ScannerScreen";
import EventListScreen from "../screens/EventListScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import PhotoFeedScreen from "../screens/PhotoFeedScreen";
import LiveStreamScreen from "../screens/LiveStreamScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const InicioStack = createNativeStackNavigator();
const EventosStack = createNativeStackNavigator();
const ActividadesStack = createNativeStackNavigator();
const MiembrosStack = createNativeStackNavigator();

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

// El resto de módulos del staff (Conferencias, Grupos, Avisos, Visitantes,
// Bautismos, Líderes) se abren desde las tarjetas del home, así que viven
// en el mismo stack que Home — solo Eventos, Actividades y Miembros salen
// de ahí para tener su propia pestaña fija.
function InicioStackScreen() {
  return (
    <InicioStack.Navigator>
      <InicioStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <InicioStack.Screen name="ConferenceList" component={ConferenceListScreen} options={{ title: "Conferencias" }} />
      <InicioStack.Screen name="SessionPicker" component={SessionPickerScreen} />
      <InicioStack.Screen name="Scanner" component={ScannerScreen} />
      <InicioStack.Screen name="Groups" component={GroupsScreen} options={{ title: "Grupos y ministerios" }} />
      <InicioStack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: "Avisos" }} />
      <InicioStack.Screen name="Visitors" component={VisitorsScreen} options={{ title: "Visitantes" }} />
      <InicioStack.Screen name="VisitorDetail" component={VisitorDetailScreen} options={{ title: "Visitante" }} />
      <InicioStack.Screen name="BaptismList" component={BaptismsScreen} options={{ title: "Bautismos" }} />
      <InicioStack.Screen name="BaptismDetail" component={BaptismDetailScreen} options={{ title: "Bautismo" }} />
      <InicioStack.Screen name="Leaders" component={LeadersScreen} options={{ title: "Líderes" }} />
      <InicioStack.Screen name="LeaderDetail" component={LeaderDetailScreen} options={{ title: "Líder" }} />
      <InicioStack.Screen name="PhotoFeed" component={PhotoFeedScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <InicioStack.Screen name="LiveStream" component={LiveStreamScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
    </InicioStack.Navigator>
  );
}

function EventosStackScreen() {
  return (
    <EventosStack.Navigator>
      <EventosStack.Screen name="EventList" component={EventListScreen} options={{ title: "Eventos" }} />
      <EventosStack.Screen name="Attendance" component={AttendanceScreen} />
    </EventosStack.Navigator>
  );
}

function ActividadesStackScreen() {
  return (
    <ActividadesStack.Navigator>
      <ActividadesStack.Screen name="ActivityList" component={ActivitiesScreen} options={{ title: "Actividades" }} />
      <ActividadesStack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: "Actividad" }} />
    </ActividadesStack.Navigator>
  );
}

function MiembrosStackScreen() {
  return (
    <MiembrosStack.Navigator>
      <MiembrosStack.Screen name="Members" component={MembersScreen} options={{ title: "Miembros" }} />
      <MiembrosStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: "Miembro" }} />
    </MiembrosStack.Navigator>
  );
}

const TAB_ICONS = {
  InicioTab: "home-outline",
  EventosTab: "calendar-outline",
  ActividadesTab: "flag-outline",
  MiembrosTab: "people-outline",
  ResumenTab: "stats-chart-outline",
};

function StaffTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="InicioTab" component={InicioStackScreen} options={{ title: "Inicio" }} />
      <Tab.Screen name="EventosTab" component={EventosStackScreen} options={{ title: "Eventos" }} />
      <Tab.Screen name="ActividadesTab" component={ActividadesStackScreen} options={{ title: "Actividades" }} />
      <Tab.Screen name="MiembrosTab" component={MiembrosStackScreen} options={{ title: "Miembros" }} />
      <Tab.Screen name="ResumenTab" component={ResumenScreen} options={{ title: "Resumen", headerShown: true }} />
    </Tab.Navigator>
  );
}

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
          <Stack.Screen name="StaffTabs" component={StaffTabs} options={{ headerShown: false }} />
        ) : joinedChurch ? (
          <>
            <Stack.Screen name="MemberHome" component={MemberHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: "Grupos y ministerios" }} />
            <Stack.Screen name="PhotoFeed" component={PhotoFeedScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
            <Stack.Screen name="LiveStream" component={LiveStreamScreen} options={{ headerShown: false, presentation: "fullScreenModal" }} />
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
