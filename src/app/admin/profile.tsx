import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { AdminBottomBar } from '../../components/admin-bottom-bar';

const infoRows = [
  { label: 'Full Name', value: 'Admin User', icon: 'person-outline' },
  { label: 'Email', value: 'admin@company.com', icon: 'mail-outline' },
  { label: 'Phone', value: '+91 98765 43210', icon: 'call-outline' },
  { label: 'Department', value: 'Administration', icon: 'briefcase-outline' },
  { label: 'Member Since', value: 'Jan 10, 2024', icon: 'calendar-outline' },
  { label: 'Location', value: 'Chennai, India', icon: 'location-outline' },
];

const quickStats = [
  { label: 'Projects', value: '12', icon: 'folder', color: '#3b82f6', bg: 'bg-blue-50' },
  { label: 'Tasks Done', value: '48', icon: 'checkmark-circle', color: '#10b981', bg: 'bg-green-50' },
  { label: 'Team Size', value: '24', icon: 'people', color: '#a855f7', bg: 'bg-purple-50' },
];

export default function ProfileScreen() {
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
      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        
        {/* ── ORANGE HEADER BANNER ── */}
        <View
          style={{
            backgroundColor: '#f97316',
            paddingTop: 56,
            paddingBottom: 80,
            paddingHorizontal: 20,
          }}
        >
          {/* Back + Edit row */}
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-9 h-9 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white font-black text-lg">Profile</Text>
            <TouchableOpacity className="w-9 h-9 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AVATAR (overlapping banner) ── */}
        <View className="items-center" style={{ marginTop: -60 }}>
          <View className="relative">
            <View
              className="w-28 h-28 rounded-full bg-white items-center justify-center border-4 border-white"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <View className="w-24 h-24 rounded-full bg-slate-800 items-center justify-center">
                <Text className="text-4xl font-black text-white">{avatarLetter}</Text>
              </View>
            </View>
            {/* Camera Edit Badge */}
            <TouchableOpacity
              className="absolute bottom-1 right-1 w-8 h-8 bg-orange-500 rounded-full items-center justify-center border-2 border-white"
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-900 font-black text-2xl mt-4 mb-1">{displayName}</Text>
          <Text className="text-slate-500 text-sm mb-3">{userEmail}</Text>
          <View className="bg-slate-100 px-4 py-1.5 rounded-full">
            <Text className="text-slate-700 font-semibold text-xs">{userRole}</Text>
          </View>
        </View>

        {/* ── QUICK STATS ROW ── */}
        <View className="flex-row justify-center gap-4 mx-5 mt-6 mb-6">
          {quickStats.map((s, idx) => (
            <View key={idx} className="flex-1 bg-white rounded-[20px] p-4 items-center border border-slate-100 shadow-sm">
              <View className={`w-10 h-10 rounded-[12px] ${s.bg} items-center justify-center mb-2`}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text className="text-slate-900 font-black text-xl">{s.value}</Text>
              <Text className="text-slate-500 text-[10px] font-medium mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── PERSONAL INFORMATION CARD ── */}
        <View className="mx-5 mb-5 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <Text className="text-slate-800 font-bold text-base px-5 pt-5 pb-3">Personal Information</Text>
          {infoRows.map((row, idx) => (
            <View
              key={idx}
              className={`flex-row items-center px-5 py-4 ${idx !== infoRows.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-8 h-8 bg-orange-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name={row.icon as any} size={16} color="#f97316" />
              </View>
              <Text className="text-slate-500 text-sm flex-1">{row.label}</Text>
              <Text className="text-slate-800 font-semibold text-sm">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── EDIT PROFILE BUTTON ── */}
        <View className="mx-5 mb-4">
          <TouchableOpacity
            className="bg-orange-500 rounded-2xl py-4 items-center justify-center shadow-sm"
            style={{
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="text-white font-black text-base">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT BUTTON ── */}
        <View className="mx-5">
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            className="border border-red-200 bg-red-50 rounded-2xl py-4 items-center justify-center flex-row"
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <AdminBottomBar />
    </View>
  );
}
