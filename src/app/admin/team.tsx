import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

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

const team = [
  {
    name: 'Arun Kumar',
    role: 'Project Manager',
    roleColor: 'text-orange-500',
    roleBg: 'bg-orange-50',
    team: 'Project Management',
    email: 'arun.kumar@company.com',
    phone: '+91 98765 43210',
    status: 'Active',
    statusColor: 'text-green-600',
    statusBg: 'bg-green-100',
    avatar: 'https://i.pravatar.cc/100?img=11',
    onlineDot: 'bg-green-500',
  },
  {
    name: 'Priya Sharma',
    role: 'UI/UX Designer',
    roleColor: 'text-blue-500',
    roleBg: 'bg-blue-50',
    team: 'Design Team',
    email: 'priya.sharma@company.com',
    phone: '+91 87654 32109',
    status: 'Active',
    statusColor: 'text-green-600',
    statusBg: 'bg-green-100',
    avatar: 'https://i.pravatar.cc/100?img=5',
    onlineDot: 'bg-green-500',
  },
  {
    name: 'Vignesh R',
    role: 'Frontend Developer',
    roleColor: 'text-blue-500',
    roleBg: 'bg-blue-50',
    team: 'Development Team',
    email: 'vignesh.r@company.com',
    phone: '+91 76543 21098',
    status: 'Active',
    statusColor: 'text-green-600',
    statusBg: 'bg-green-100',
    avatar: 'https://i.pravatar.cc/100?img=12',
    onlineDot: 'bg-green-500',
  },
  {
    name: 'Sneha Patel',
    role: 'Content Writer',
    roleColor: 'text-purple-500',
    roleBg: 'bg-purple-50',
    team: 'Marketing Team',
    email: 'sneha.patel@company.com',
    phone: '+91 65432 10987',
    status: 'On Leave',
    statusColor: 'text-orange-500',
    statusBg: 'bg-orange-50',
    avatar: 'https://i.pravatar.cc/100?img=9',
    onlineDot: 'bg-orange-500',
  },
  {
    name: 'Karthik B',
    role: 'Backend Developer',
    roleColor: 'text-slate-600',
    roleBg: 'bg-slate-100',
    team: 'Development Team',
    email: 'karthik.b@company.com',
    phone: '+91 54321 09876',
    status: 'Inactive',
    statusColor: 'text-slate-600',
    statusBg: 'bg-slate-100',
    avatar: 'https://i.pravatar.cc/100?img=14',
    onlineDot: 'bg-slate-300',
  },
];

export default function TeamScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        
        {/* ── HEADER SECTION ── */}
        <View className="px-5 mb-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Team</Text>
            <Text className="text-slate-500 text-xs mt-1">Manage your team members and their activities</Text>
          </View>
          <TouchableOpacity className="bg-orange-500 flex-row items-center px-4 py-2.5 rounded-xl shadow-sm">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm ml-1">Add Member</Text>
          </TouchableOpacity>
        </View>

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
          <View className="flex-1 bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search team members..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
          </View>
          <TouchableOpacity className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
            <Ionicons name="filter" size={18} color="#64748b" />
            <Text className="text-slate-700 font-bold text-sm ml-2 mr-1">Filter</Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
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
          <Text className="text-slate-800 font-bold text-sm">Team Members (24)</Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-slate-500 text-xs font-medium mr-1">Sort by: Recent</Text>
            <Ionicons name="chevron-down" size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* ── TEAM LIST ── */}
        <View className="px-5">
          {team.map((member, idx) => (
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
          
          {/* Invite New Member Bottom Card */}
          <View className="bg-orange-50 rounded-[24px] p-5 mb-8 border border-orange-100 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-orange-500 items-center justify-center mr-4 shadow-sm shadow-orange-200">
              <Ionicons name="person-add" size={20} color="white" />
            </View>
            <View className="flex-1 mr-4">
              <Text className="text-slate-900 font-bold text-sm mb-1">Invite New Member</Text>
              <Text className="text-slate-500 text-[10px] leading-4">Add new member to your team and collaborate together.</Text>
            </View>
            <TouchableOpacity className="bg-white border border-orange-200 px-4 py-2 rounded-xl shadow-sm">
              <Text className="text-orange-600 font-bold text-[10px]">Invite Member</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}
