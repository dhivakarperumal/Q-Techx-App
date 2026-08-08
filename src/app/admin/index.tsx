import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";
import { LinearGradient } from 'expo-linear-gradient';

const quickActions = [
  { label: 'Users', icon: 'people', color: '#f97316' },
  { label: 'Projects', icon: 'folder', color: '#3b82f6' },
  { label: 'Tasks', icon: 'checkmark-square', color: '#10b981' },
  { label: 'Reports', icon: 'pie-chart', color: '#8b5cf6' },
  { label: 'Messages', icon: 'chatbubble-ellipses', color: '#d946ef' },
  { label: 'Invoices', icon: 'document-text', color: '#f97316' },
  { label: 'Settings', icon: 'settings', color: '#64748b' },
  { label: 'Activity Log', icon: 'list', color: '#ef4444' },
];

const recentActivity = [
  {
    title: 'New user registered',
    subtitle: 'John Doe joined the system',
    time: '10:30 AM',
    icon: 'people',
    iconBg: 'bg-green-100',
    iconColor: '#10b981',
    statusDot: 'bg-green-500',
  },
  {
    title: 'Project "Website Redesign" created',
    subtitle: 'By Admin',
    time: '09:15 AM',
    icon: 'folder',
    iconBg: 'bg-blue-100',
    iconColor: '#3b82f6',
    statusDot: 'bg-blue-500',
  },
  {
    title: 'Task completed',
    subtitle: 'Design homepage UI',
    time: 'Yesterday',
    icon: 'checkbox',
    iconBg: 'bg-orange-100',
    iconColor: '#f97316',
    statusDot: 'bg-orange-500',
  },
];

const dashboardStats = [
  { label: 'Total Employees', value: '248', icon: 'people', color: '#f97316', background: 'bg-orange-50' },
  { label: 'Active Projects', value: '24', icon: 'briefcase', color: '#3b82f6', background: 'bg-blue-50' },
  { label: 'Total Tasks', value: '356', icon: 'checkmark-square', color: '#10b981', background: 'bg-green-50' },
  { label: 'Active Trainees', value: '42', icon: 'school', color: '#8b5cf6', background: 'bg-purple-50' },
  { label: 'Internship Students', value: '18', icon: 'book', color: '#d946ef', background: 'bg-fuchsia-50' },
  { label: 'Monthly Payroll', value: '₹2.45M', icon: 'cash', color: '#0f766e', background: 'bg-teal-50' },
  { label: 'Pending Follow-ups', value: '12', icon: 'chatbubbles', color: '#ef4444', background: 'bg-red-50' },
  { label: 'Attendance Today', value: '92%', icon: 'calendar', color: '#2563eb', background: 'bg-indigo-50' },
];

export default function AdminDashboard() {
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-32 pt-2">
        
        {/* ── GREETING SECTION ── */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-slate-600 text-lg">Welcome back,</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-900 text-3xl font-black mr-2">Admin</Text>
              <Ionicons name="checkmark-circle" size={24} color="#f97316" />
            </View>
            <Text className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening today.</Text>
          </View>
          
          {/* Logo Placeholder */}
          <View className="w-20 h-20 rounded-full bg-white shadow-xl shadow-slate-200/50 items-center justify-center border-4 border-slate-50">
            <Ionicons name="shield-checkmark" size={40} color="#f97316" />
          </View>
        </View>

        {/* ── ORANGE DASHBOARD CARD ── */}
        <LinearGradient
          colors={['#ff8a00', '#e52e71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#f97316', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
        >
          <View className="flex-1">
            <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="stats-chart" size={20} color="#fff" />
            </View>
            <Text className="text-white font-bold text-lg mb-1">Dashboard Overview</Text>
            <Text className="text-white/80 text-xs pr-4 leading-5">Monitor your system and manage everything with ease.</Text>
          </View>
          
          <TouchableOpacity className="bg-white px-4 py-2.5 rounded-full flex-row items-center self-center shadow-sm">
            <Text className="text-orange-600 font-bold text-xs mr-1">View Reports</Text>
            <Ionicons name="chevron-forward" size={14} color="#ea580c" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── DASHBOARD STAT CARDS ── */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {dashboardStats.map((stat) => (
            <View key={stat.label} className="w-[48%] bg-white rounded-3xl p-4 mb-4 shadow-sm border border-slate-100">
              <View className={`w-12 h-12 ${stat.background} rounded-2xl items-center justify-center mb-3`}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text className="text-slate-500 font-bold text-xs mb-1">{stat.label}</Text>
              <Text className="text-slate-900 font-black text-2xl tracking-tight">{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-800 font-bold text-lg">Quick Actions</Text>
            <TouchableOpacity>
              <Text className="text-orange-500 font-bold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} className="w-[23%] bg-white rounded-[20px] p-3 items-center justify-center shadow-sm border border-slate-100 mb-3" style={{ height: 90 }}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
                <Text className="text-slate-700 text-[10px] font-bold mt-2 text-center">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-800 font-bold text-lg">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-orange-500 font-bold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
            {recentActivity.map((activity, index) => (
              <View key={index} className={`flex-row items-center py-4 px-3 ${index !== recentActivity.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <View className={`w-12 h-12 rounded-2xl ${activity.iconBg} items-center justify-center mr-4`}>
                  <Ionicons name={activity.icon as any} size={20} color={activity.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-sm mb-1">{activity.title}</Text>
                  <Text className="text-slate-500 text-xs">{activity.subtitle}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-[10px] font-medium mb-2">{activity.time}</Text>
                  <View className={`w-2 h-2 rounded-full ${activity.statusDot}`} />
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}