import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

type Dashboard = {
  employee?: { first_name?: string; employee_code?: string };
  attendance?: { checkIn?: string | null; presentDays?: number; hoursThisWeek?: number };
  leaveBalance?: number;
  leaves?: { pendingCount?: number; recent?: { leave_type?: string; from_date?: string; no_of_days?: string | number; status?: string }[] };
  meetings?: { upcoming?: { id?: string | number; title?: string; startDate?: string }[] };
  payroll?: { nextPayDate?: string; nextSalary?: string };
  projects?: { activeCount?: number; activeList?: { name?: string; progress?: number; due?: string }[] };
  tasks?: { assigned?: number; completed?: number; today?: { task_name?: string; title?: string; status?: string }[] };
};

const dateLabel = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function Metric({ label, value, icon, color, background }: { label: string; value: string | number; icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; background: string }) {
  return <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: background }}><Ionicons name={icon} size={20} color={color} /></View><Text className="mt-3 text-xs font-semibold text-slate-500">{label}</Text><Text className="mt-1 text-2xl font-black text-slate-900">{value}</Text></View>;
}

export default function EmployeeScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      setError("");
      let response;
      let lastError;
      for (const endpoint of ["/employee/dashboard", "/dashboard/employee"]) {
        try { response = await api.get(endpoint); break; } catch (requestError) { lastError = requestError; }
      }
      if (!response) throw lastError || new Error("Dashboard request failed");
      setDashboard(response.data?.data || response.data || null);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const employee = dashboard?.employee;
  const attendance = dashboard?.attendance || {};
  const leaves = dashboard?.leaves || {};
  const tasks = dashboard?.tasks || {};
  const projects = dashboard?.projects || {};
  const payroll = dashboard?.payroll || {};
  const displayName = employee?.first_name || user?.first_name || user?.name || user?.full_name || user?.username || "Employee";

  return <View className="flex-1 bg-slate-50">
    <TopHeader title="Employee" subtitle="Daily workspace" />
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} tintColor="#2563eb" />}>
      {loading ? <View className="items-center py-24"><ActivityIndicator size="large" color="#2563eb" /><Text className="mt-3 text-sm text-slate-500">Loading your dashboard...</Text></View> : error ? <View className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><Text className="font-semibold text-rose-700">{error}</Text><Pressable onPress={() => fetchDashboard()} className="mt-4 self-start rounded-xl bg-rose-600 px-4 py-2"><Text className="font-bold text-white">Try again</Text></Pressable></View> : <>
        <View className="flex-row items-start justify-between"><View className="flex-1"><Text className="text-sm text-slate-500">Welcome back,</Text><Text className="mt-1 text-3xl font-black text-slate-950">{displayName}</Text><Text className="mt-2 text-sm text-slate-500">Here&apos;s what&apos;s happening today.</Text></View><Pressable onPress={() => fetchDashboard(true)} accessibilityLabel="Refresh dashboard" className="rounded-xl bg-white p-3"><Ionicons name="refresh-outline" size={20} color="#64748b" /></Pressable></View>
        <View className="mt-6 rounded-3xl bg-blue-600 p-5"><Text className="text-xs font-bold uppercase tracking-widest text-blue-100">Today&apos;s overview</Text><Text className="mt-2 text-2xl font-black text-white">Stay on top of your work</Text><Text className="mt-1 text-sm text-blue-100">{employee?.employee_code || user?.employee_code || "Employee workspace"}</Text><View className="mt-5 flex-row gap-3"><View className="flex-1 rounded-2xl bg-white/15 p-3"><Text className="text-xs text-blue-100">Check in</Text><Text className="mt-1 text-lg font-black text-white">{attendance.checkIn || "Not marked"}</Text></View><View className="flex-1 rounded-2xl bg-white/15 p-3"><Text className="text-xs text-blue-100">Hours this week</Text><Text className="mt-1 text-lg font-black text-white">{attendance.hoursThisWeek ?? 0}h</Text></View></View></View>
        <View className="mt-5 flex-row gap-3"><Metric label="Assigned tasks" value={tasks.assigned ?? 0} icon="checkmark-circle-outline" color="#2563eb" background="#eff6ff" /><Metric label="Completed" value={tasks.completed ?? 0} icon="checkmark-done-outline" color="#16a34a" background="#f0fdf4" /></View>
        <View className="mt-3 flex-row gap-3"><Metric label="Present days" value={attendance.presentDays ?? 0} icon="calendar-outline" color="#7c3aed" background="#f5f3ff" /><Metric label="Leave balance" value={dashboard?.leaveBalance ?? 0} icon="airplane-outline" color="#ea580c" background="#fff7ed" /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Today&apos;s tasks</Text><View className="gap-3">{tasks.today?.length ? tasks.today.map((task, index) => <View key={`${task.task_name || task.title}-${index}`} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Ionicons name="clipboard-outline" size={20} color="#2563eb" /></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900" numberOfLines={1}>{task.task_name || task.title || "Assigned task"}</Text><Text className="mt-1 text-xs text-slate-500">{task.status || "Pending"}</Text></View><Ionicons name="chevron-forward" size={18} color="#94a3b8" /></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No tasks scheduled for today.</Text></View>}</View>
        <View className="mt-7 flex-row items-center justify-between"><Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Active projects</Text><Text className="text-xs font-semibold text-slate-400">{projects.activeCount ?? 0} active</Text></View><View className="mt-3 gap-3">{projects.activeList?.length ? projects.activeList.slice(0, 3).map((project, index) => <View key={`${project.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4"><View className="flex-row items-center justify-between"><Text className="flex-1 font-bold text-slate-900" numberOfLines={1}>{project.name || "Project"}</Text><Text className="ml-3 text-xs font-bold text-blue-600">{project.progress ?? 0}%</Text></View><View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><View className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, Number(project.progress || 0)))}%` }} /></View><Text className="mt-2 text-xs text-slate-500">Due {project.due || "-"}</Text></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No active projects.</Text></View>}</View>
        <View className="mt-7 flex-row gap-3"><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="cash-outline" size={22} color="#16a34a" /><Text className="mt-3 text-xs text-slate-500">Next salary</Text><Text className="mt-1 text-lg font-black text-slate-900">{payroll.nextSalary || "-"}</Text><Text className="mt-1 text-xs text-slate-500">{payroll.nextPayDate || "Pay date unavailable"}</Text></View><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="notifications-outline" size={22} color="#7c3aed" /><Text className="mt-3 text-xs text-slate-500">Pending leave</Text><Text className="mt-1 text-lg font-black text-slate-900">{leaves.pendingCount ?? 0}</Text><Text className="mt-1 text-xs text-slate-500">Requests awaiting review</Text></View></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Recent leave</Text><View className="gap-3">{leaves.recent?.length ? leaves.recent.slice(0, 4).map((leave, index) => <View key={`${leave.leave_type}-${index}`} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50"><Ionicons name="calendar-clear-outline" size={20} color="#ea580c" /></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{leave.leave_type || "Leave"}</Text><Text className="mt-1 text-xs text-slate-500">{dateLabel(leave.from_date)} · {leave.no_of_days || 0} day(s)</Text></View><Text className={`text-xs font-bold ${leave.status === "Approved" ? "text-emerald-600" : leave.status === "Rejected" ? "text-rose-600" : "text-orange-600"}`}>{leave.status || "Pending"}</Text></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No recent leave requests.</Text></View>}</View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Upcoming meetings</Text><View className="gap-3">{dashboard?.meetings?.upcoming?.length ? dashboard.meetings.upcoming.slice(0, 3).map((meeting, index) => <View key={meeting.id || index} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50"><Ionicons name="calendar-outline" size={20} color="#7c3aed" /></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{meeting.title || "Meeting"}</Text><Text className="mt-1 text-xs text-slate-500">{dateLabel(meeting.startDate)}</Text></View></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No upcoming meetings.</Text></View>}</View>
      </>}
    </ScrollView>
    <BottomHome />
  </View>;
}
