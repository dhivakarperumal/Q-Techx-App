import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const clients = [
  ["Apex Industries", "Website Redesign", "Active", "#16a34a"],
  ["Bluewave Technologies", "Mobile App Development", "Active", "#2563eb"],
  ["Greenfield Retail", "Internal Dashboard", "On hold", "#f97316"],
] as const;

export default function ClientsScreen() {
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-32 pt-4">
        <Text className="text-3xl font-black text-slate-900">Clients</Text>
        <Text className="mt-1 text-sm text-slate-500">Manage your company relationships and projects.</Text>

        <View className="mt-6 flex-row flex-wrap justify-between">
          <View className="mb-4 w-[48%] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Ionicons name="business" size={24} color="#f97316" />
            <Text className="mt-3 text-xs font-bold text-slate-500">Total Clients</Text>
            <Text className="mt-1 text-2xl font-black text-slate-900">18</Text>
          </View>
          <View className="mb-4 w-[48%] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
            <Text className="mt-3 text-xs font-bold text-slate-500">Active Clients</Text>
            <Text className="mt-1 text-2xl font-black text-slate-900">14</Text>
          </View>
        </View>

        <Text className="mb-3 mt-2 text-lg font-bold text-slate-800">Client Directory</Text>
        <View className="gap-3">
          {clients.map(([name, project, status, color]) => (
            <View key={name} className="flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                <Ionicons name="business-outline" size={23} color="#f97316" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">{name}</Text>
                <Text className="mt-1 text-xs text-slate-500">{project}</Text>
              </View>
              <Text className="text-xs font-bold" style={{ color }}>{status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}