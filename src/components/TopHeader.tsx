import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";

type TopHeaderProps = {
  title: string;
  subtitle?: string;
};

export function TopHeader({ title, subtitle }: TopHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-xl font-bold text-slate-950">Q TECHX</Text>
          {subtitle ? <Text className="mt-1 text-xs text-slate-500">{subtitle}</Text> : null}
        </Pressable>
        <View className="flex-row items-center gap-3">
          <View className="rounded-full bg-blue-50 px-3 py-2">
            <Text className="text-xs font-semibold text-blue-700">{title}</Text>
          </View>
          <Pressable
            accessibilityLabel="Log out"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-red-50"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#475569" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}