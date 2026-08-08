import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const adminSections = [
  {
    icon: "home-outline",
    title: "Home",
    items: ["Dashboard", "Company updates", "Quick actions"],
  },
  {
    icon: "folder-outline",
    title: "Projects",
    items: ["Active projects", "Project details", "Project progress"],
  },
  {
    icon: "checkmark-circle-outline",
    title: "Tasks",
    items: ["My tasks", "Pending", "In Progress", "Completed"],
  },
  {
    icon: "people-outline",
    title: "Team",
    items: ["Employees", "Trainees", "Interns", "Team details"],
  },
  {
    icon: "person-outline",
    title: "Profile",
    items: ["My profile", "Attendance", "Settings", "Logout"],
  },
] as const;

export default function AdminScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Admin" subtitle="Management workspace" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-3xl font-bold text-slate-950">Admin dashboard</Text>
        <Text className="mt-2 text-base text-slate-500">
          Manage the Q TECHX operation from one place.
        </Text>

        <View className="mt-6 gap-4">
          {adminSections.map((section) => (
            <View key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="mb-3 flex-row items-center">
                <Ionicons name={section.icon} size={22} color="#1d4ed8" style={{ marginRight: 12 }} />
                <Text className="text-lg font-bold text-slate-950">{section.title}</Text>
              </View>
              <View className="gap-2">
                {section.items.map((item) => (
                  <Pressable
                    key={item}
                    className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3 active:bg-blue-50"
                    onPress={() =>
                      item === "Logout"
                        ? router.replace("/login")
                        : Alert.alert(item, `${item} is ready to connect.`)
                    }
                  >
                    <Text className="text-sm font-medium text-slate-700">{item}</Text>
                    <Text className="text-lg text-slate-400">›</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <AdminBottomBar />
    </View>
  );
}