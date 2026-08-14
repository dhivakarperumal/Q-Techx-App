import {
    Stack,
    useRouter,
    useSegments,
} from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { getRoleHome } from "../auth/roleUtils";
import { CustomAlertProvider } from "../context/CustomAlertContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    try {
      const currentPath = `/${segments.join("/")}`;
      const inAuthGroup = segments[0] === "admin" || segments[0] === "employee";

      if (!user && inAuthGroup && currentPath !== "/login") {
        router.replace("/login");
      } else if (user) {
        if (
          segments[0] === "login" ||
          !segments[0]
        ) {
          const home = getRoleHome(user.role);
          if (home && currentPath !== home) {
            router.replace(home);
          }
        }
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.replace("/login");
    }
  }, [user, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          An error occurred
        </Text>
        <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
          Please restart the app
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CustomAlertProvider>
          <RootLayoutNav />
        </CustomAlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
