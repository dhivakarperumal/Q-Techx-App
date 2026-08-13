import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

type RouteOption = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  subtitle: string;
  href: string;
  color: string;
  bg: string;
};

const routeOptions: RouteOption[] = [
  {
    label: "PayRole",
    icon: "cash-outline",
    subtitle: "View salary slips & payroll details",
    href: "/employee/payroll",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    label: "Meetings",
    icon: "videocam-outline",
    subtitle: "View your scheduled meetings",
    href: "/employee/meetings",
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    label: "Office Calendar",
    icon: "calendar-number-outline",
    subtitle: "Company events, holidays & schedules",
    href: "/employee/office-calendar",
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    label: "My Calendar",
    icon: "calendar-outline",
    subtitle: "Plan your day and track your events",
    href: "/employee/my-calendar",
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    label: "Trainee & Internship",
    icon: "school-outline",
    subtitle: "Track your training programs and internship journey",
    href: "/employee/trainee",
    color: "#ea580c",
    bg: "#fff7ed",
  },
 
];

const accountOptions = [
  { label: "My Profile", icon: "person-circle-outline" as const },
  { label: "Settings", icon: "settings-outline" as const },
  { label: "Help & Support", icon: "help-circle-outline" as const },
];

export default function EmployeeMoreScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="More" subtitle="Additional options" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text className="text-3xl font-bold text-slate-950">More</Text>
        <Text className="mt-2 text-base text-slate-500">
          Access your account and workspace options.
        </Text>

        {/* ── Feature Cards ─────────────────────────────── */}
        <Text className="mt-8 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          Features
        </Text>
        <View style={{ gap: 12 }}>
          {routeOptions.map((opt) => (
            <Pressable
              key={opt.href}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                backgroundColor: pressed ? opt.bg : "#ffffff",
                padding: 16,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              })}
              onPress={() => router.push(opt.href as any)}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: opt.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={opt.icon} size={24} color={opt.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#0f172a",
                  }}
                >
                  {opt.label}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginTop: 2,
                  }}
                >
                  {opt.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          ))}
        </View>

        {/* ── Account Options ───────────────────────────── */}
        <Text className="mt-8 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          Account
        </Text>
        <View style={{ gap: 12 }}>
          {accountOptions.map(({ label, icon }) => (
            <Pressable
              key={label}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:bg-blue-50"
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#eff6ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={icon} size={22} color="#2563eb" />
              </View>
              <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
                {label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <BottomHome />
    </View>
  );
}
