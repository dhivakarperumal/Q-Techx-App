import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = {
  label: string;
  href:
    | "/employee"
    | "/employee/tasks"
    | "/employee/projects"
    | "/employee/leave"
    | "/employee/attendance"
    | "/employee/more";
  icon:
    | "home-outline"
    | "checkmark-circle-outline"
    | "folder-outline"
    | "calendar-clear-outline"
    | "calendar-outline"
    | "apps-outline";
  activeIcon: "home" | "checkmark-circle" | "folder" | "calendar-clear" | "calendar" | "apps";
};

const tabs: Tab[] = [
  {
    label: "Home",
    href: "/employee",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    label: "Tasks",
    href: "/employee/tasks",
    icon: "checkmark-circle-outline",
    activeIcon: "checkmark-circle",
  },
  {
    label: "Project",
    href: "/employee/projects",
    icon: "folder-outline",
    activeIcon: "folder",
  },
  {
    label: "Leave",
    href: "/employee/leave",
    icon: "calendar-clear-outline",
    activeIcon: "calendar-clear",
  },
  {
    label: "Attendance",
    href: "/employee/attendance",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    label: "More",
    href: "/employee/more",
    icon: "apps-outline",
    activeIcon: "apps",
  },
];

export function BottomHome() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="border-t border-slate-200 bg-white"
    >
      <View className="flex-row items-center justify-around px-3 pb-1 pt-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const iconColor = isActive ? "#1d4ed8" : "#64748b";

          return (
            <Pressable
              key={tab.href}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center rounded-xl px-1 py-1 active:bg-blue-50"
              onPress={() => {
                if (!isActive) {
                  router.replace(tab.href);
                }
              }}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={iconColor}
              />
              <Text
                className={
                  isActive
                    ? "mt-1 text-xs font-bold text-blue-700"
                    : "mt-1 text-xs text-slate-500"
                }
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
