import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const tasks = [
  [
    "Review mobile app screens",
    "Design team",
    "In progress",
    "time-outline",
    "#2563eb",
  ],
  [
    "Approve project milestones",
    "Admin team",
    "Pending",
    "ellipse-outline",
    "#f97316",
  ],
  [
    "Publish weekly update",
    "Operations",
    "Completed",
    "checkmark-circle",
    "#16a34a",
  ],
] as const;

export default function TasksScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Tasks" subtitle="Work that needs attention" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Tasks</Text>
        <Text className="mt-2 text-base text-slate-500">
          See what is pending, active, and complete.
        </Text>
        <View className="mt-6 gap-3">
          {tasks.map(([title, owner, status, icon, color]) => (
            <View
              key={title}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
            >
              <Ionicons name={icon} size={24} color={color} />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">
                  {title}
                </Text>
                <Text className="mt-1 text-sm text-slate-500">{owner}</Text>
              </View>
              <Text className="text-xs font-semibold" style={{ color }}>
                {status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}
