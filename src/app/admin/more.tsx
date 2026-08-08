import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

import { useAuth } from "../../auth/AuthContext";

const menuItems = [
  { label: "My Profile", icon: "person-circle-outline" as const, color: '#f97316', bg: 'bg-orange-50', route: '/admin/profile' },
  { label: "Settings", icon: "settings-outline" as const, color: '#3b82f6', bg: 'bg-blue-50', route: null },
  { label: "Notifications", icon: "notifications-outline" as const, color: '#10b981', bg: 'bg-green-50', route: null },
  { label: "Help & Support", icon: "help-circle-outline" as const, color: '#a855f7', bg: 'bg-purple-50', route: null },
  { label: "Privacy Policy", icon: "shield-checkmark-outline" as const, color: '#64748b', bg: 'bg-slate-50', route: null },
  { label: "About App", icon: "information-circle-outline" as const, color: '#0ea5e9', bg: 'bg-sky-50', route: null },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const rawName = (user?.name as string) || (user?.full_name as string) || 'Admin User';
  const userEmail = (user?.email as string) || 'admin@company.com';
  const userRole = (user?.role as string)?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Super Administrator';
  const capitalise = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());
  const displayName = capitalise(rawName);
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">

        {/* ── HEADER ── */}
        <View className="px-5 mb-6">
          <Text className="text-slate-900 text-3xl font-black tracking-tight">More</Text>
          <Text className="text-slate-500 text-xs mt-1">Account settings and preferences</Text>
        </View>

        {/* ── PROFILE CARD ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/admin/profile')}
          className="mx-5 mb-6 bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex-row items-center"
        >
          <View className="w-16 h-16 rounded-full bg-slate-800 items-center justify-center mr-4 shadow-sm">
            <Text className="text-2xl font-black text-white">{avatarLetter}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-black text-base mb-0.5">{displayName}</Text>
            <Text className="text-slate-500 text-xs mb-2">{userEmail}</Text>
            <View className="bg-orange-50 self-start px-2.5 py-0.5 rounded-full">
              <Text className="text-orange-600 font-bold text-[10px]">{userRole}</Text>
            </View>
          </View>
          <View className="w-9 h-9 bg-slate-50 rounded-full items-center justify-center">
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {/* ── MENU ITEMS ── */}
        <View className="mx-5 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              className={`flex-row items-center px-5 py-4 active:bg-slate-50 ${index !== menuItems.length - 1 ? 'border-b border-slate-100' : ''}`}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any);
                } else {
                  Alert.alert(item.label, `${item.label} coming soon.`);
                }
              }}
            >
              <View className={`w-10 h-10 rounded-[12px] ${item.bg} items-center justify-center mr-4`}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text className="flex-1 text-slate-800 font-semibold text-sm">{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </Pressable>
          ))}
        </View>

        {/* ── LOG OUT ── */}
        <View className="mx-5">
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-red-50 border border-red-100 rounded-[24px] p-5 flex-row items-center"
            onPress={() =>
              Alert.alert('Log out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log out',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/login');
                  },
                },
              ])
            }
          >
            <View className="w-10 h-10 rounded-[12px] bg-red-100 items-center justify-center mr-4">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text className="flex-1 text-red-500 font-bold text-sm">Log Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <AdminBottomBar />

    </View>
  );
}
