import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";
import { useCustomAlert } from "../../context/CustomAlertContext";

export default function EmployeeMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showAlert } = useCustomAlert();

  const rawName =
    (user?.name as string) || (user?.full_name as string) || "Employee";
  const userEmail = (user?.email as string) || "employee@company.com";
  const userRole =
    (user?.role as string)
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Employee";
  const capitalise = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());
  const displayName = capitalise(rawName);
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="More" subtitle="Account settings and preferences" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 0 }}
      >
        

        {/* ── PROFILE CARD ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/employee/profile")}
          className="mx-5 mt-6 mb-6 bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex-row items-center"
        >
          <View className="w-16 h-16 rounded-full bg-orange-500 items-center justify-center mr-4 shadow-sm">
            <Text className="text-2xl font-black text-white">
              {avatarLetter}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-black text-base mb-0.5">
              {displayName}
            </Text>
            <Text className="text-slate-500 text-xs mb-2">{userEmail}</Text>
            <View className="bg-orange-50 self-start px-2.5 py-0.5 rounded-full">
              <Text className="text-orange-600 font-bold text-[10px]">
                {userRole}
              </Text>
            </View>
          </View>
          <View className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center">
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {/* ── FEATURE CARDS — single column full width ── */}
        <View className="mt-7 px-5">
          <Text className="mb-4 text-[11px] font-bold uppercase tracking-[1.4px] text-slate-400">
            Features
          </Text>

          <View className="gap-3">
            {/* PayRole */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/employee/payroll" as any)}
              className="bg-white rounded-[20px] p-[18px] flex-row items-center border border-slate-100 shadow-sm"
            >
              <View className="w-[52px] h-[52px] rounded-2xl bg-orange-50 items-center justify-center">
                <Ionicons name="cash-outline" size={26} color="#f97316" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-orange-500 text-[10px] font-bold tracking-[1px] uppercase">
                  Finance
                </Text>
                <Text className="text-slate-900 text-[17px] font-extrabold mt-0.5">
                  PayRole
                </Text>
                <Text className="text-slate-500 text-[12px] mt-0.5">
                  View salary slips & payroll details
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            {/* Meetings */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/employee/meetings" as any)}
              className="bg-white rounded-[20px] p-[18px] flex-row items-center border border-slate-100 shadow-sm"
            >
              <View className="w-[52px] h-[52px] rounded-2xl bg-orange-50 items-center justify-center">
                <Ionicons name="videocam-outline" size={26} color="#f97316" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-orange-500 text-[10px] font-bold tracking-[1px] uppercase">
                  Collaboration
                </Text>
                <Text className="text-slate-900 text-[17px] font-extrabold mt-0.5">
                  Meetings
                </Text>
                <Text className="text-slate-500 text-[12px] mt-0.5">
                  View your scheduled meetings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            {/* Office Calendar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/employee/office-calendar" as any)}
              className="bg-white rounded-[20px] p-[18px] flex-row items-center border border-slate-100 shadow-sm"
            >
              <View className="w-[52px] h-[52px] rounded-2xl bg-orange-50 items-center justify-center">
                <Ionicons
                  name="calendar-number-outline"
                  size={26}
                  color="#f97316"
                />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-orange-500 text-[10px] font-bold tracking-[1px] uppercase">
                  Company
                </Text>
                <Text className="text-slate-900 text-[17px] font-extrabold mt-0.5">
                  Office Calendar
                </Text>
                <Text className="text-slate-500 text-[12px] mt-0.5">
                  Company events, holidays & schedules
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            {/* My Calendar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/employee/my-calendar" as any)}
              className="bg-white rounded-[20px] p-[18px] flex-row items-center border border-slate-100 shadow-sm"
            >
              <View className="w-[52px] h-[52px] rounded-2xl bg-orange-50 items-center justify-center">
                <Ionicons name="calendar-outline" size={26} color="#f97316" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-orange-500 text-[10px] font-bold tracking-[1px] uppercase">
                  Personal
                </Text>
                <Text className="text-slate-900 text-[17px] font-extrabold mt-0.5">
                  My Calendar
                </Text>
                <Text className="text-slate-500 text-[12px] mt-0.5">
                  Plan your day and track your events
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            {/* Trainee & Internship */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/employee/trainee" as any)}
              className="bg-white rounded-[20px] p-[18px] flex-row items-center border border-slate-100 shadow-sm"
            >
              <View className="w-[52px] h-[52px] rounded-2xl bg-orange-50 items-center justify-center">
                <Ionicons name="school-outline" size={26} color="#f97316" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-orange-500 text-[10px] font-bold tracking-[1px] uppercase">
                  Learning
                </Text>
                <Text className="text-slate-900 text-[17px] font-extrabold mt-0.5">
                  Trainee & Internship
                </Text>
                <Text className="text-slate-500 text-[12px] mt-0.5">
                  Track training and internship journey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LOG OUT ── */}
        <View className="mx-5 mt-10 mb-6">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              showAlert("Log out", "Are you sure you want to log out?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Log out",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                    router.replace("/login");
                  },
                },
              ])
            }
            className="overflow-hidden rounded-[24px] border border-orange-100"
            style={{
              shadowColor: "#f97316",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={["#ffffff", "#fff7ed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5 flex-row items-center"
            >
              <View className="h-11 w-11 rounded-2xl bg-orange-100 items-center justify-center mr-4">
                <Ionicons name="log-out-outline" size={21} color="#f97316" />
              </View>

              <View className="flex-1">
                <Text className="text-orange-600 font-black text-sm">
                  Log Out
                </Text>
                <Text className="text-slate-500 text-[11px] mt-0.5">
                  Sign out from your account
                </Text>
              </View>

              <View className="h-9 w-9 rounded-full bg-orange-50 items-center justify-center">
                <Ionicons name="chevron-forward" size={18} color="#f97316" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomHome />
    </View>
  );
}
