import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const adminTabs = [
  { label: "Home", icon: "home-outline" as const, activeIcon: "home" as const },
  { label: "Projects", icon: "folder-outline" as const, activeIcon: "folder" as const },
  { label: "Tasks", icon: "checkmark-circle-outline" as const, activeIcon: "checkmark-circle" as const },
  { label: "Team", icon: "people-outline" as const, activeIcon: "people" as const },
  { label: "More", icon: "apps-outline" as const, activeIcon: "apps" as const },
];

export function AdminBottomBar() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-slate-200 bg-white">
      <View className="flex-row items-center justify-around px-2 pb-1 pt-2">
        {adminTabs.map((tab, index) => {
          const isActive = index === 0;
          const iconColor = isActive ? "#1d4ed8" : "#64748b";

          return (
            <Pressable
              key={tab.label}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center rounded-xl px-1 py-1 active:bg-blue-50"
              onPress={() =>
                isActive
                  ? router.replace("/admin")
                  : Alert.alert(tab.label, `${tab.label} is ready to connect.`)
              }
            >
              <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={iconColor} />
              <Text className={isActive ? "mt-1 text-xs font-bold text-blue-700" : "mt-1 text-xs text-slate-500"}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}