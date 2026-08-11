import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

const tasks = [
  {
    title: "Complete project documentation",
    due: "Due today",
    status: "In progress",
    priority: "High",
    color: "#2563eb",
  },
  {
    title: "Review assigned designs",
    due: "Due tomorrow",
    status: "Pending",
    priority: "Medium",
    color: "#f97316",
  },
  {
    title: "Submit weekly report",
    due: "Completed",
    status: "Completed",
    priority: "Low",
    color: "#16a34a",
  },
] as const;

export default function EmployeeTasksScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Tasks" subtitle="Your assigned work" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">My tasks</Text>
        <Text className="mt-2 text-base text-slate-500">
          Stay on top of your daily responsibilities.
        </Text>

        <View className="mt-6 gap-3">
          {tasks.map(({ title, due, status, priority, color }) => (
            <View
              key={title}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={color}
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">
                  {title}
                </Text>
                <Text className="mt-1 text-sm" style={{ color }}>
                  {due}
                </Text>
              </View>

              <View className="items-end">
                <Text
                  className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color,
                    backgroundColor: `${color}15`,
                  }}
                >
                  {status}
                </Text>
                <Text className="mt-2 text-[11px] text-slate-500">
                  {priority}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomHome />
    </View>
  );
}
