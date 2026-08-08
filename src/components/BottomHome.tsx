import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = {
  label: string;
  href: "/admin" | "/employee";
  icon: "shield-checkmark-outline" | "briefcase-outline";
  activeIcon: "shield-checkmark" | "briefcase";
};

const tabs: Tab[] = [
  {
    label: "Admin",
    href: "/admin",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
  },
  {
    label: "Employee",
    href: "/employee",
    icon: "briefcase-outline",
    activeIcon: "briefcase",
  },
];

export function BottomHome() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-slate-200 bg-white">
      <View className="flex-row items-center justify-around px-3 pb-1 pt-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(`/${tab.href.split("/")[1]}`);
          const iconColor = isActive ? "#1d4ed8" : "#64748b";

          return (
            <Pressable
              key={tab.href}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="min-w-[88px] items-center rounded-xl px-3 py-1 active:bg-blue-50"
              onPress={() => router.replace(tab.href)}
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