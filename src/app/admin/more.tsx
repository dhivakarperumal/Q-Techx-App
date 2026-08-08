import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const menuItems = [
  { label: "My Profile", icon: "person-circle-outline" as const },
  { label: "Settings", icon: "settings-outline" as const },
  { label: "Help & Support", icon: "help-circle-outline" as const },
];

export default function MoreScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="More" subtitle="Additional options" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">More</Text>
        <Text className="mt-2 text-base text-slate-500">Access your account and workspace options.</Text>
        <View className="mt-6 gap-3">
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:bg-blue-50"
              onPress={() => Alert.alert(item.label, `${item.label} is ready to connect.`)}
            >
              <Ionicons name={item.icon} size={24} color="#2563eb" />
              <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}