import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

const attendance = [
  ["Today", "Present", "09:02 AM - In progress", "#16a34a"],
  ["Yesterday", "Present", "09:08 AM - 06:12 PM", "#2563eb"],
  ["Monday", "Present", "08:56 AM - 05:48 PM", "#2563eb"],
] as const;

export default function AttendanceScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Attendance" subtitle="Your time and presence" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Attendance</Text>
        <Text className="mt-2 text-base text-slate-500">Review your recent attendance records.</Text>
        <View className="mt-6 gap-3">
          {attendance.map(([day, status, hours, color]) => (
            <View key={day} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="calendar-outline" size={22} color="#2563eb" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-slate-900">{day}</Text>
                <Text className="mt-1 text-sm text-slate-500">{hours}</Text>
              </View>
              <Text className="text-sm font-semibold" style={{ color }}>{status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomHome />
    </View>
  );
}