import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const stats = [
  { label: 'Total Tasks', value: '356', sub: 'All Tasks', icon: 'clipboard-outline', color: '#f97316', bg: 'bg-orange-50' },
  { label: 'In Progress', value: '128', sub: '35.9%', subColor: 'text-blue-500', icon: 'play-circle-outline', color: '#3b82f6', bg: 'bg-blue-50' },
  { label: 'Completed', value: '172', sub: '48.3%', subColor: 'text-green-500', icon: 'checkmark-circle-outline', color: '#10b981', bg: 'bg-green-50' },
  { label: 'Pending', value: '56', sub: '15.7%', subColor: 'text-purple-500', icon: 'time-outline', color: '#a855f7', bg: 'bg-purple-50' },
];

const filters = [
  { label: 'All Tasks', active: true, dot: '#f97316' },
  { label: 'In Progress', active: false, dot: '#3b82f6' },
  { label: 'Completed', active: false, dot: '#10b981' },
  { label: 'Pending', active: false, dot: '#a855f7' },
];

const tasks = [
  {
    title: 'Design Homepage UI',
    project: 'Website Redesign',
    projectColor: '#ea580c', // orange
    date: 'May 25, 2024',
    priority: 'High Priority',
    priorityColor: '#ef4444', // red
    status: 'In Progress',
    progress: 60,
    icon: 'desktop-outline',
    iconColor: '#ea580c',
    iconBg: 'bg-orange-50',
    progressColor: '#3b82f6',
    statusColor: 'text-blue-600',
    statusBg: 'bg-blue-100',
    avatar: 'https://i.pravatar.cc/100?img=11',
  },
  {
    title: 'API Integration',
    project: 'E-Commerce Platform',
    projectColor: '#3b82f6', // blue
    date: 'May 22, 2024',
    priority: 'Medium Priority',
    priorityColor: '#f59e0b', // amber
    status: 'In Progress',
    progress: 40,
    icon: 'code-slash-outline',
    iconColor: '#3b82f6',
    iconBg: 'bg-blue-50',
    progressColor: '#3b82f6',
    statusColor: 'text-blue-600',
    statusBg: 'bg-blue-100',
    avatar: 'https://i.pravatar.cc/100?img=12',
  },
  {
    title: 'Testing & Bug Fixes',
    project: 'Mobile App Development',
    projectColor: '#10b981', // green
    date: 'May 28, 2024',
    priority: 'High Priority',
    priorityColor: '#ef4444', // red
    status: 'Pending',
    progress: 0,
    icon: 'flask-outline',
    iconColor: '#10b981',
    iconBg: 'bg-green-50',
    progressColor: '#a855f7',
    statusColor: 'text-purple-600',
    statusBg: 'bg-purple-100',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    title: 'Create User Documentation',
    project: 'Admin Dashboard',
    projectColor: '#ea580c', // orange
    date: 'May 30, 2024',
    priority: 'Medium Priority',
    priorityColor: '#f59e0b', // amber
    status: 'Pending',
    progress: 10,
    icon: 'document-text-outline',
    iconColor: '#eab308',
    iconBg: 'bg-yellow-50',
    progressColor: '#a855f7',
    statusColor: 'text-purple-600',
    statusBg: 'bg-purple-100',
    avatar: 'https://i.pravatar.cc/100?img=8',
  },
  {
    title: 'Deploy to Production',
    project: 'E-Commerce Platform',
    projectColor: '#64748b', // slate
    date: 'May 18, 2024',
    priority: 'High Priority',
    priorityColor: '#ef4444', // red
    status: 'Completed',
    progress: 100,
    icon: 'checkmark-circle-outline',
    iconColor: '#10b981',
    iconBg: 'bg-green-50',
    progressColor: '#10b981',
    statusColor: 'text-green-600',
    statusBg: 'bg-green-100',
    avatar: 'https://i.pravatar.cc/100?img=9',
  },
];

export default function TasksScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      
      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        
        {/* ── HEADER SECTION ── */}
        <View className="px-5 mb-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-slate-900 text-3xl font-black tracking-tight">Tasks</Text>
            <Text className="text-slate-500 text-xs mt-1">Organize, track and complete tasks efficiently</Text>
          </View>
          <TouchableOpacity className="bg-orange-500 flex-row items-center px-4 py-2.5 rounded-xl shadow-sm">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm ml-1">New Task</Text>
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
              placeholder="Search tasks..."
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
                {filter.active ? (
                  <Ionicons name="grid" size={14} color="#f97316" className="mr-2" />
                ) : (
                  <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: filter.dot }} />
                )}
                <Text className={`text-xs font-bold ${filter.active ? 'text-orange-600 ml-1.5' : 'text-slate-600'}`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Priority Dropdown Pill */}
            <TouchableOpacity className="flex-row items-center px-4 py-2 rounded-full border border-slate-200 bg-white ml-2">
              <Text className="text-slate-600 text-xs font-bold mr-1.5">Priority</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── TASK LIST ── */}
        <View className="px-5">
          {tasks.map((task, idx) => (
            <View key={idx} className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm">
              <View className="flex-row justify-between mb-4">
                {/* Left block */}
                <View className="flex-row flex-1">
                  <View className={`w-14 h-14 rounded-[18px] ${task.iconBg} items-center justify-center mr-4`}>
                    <Ionicons name={task.icon as any} size={28} color={task.iconColor} />
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="text-slate-900 font-bold text-[15px] mb-1.5" numberOfLines={1}>{task.title}</Text>
                    
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="document-text-outline" size={11} color="#94a3b8" />
                      <Text className="text-slate-500 text-[10px] ml-1">
                        Project: <Text style={{ color: task.projectColor, fontWeight: '600' }}>{task.project}</Text>
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
                      <Text className="text-slate-500 text-[10px] ml-1 mr-3">Due: {task.date}</Text>
                      
                      <Ionicons name="flag-outline" size={11} color={task.priorityColor} />
                      <Text className="text-[10px] font-bold ml-1" style={{ color: task.priorityColor }}>{task.priority}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Right block: Status badge, menu, avatar */}
                <View className="justify-between items-end ml-2 h-[56px] py-0.5">
                  <View className="flex-row items-center">
                    <View className={`px-2 py-1 rounded-md ${task.statusBg} mr-2`}>
                      <Text className={`text-[9px] font-bold ${task.statusColor}`}>{task.status}</Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  <Image source={{ uri: task.avatar }} className="w-6 h-6 rounded-full bg-slate-200 mt-auto" />
                </View>
              </View>

              {/* Progress Bar */}
              <View className="flex-row items-center mt-2">
                <View className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden mr-3">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${task.progress === 0 ? 3 : task.progress}%`, backgroundColor: task.progress === 0 ? 'transparent' : task.progressColor }}
                  />
                </View>
                <Text className="font-bold text-[10px]" style={{ color: task.progressColor }}>
                  {task.progress}%
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}
