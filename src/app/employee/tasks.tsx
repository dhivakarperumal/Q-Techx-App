import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

const tasks = [
  ["Complete project documentation", "Due today", "#2563eb"],
  ["Review assigned designs", "Due tomorrow", "#f97316"],
  ["Submit weekly report", "Completed", "#16a34a"],
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
          {tasks.map(([title, due, color]) => (
            <View
              key={title}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={color}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">
                  {title}
                </Text>
                <Text className="mt-1 text-sm" style={{ color }}>
                  {due}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomHome />
    </View>
  );
}
