import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const teamMembers = [
  ["Dhivakar Perumal", "Project Admin", "#2563eb"],
  ["Product Design", "Design team", "#f97316"],
  ["Engineering Team", "Development", "#16a34a"],
  ["Operations Team", "Operations", "#9333ea"],
] as const;

export default function TeamScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Team" subtitle="People and departments" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Team</Text>
        <Text className="mt-2 text-base text-slate-500">Keep track of the people behind every project.</Text>
        <View className="mt-6 gap-3">
          {teamMembers.map(([name, role, color]) => (
            <View key={name} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4">
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                <Ionicons name="person" size={22} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">{name}</Text>
                <Text className="mt-1 text-sm text-slate-500">{role}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}