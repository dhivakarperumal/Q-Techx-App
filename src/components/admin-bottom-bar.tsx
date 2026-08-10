import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AdminRoute =
  | "/admin"
  | "/admin/team"
  | "/admin/clients"
  | "/admin/projects"
  | "/admin/tasks"
  | "/admin/more";

const adminTabs: {
  label: string;
  route: AdminRoute;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    label: "Home",
    route: "/admin",
    icon: "home-outline" as const,
    activeIcon: "home" as const,
  },
  {
    label: "Team",
    route: "/admin/team",
    icon: "people-outline" as const,
    activeIcon: "people" as const,
  },
  {
    label: "Clients",
    route: "/admin/clients",
    icon: "people-circle-outline" as const,
    activeIcon: "people-circle" as const,
  },
  {
    label: "Projects",
    route: "/admin/projects",
    icon: "folder-outline" as const,
    activeIcon: "folder" as const,
  },
  {
    label: "Tasks",
    route: "/admin/tasks",
    icon: "checkmark-circle-outline" as const,
    activeIcon: "checkmark-circle" as const,
  },
  {
    label: "More",
    route: "/admin/more",
    icon: "ellipsis-horizontal-outline" as const,
    activeIcon: "ellipsis-horizontal" as const,
  },
];

export function AdminBottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="border-t border-slate-100 bg-white"
    >
      <View className="flex-row items-center justify-around px-2 pb-2 pt-3">
        {adminTabs.map((tab) => {
          const isActive = pathname === tab.route;
          const iconColor = isActive ? "#f97316" : "#94a3b8"; // Orange for active, slate-400 for inactive

          return (
            <Pressable
              key={tab.label}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center justify-center relative"
              onPress={() => {
                if (!isActive) {
                  router.replace(tab.route);
                }
              }}
            >
              {isActive && (
                <View className="absolute -top-3 w-8 h-1 bg-orange-500 rounded-b-full" />
              )}
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={iconColor}
              />
              <Text
                className={
                  isActive
                    ? "mt-1 text-[10px] font-bold text-orange-600"
                    : "mt-1 text-[10px] font-medium text-slate-500"
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
