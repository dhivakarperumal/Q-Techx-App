import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users, FolderKanban, CheckSquare, GraduationCap, BookOpen,
  DollarSign, CalendarOff, ClipboardCheck, TrendingUp,
  TrendingDown, ArrowUpRight, Clock, CheckCircle2,
  UserPlus, Briefcase, Activity, Calendar, ChevronDown, Settings
} from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';

// Restore the missing header and bottom bar
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const useAuth = () => ({ profileName: 'Admin User' });
const useAdmin = () => ({ getDashboardData: async () => ({}) });

const { width } = Dimensions.get('window');

/* ─── Helpers ─── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

/* ─── Components ─── */
const StatCard = ({ icon: Icon, label, value, change, changeType, color, bgColor }: any) => (
  <View className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm mb-4 w-[48%]">
    <View className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${bgColor}`} />
    
    <View className="flex-row items-center justify-between mb-4 relative">
      <View className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} ring-1 ring-slate-100`}>
        <Icon size={18} color={color.includes('emerald') ? '#10b981' : color.includes('blue') ? '#3b82f6' : color.includes('primary') || color.includes('orange') ? '#f97316' : '#8b5cf6'} />
      </View>
    </View>

    <View className="mb-2">
      <Text className="text-2xl font-bold text-slate-900 tracking-tight">{value}</Text>
    </View>
    
    <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2">{label}</Text>

    {change !== undefined && (
      <View className={`self-start flex-row items-center gap-1 px-2 py-1 rounded-full ${changeType === 'up' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
        {changeType === 'up' ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#f43f5e" />}
        <Text className={changeType === 'up' ? 'text-emerald-600 text-[10px] font-semibold' : 'text-rose-600 text-[10px] font-semibold'}>
          {change}
        </Text>
      </View>
    )}
  </View>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { profileName } = useAuth();
  const name = profileName?.split(' ')[0] || 'Admin';
  const { getDashboardData } = useAdmin();
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardData();
        if (mounted) setDashboard(data);
      } catch (err) { }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = [
    { icon: Users, label: 'Total Employees', value: dashboard ? String(dashboard.totalEmployees || 0) : '—', change: '+3 this month', changeType: 'up', color: 'bg-blue-100', bgColor: 'bg-blue-500' },
    { icon: FolderKanban, label: 'Active Projects', value: dashboard ? String(dashboard.activeProjects || 0) : '—', change: '+2 new', changeType: 'up', color: 'bg-orange-100', bgColor: 'bg-orange-500' },
    { icon: ClipboardCheck, label: 'Total Tasks', value: dashboard ? String(dashboard.totalTasks || 0) : '—', change: '7 new', changeType: 'up', color: 'bg-purple-100', bgColor: 'bg-purple-500' },
    { icon: GraduationCap, label: 'Trainees', value: dashboard ? String(dashboard.activeTrainees || 0) : '—', change: '+5 this week', changeType: 'up', color: 'bg-teal-100', bgColor: 'bg-teal-500' },
  ];

  const quickActions = [
    { label: 'Employee', icon: UserPlus, path: '/admin/employees/add' },
    { label: 'Project', icon: FolderKanban, path: '/admin/projects/add' },
    { label: 'Payroll', icon: DollarSign, path: '/admin/expenses' },
    { label: 'Calendar', icon: Calendar, path: '/admin/office-calendar' },
  ];

  const lineData = [
    { value: 10, label: '1 May' },
    { value: 40, label: '6 May' },
    { value: 55, label: '11 May' },
    { value: 80, label: '16 May' },
    { value: 70, label: '21 May' },
    { value: 110, label: '26 May' },
    { value: 140, label: '31 May' },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Admin" subtitle="Management workspace" />
      
      <ScrollView className="flex-1" contentContainerClassName="p-5 pb-32">
        
        {/* ── GREETING BANNER ── */}
        <View className="rounded-[28px] overflow-hidden p-6 border border-slate-200 bg-white shadow-sm mb-6 mt-4">
          <View className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <Text className="text-orange-600 text-xs font-bold mb-1 uppercase tracking-widest">{today}</Text>
          <Text className="text-slate-900 text-3xl font-bold tracking-tight">{greeting()}, {name}!</Text>
          <Text className="text-slate-500 text-sm mt-2 leading-5">Welcome to your command center. Everything looks good today.</Text>

          <View className="flex-row justify-between mt-6">
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <TouchableOpacity key={index} onPress={() => action.path && router.push(action.path as any)} className="items-center justify-center">
                  <View className="w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100 mb-2">
                    <ActionIcon size={20} color="#475569" />
                  </View>
                  <Text className="text-[10px] text-slate-600 font-medium">{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── FINANCIAL OVERVIEW ── */}
        <View className="mb-6">
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="text-slate-900 font-bold text-lg">Financial Overview</Text>
              <Text className="text-xs text-emerald-600 mt-1 uppercase tracking-widest font-semibold">Live Insights</Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="rounded-[24px] border border-sky-100 bg-sky-50 p-5 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="text-[11px] text-sky-700 uppercase tracking-widest font-bold">Project Payments</Text>
                <Text className="text-2xl font-black text-slate-900 mt-1">₹1,50,000</Text>
              </View>
              <View className="w-12 h-12 rounded-[20px] bg-sky-100 items-center justify-center">
                <DollarSign size={22} color="#0284c7" />
              </View>
            </View>

            <View className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="text-[11px] text-emerald-700 uppercase tracking-widest font-bold">Other Incomes</Text>
                <Text className="text-2xl font-black text-slate-900 mt-1">₹40,000</Text>
              </View>
              <View className="w-12 h-12 rounded-[20px] bg-emerald-100 items-center justify-center">
                <DollarSign size={22} color="#059669" />
              </View>
            </View>
          </View>
        </View>

        {/* ── STAT CARDS GRID ── */}
        <View className="mb-2">
          <Text className="text-slate-900 font-bold text-lg mb-4">Key Metrics</Text>
          <View className="flex-row flex-wrap justify-between">
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </View>
        </View>

        {/* ── CHARTS ── */}
        <View className="mb-6">
          <Text className="text-slate-900 font-bold text-lg mb-4">Company Overview</Text>
          <View className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-sm">
            <LineChart 
              data={lineData}
              width={width - 100}
              height={180}
              color="#10b981"
              thickness={3}
              dataPointsColor="#10b981"
              dataPointsRadius={4}
              hideRules
              yAxisTextStyle={{color: '#64748b', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#64748b', fontSize: 10}}
              initialSpacing={10}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-slate-900 font-bold text-lg mb-4">Tasks Breakdown</Text>
          <View className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-sm">
            <BarChart 
              data={[
                {value: 178, label: 'Done', frontColor: '#f97316'},
                {value: 48, label: 'Prog', frontColor: '#94a3b8'},
                {value: 16, label: 'Pend', frontColor: '#cbd5e1'}
              ]}
              width={width - 120}
              height={160}
              barWidth={35}
              barBorderRadius={8}
              hideRules
              yAxisTextStyle={{color: '#64748b', fontSize: 10}}
              xAxisLabelTextStyle={{color: '#64748b', fontSize: 10}}
            />
          </View>
        </View>

      </ScrollView>

      {/* Restore Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}