import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const projects = [
  ["Q TECHX Mobile App", "In progress", "68%", "#2563eb"],
  ["Website Redesign", "Planning", "24%", "#f97316"],
  ["Internal Dashboard", "Review", "86%", "#16a34a"],
] as const;

export default function ProjectsScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Projects" subtitle="Track company work" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Projects</Text>
        <Text className="mt-2 text-base text-slate-500">Keep every delivery moving in the right direction.</Text>
        <View className="mt-6 gap-3">
          {projects.map(([name, status, progress, color]) => (
            <View key={name} className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center">
                <Ionicons name="folder-open-outline" size={22} color={color} />
                <Text className="ml-3 flex-1 text-base font-bold text-slate-900">{name}</Text>
                <Text className="text-sm font-bold" style={{ color }}>{progress}</Text>
              </View>
              <Text className="mt-3 text-sm text-slate-500">{status}</Text>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <View className="h-full rounded-full" style={{ width: progress, backgroundColor: color }} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}