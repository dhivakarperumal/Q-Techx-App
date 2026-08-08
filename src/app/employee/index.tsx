import { Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

export default function EmployeeScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Employee" subtitle="Daily workspace" />
      <View className="flex-1 px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Employee dashboard</Text>
        <Text className="mt-2 text-base text-slate-500">Your tasks and daily operations will appear here.</Text>
      </View>
      <BottomHome />
    </View>
  );
}