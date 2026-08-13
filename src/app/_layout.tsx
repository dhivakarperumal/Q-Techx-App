import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { CustomAlertProvider } from "../context/CustomAlertContext";
import { getRoleHome } from "../auth/roleUtils";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const currentPath = `/${segments.join("/")}`;
    const inAuthGroup = segments[0] === "admin" || segments[0] === "employee";

    if (!user && inAuthGroup && currentPath !== "/login") {
      router.replace("/login");
    } else if (user) {
      if (
        segments[0] === "login" ||
        segments.length === 0 ||
        segments[0] === ""
      ) {
        const home = getRoleHome(user.role);
        if (home && currentPath !== home) {
          router.replace(home);
        }
      }
    }
  }, [user, isLoading, segments, router, navigationState]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
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
