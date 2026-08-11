import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../../global.css";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { getRoleHome } from "../auth/roleUtils";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "admin" || segments[0] === "employee";
    
    if (!user && inAuthGroup) {
      router.replace("/login");
    } else if (user) {
      if (segments[0] === "login" || segments.length === 0 || segments[0] === "") {
        const home = getRoleHome(user.role);
        if (home) {
          router.replace(home);
        }
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111317" }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
