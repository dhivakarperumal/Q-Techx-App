import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AdminBottomBar } from "../../components/admin-bottom-bar";
import api, { API_BASE_URL } from "../../api";
import { TopHeader } from "../../components/TopHeader";
import { FAB } from "../../components/FAB";

const stats = [
  { label: 'Total Members', value: '24', sub: 'All Members', icon: 'people-outline', color: '#f97316', bg: 'bg-orange-50' },
  { label: 'Active Members', value: '20', sub: '83.3%', subColor: 'text-blue-500', icon: 'person-add-outline', color: '#3b82f6', bg: 'bg-blue-50' },
  { label: 'On Leave', value: '2', sub: '8.3%', subColor: 'text-green-500', icon: 'person-outline', color: '#10b981', bg: 'bg-green-50' },
  { label: 'Inactive', value: '2', sub: '8.3%', subColor: 'text-purple-500', icon: 'person-remove-outline', color: '#a855f7', bg: 'bg-purple-50' },
];

const filters = [
  { label: 'All Members', active: true, icon: 'people' },
  { label: 'Development', active: false, icon: 'code-slash' },
  { label: 'Design', active: false, icon: 'color-palette' },
  { label: 'Marketing', active: false, icon: 'megaphone' },
];

export default function TeamScreen() {
  const router = useRouter();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get("/employees");
        
        // Handle both possible response shapes: { data: [...] } or just [...]
        const usersArray = Array.isArray(data) ? data : (data?.data || data?.users || []);
        
        const mappedTeam = usersArray.map((emp: any) => {
          // Resolve profile photo URL (e.g., /uploads/... -> http://192.168.1.4:5000/uploads/...)
          const baseUrl = API_BASE_URL.replace(/\/api$/, "");
          const avatarUrl = emp.profile_photo 
            ? (emp.profile_photo.startsWith('http') ? emp.profile_photo : `${baseUrl}${emp.profile_photo}`) 
            : 'https://i.pravatar.cc/100';

          return {
            name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
            role: emp.role || 'Employee',
            roleColor: 'text-blue-500',
            roleBg: 'bg-blue-50',
            team: emp.department || emp.team || emp.employee_code || 'General',
            email: emp.email || 'N/A',
            phone: emp.phone || emp.mobile || 'N/A',
            status: emp.status || 'Active',
            statusColor: emp.status === 'Inactive' ? 'text-slate-600' : 'text-green-600',
            statusBg: emp.status === 'Inactive' ? 'bg-slate-100' : 'bg-green-100',
            avatar: avatarUrl,
            onlineDot: emp.status === 'Inactive' ? 'bg-slate-300' : 'bg-green-500',
          };
        });
        setTeam(mappedTeam);
      } catch (error) {
        console.error("Failed to fetch team members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        
    

        {/* ── STATS SCROLLVIEW ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 mb-6" className="overflow-visible">
          {stats.map((stat, idx) => (
            <View key={idx} className="bg-white rounded-[24px] p-4 mr-4 border border-slate-100 shadow-sm w-[130px]">
              <View className={`w-10 h-10 rounded-[14px] ${stat.bg} items-center justify-center mb-3`}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text className="text-slate-500 font-bold text-[10px] mb-1">{stat.label}</Text>
              <Text className="text-slate-900 font-black text-2xl tracking-tight mb-1">{stat.value}</Text>
              <Text className={`text-[10px] font-medium ${stat.subColor || 'text-slate-400'}`}>{stat.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── SEARCH & FILTER ── */}
        <View className="px-5 mb-4 flex-row items-center gap-3">
          <View className="flex-1 bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search team members..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
          </View>
          <TouchableOpacity className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm">
            <Ionicons name="filter" size={16} color="#64748b" />
            <Text className="text-slate-700 font-bold text-sm ml-2 mr-1">Filter</Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* ── FILTER PILLS ── */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 flex-row items-center">
            {filters.map((filter, idx) => (
              <TouchableOpacity
                key={idx}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
                  filter.active ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'
                }`}
              >
                <Ionicons name={filter.icon as any} size={14} color={filter.active ? "#f97316" : "#3b82f6"} className="mr-2" />
                <Text className={`text-xs font-bold ${filter.active ? 'text-orange-600 ml-1.5' : 'text-slate-600 ml-1.5'}`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* More Dropdown Pill */}
            <TouchableOpacity className="flex-row items-center px-4 py-2 rounded-full border border-slate-200 bg-white ml-2">
              <Text className="text-slate-600 text-xs font-bold mr-1.5">More</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="px-5 mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">Team Members ({team.length})</Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-slate-500 text-xs font-medium mr-1">Sort by: Recent</Text>
            <Ionicons name="chevron-down" size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* ── TEAM LIST ── */}
        <View className="px-5">
          {loading ? (
            <Text className="text-center text-slate-500 mt-4">Loading team...</Text>
          ) : team.map((member, idx) => (
            <View key={idx} className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm flex-row items-start justify-between">
              
              {/* Left Side: Avatar and Info */}
              <View className="flex-row flex-1">
                {/* Avatar with Status Dot */}
                <View className="mr-4 relative">
                  <Image source={{ uri: member.avatar }} className="w-14 h-14 rounded-full bg-slate-200" />
                  <View className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${member.onlineDot}`} />
                </View>
                
                {/* Info Block */}
                <View className="flex-1 justify-center">
                  <View className="flex-row items-center mb-1.5">
                    <Text className="text-slate-900 font-bold text-[15px] mr-2">{member.name}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${member.roleBg}`}>
                      <Text className={`text-[9px] font-bold ${member.roleColor}`}>{member.role}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center mb-1.5">
                    <Ionicons name="briefcase-outline" size={12} color="#94a3b8" />
                    <Text className="text-slate-500 text-xs ml-1">{member.team}</Text>
                  </View>
                  
                  <View className="flex-row items-center flex-wrap">
                    <View className="flex-row items-center mr-3 mb-1">
                      <Ionicons name="mail-outline" size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-[10px] ml-1">{member.email}</Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="call-outline" size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-[10px] ml-1">{member.phone}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Side: Status Badge & Menu */}
              <View className="justify-between items-end h-[60px]">
                <View className={`px-2 py-1 rounded-md ${member.statusBg}`}>
                  <Text className={`text-[9px] font-bold ${member.statusColor}`}>{member.status}</Text>
                </View>
                <TouchableOpacity className="mt-auto">
                  <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />

      {/* Floating Action Button */}
      <FAB onPress={() => {}} />
    </View>
  );
}
