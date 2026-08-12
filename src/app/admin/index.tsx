import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

type CountItem = { status?: string; current_status?: string; follow_up_status?: string; type?: string; count?: number | string };
type DashboardData = {
  totalEmployees?: number | string; activeProjects?: number | string; totalTasks?: number | string;
  activeTrainees?: number | string; internshipStudents?: number | string; monthlyPayroll?: number | string;
  currentMonthIncome?: number | string; currentMonthIncomes?: number | string; currentMonthProjectPayments?: number | string;
  attendanceToday?: { present?: number | string; total?: number | string };
  clientStats?: { total?: number | string; pendingFollowUps?: number | string };
  traineeStats?: CountItem[]; taskStats?: CountItem[]; projectStats?: CountItem[]; clientFollowUps?: CountItem[];
  recentActivity?: { title?: string; meta?: string; time?: string; user?: string }[];
  overviewData?: { name?: string; employees?: number | string; projects?: number | string; income?: number | string }[];
  upcomingEvents?: { title?: string; startDate?: string; startTime?: string; eventType?: string }[];
};

const palette = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ec4899", "#64748b"];
const valueOf = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = (value: unknown) => valueOf(value) >= 100000 ? `Rs ${(valueOf(value) / 100000).toFixed(1)}L` : `Rs ${valueOf(value).toLocaleString("en-IN")}`;
const dateLabel = (value?: string) => { if (!value) return "No date"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }); };

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-black text-black">{title}</Text>{action && <Pressable onPress={onPress}><Text className="text-xs font-bold text-orange-500">{action}</Text></Pressable>}</View>;
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
  background?: string;
}) {
  return (
    <View
      className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white border border-orange-100"
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
        className="px-4 py-4"
      >
        <View className="flex-row items-center mb-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Ionicons name={icon} size={20} color="#f97316" />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={2}>
              {label}
            </Text>
          </View>
        </View>
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[22px] font-black text-black">
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatusList({ items, labelKey }: { items: CountItem[]; labelKey: "status" | "current_status" | "follow_up_status" | "type" }) {
  const total = items.reduce((sum, item) => sum + valueOf(item.count), 0);
  if (!items.length) return <Text className="text-sm text-gray-400">No data available yet.</Text>;
  return <View className="gap-3">{items.slice(0, 5).map((item, index) => { const count = valueOf(item.count); return <View key={`${item[labelKey]}-${index}`}><View className="mb-1 flex-row items-center justify-between"><View className="flex-row items-center gap-2"><View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} /><Text className="text-xs font-semibold text-gray-600">{item[labelKey] || "Unknown"}</Text></View><Text className="text-xs font-black text-black">{count}</Text></View><View className="h-2 overflow-hidden rounded-full bg-gray-100"><View className="h-full rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%`, backgroundColor: palette[index % palette.length] }} /></View></View>; })}</View>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const fetchDashboard = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); try { const response = await api.get("/dashboard"); setDashboard(response.data?.data || response.data || null); setError(""); } catch (requestError: any) { setError(requestError?.message || "Unable to load dashboard data."); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { fetchDashboard(); const interval = setInterval(() => fetchDashboard(true), 30000); return () => clearInterval(interval); }, [fetchDashboard]);

  const displayName = String(user?.name || user?.full_name || user?.first_name || "Admin").split(" ")[0];
  const attendance = dashboard?.attendanceToday;
  const income = valueOf(dashboard?.currentMonthIncome);
  const targetPercentage = Math.min(Math.round((income / 500000) * 100), 100);
  const overview = dashboard?.overviewData || [];
  const maxIncome = Math.max(...overview.map((entry) => valueOf(entry.income)), 1);
  const traineeTotal = useMemo(() => (dashboard?.traineeStats || []).reduce((sum, item) => sum + valueOf(item.count), 0), [dashboard?.traineeStats]);
  const stats = [["people", "Total Employees", String(valueOf(dashboard?.totalEmployees)), "#2563eb", "#eff6ff"], ["folder", "Active Projects", String(valueOf(dashboard?.activeProjects)), "#f97316", "#fff7ed"], ["checkbox", "Total Tasks", String(valueOf(dashboard?.totalTasks)), "#10b981", "#ecfdf5"], ["school", "Active Trainees", String(valueOf(dashboard?.activeTrainees)), "#8b5cf6", "#f5f3ff"], ["book", "Intern Students", String(valueOf(dashboard?.internshipStudents)), "#ec4899", "#fdf2f8"], ["cash", "Monthly Payroll", money(dashboard?.monthlyPayroll), "#0f766e", "#f0fdfa"], ["chatbubbles", "Pending Follow-ups", String(valueOf(dashboard?.clientStats?.pendingFollowUps)), "#dc2626", "#fef2f2"], ["calendar", "Attendance Today", `${valueOf(attendance?.present)}/${valueOf(attendance?.total)}`, "#2563eb", "#eff6ff"]] as const;

  return <View className="flex-1 bg-white"><TopHeader /><ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} tintColor="#f97316" />}>
    <View className="mb-5 flex-row items-end justify-between"><View className="flex-1 pr-3"><Text className="text-xs font-bold uppercase tracking-[2px] text-orange-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}</Text><Text className="mt-1 text-3xl font-black text-black">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {displayName}</Text><Text className="mt-1 text-sm text-gray-500">Your command center at a glance.</Text></View><View className="h-14 w-14 items-center justify-center rounded-2xl bg-black shadow-lg"><Ionicons name="pulse" size={28} color="#f97316" /></View></View>
    <LinearGradient colors={["#ea580c", "#171717"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="mb-5 overflow-hidden rounded-[28px] p-5 shadow-lg shadow-black/30 border border-white/10"><View className="flex-row items-start justify-between"><View className="flex-1 pr-4"><Text className="text-xs font-bold uppercase tracking-[2px] text-orange-200">Financial Overview</Text><Text className="mt-2 text-2xl font-black text-white">Revenue Insights</Text><Text className="mt-1 text-sm text-gray-300">Live income and payroll snapshot.</Text></View><View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><Ionicons name="trending-up" size={22} color="#ffffff" /></View></View><View className="mt-5 flex-row gap-3"><View className="flex-1 rounded-2xl bg-white/10 p-3 border border-white/5"><Text className="text-[10px] font-bold uppercase text-orange-200/80">Income</Text><Text className="mt-1 text-xl font-black text-white">{money(income)}</Text></View><View className="flex-1 rounded-2xl bg-white/10 p-3 border border-white/5"><Text className="text-[10px] font-bold uppercase text-orange-200/80">Payroll</Text><Text className="mt-1 text-xl font-black text-white">{money(dashboard?.monthlyPayroll)}</Text></View></View><View className="mt-4"><View className="mb-1 flex-row justify-between"><Text className="text-[10px] font-bold text-gray-400">Monthly target: Rs 5.0L</Text><Text className="text-[10px] font-black text-orange-400">{targetPercentage}%</Text></View><View className="h-2 overflow-hidden rounded-full bg-black/40"><View className="h-full rounded-full bg-orange-500" style={{ width: `${targetPercentage}%` }} /></View></View></LinearGradient>
    {loading ? <View className="items-center py-12"><ActivityIndicator size="large" color="#f97316" /><Text className="mt-3 text-sm text-gray-500">Loading dashboard...</Text></View> : error ? <View className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4"><Text className="font-semibold text-rose-700">{error}</Text><Pressable onPress={() => fetchDashboard()} className="mt-3 self-start rounded-xl bg-rose-600 px-4 py-2"><Text className="font-bold text-white">Try again</Text></Pressable></View> : null}
    <View className="mb-3 flex-row flex-wrap justify-between">{stats.map(([icon, label, value, color, background]) => <MetricCard key={label} icon={icon} label={label} value={loading ? "-" : value} color={color} background={background} />)}</View>
    <View className="mb-5 overflow-hidden rounded-3xl bg-white shadow-md">
      {/* Orange top accent */}
      <LinearGradient
        colors={["#fb923c", "#f97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-0.5 w-full"
      />

      {/* Header */}
      <View className="bg-white px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
              <Ionicons name="stats-chart" size={19} color="#f97316" />
            </View>

            <View className="ml-3">
              <Text className="text-base font-black text-black">
                Company Overview
              </Text>
              <Text className="mt-0.5 text-[10px] text-gray-400">
                Performance snapshot
              </Text>
            </View>
          </View>

        </View>
      </View>

      {/* Chart */}
      <View className="px-5 pb-5">
        <View className="h-32 flex-row items-end gap-2 border-b border-gray-100 pb-2">
          {overview.length === 0 ? (
            <Text className="self-center text-sm text-gray-400">
              No overview data available.
            </Text>
          ) : (
            overview.map((entry, index) => (
              <View
                key={`${entry.name}-${index}`}
                className="flex-1 items-center"
              >
                <LinearGradient
                  colors={["#fb923c", "#f97316"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="w-full rounded-t-xl"
                  style={{
                    height: Math.max(
                      8,
                      (valueOf(entry.income) / maxIncome) * 105
                    ),
                  }}
                />

                <Text
                  className="mt-2 text-[9px] font-medium text-gray-400"
                  numberOfLines={1}
                >
                  {entry.name?.split(" ")[0]}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom stats */}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-orange-50 p-3">
            <Text className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
              Income
            </Text>
            <Text className="mt-1 text-sm font-black text-orange-500">
              {money(income)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-gray-50 p-3">
            <Text className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
              Projects
            </Text>
            <Text className="mt-1 text-sm font-black text-black">
              {valueOf(dashboard?.activeProjects)}
            </Text>
          </View>
        </View>
      </View>
    </View>

    <LinearGradient
      colors={["#ffffff", "#fff7ed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="mb-5 overflow-hidden rounded-3xl shadow-md"
    >
      {/* Orange top accent */}
      <LinearGradient
        colors={["#fb923c", "#f97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-0.5 w-full"
      />

      <View className="p-5">
        <SectionHeader title="Trainee & Interns" />

        <View className="flex-row items-center">
          {/* Total */}
          <View className="h-24 w-24 items-center justify-center rounded-full border-[10px] border-orange-500 bg-white">
            <Text className="text-xl font-black text-black">
              {traineeTotal}
            </Text>
          </View>

          {/* Status */}
          <View className="ml-5 flex-1">
            <StatusList
              items={dashboard?.traineeStats || []}
              labelKey="type"
            />
          </View>
        </View>
      </View>
    </LinearGradient>

    {/* <View className="overflow-hidden rounded-3xl bg-white shadow-md">
      <View className="h-1.5 w-full bg-orange-500" />

      <View className="p-5">
        <SectionHeader
          title="Task Status"
          action="View all"
          onPress={() => router.push("/admin/tasks")}
        />

        <StatusList
          items={dashboard?.taskStats || []}
          labelKey="status"
        />
      </View>
    </View> */}

    <View className="mb-4 overflow-hidden rounded-3xl bg-white shadow-md">
      <View className="h-0.5 w-full bg-orange-500" />

      <View className="p-5">
        <SectionHeader
          title="Upcoming Events"
          action="Calendar"
          onPress={() => router.push("/admin/calendar")}
        />

        {(dashboard?.upcomingEvents || []).length === 0 ? (
          <Text className="text-sm text-gray-400">
            No upcoming events.
          </Text>
        ) : (
          dashboard?.upcomingEvents?.map((event, index) => (
            <View
              key={`${event.title}-${index}`}
              className="mb-3 flex-row items-center rounded-2xl bg-gray-50 p-3"
            >
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-black">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#f97316"
                />
              </View>

              <View className="flex-1">
                <Text
                  className="font-bold text-black"
                  numberOfLines={1}
                >
                  {event.title || "Event"}
                </Text>

                <Text className="mt-1 text-xs text-gray-500">
                  {dateLabel(event.startDate)}
                  {event.startTime
                    ? ` - ${event.startTime}`
                    : " - All day"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#f97316"
              />
            </View>
          ))
        )}
      </View>
    </View>

    <LinearGradient
      colors={["#ffffff", "#fff7ed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="mb-5 overflow-hidden rounded-3xl shadow-md"
    >
      {/* Orange top accent */}
      <View className="h-0.5 w-full bg-orange-500" />

      <View className="p-5">
        <SectionHeader title="Recent Activity" />

        {(dashboard?.recentActivity || []).length === 0 ? (
          <Text className="text-sm text-gray-400">
            No recent activity found.
          </Text>
        ) : (
          dashboard?.recentActivity?.slice(0, 5).map((activity, index) => (
            <View
              key={`${activity.title}-${index}`}
              className="flex-row items-center border-b border-orange-100 py-3"
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-black">
                <Ionicons
                  name="pulse-outline"
                  size={18}
                  color="#f97316"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text
                  className="text-sm font-bold text-black"
                  numberOfLines={1}
                >
                  {activity.title || "Activity"}
                </Text>

                <Text
                  className="mt-1 text-[11px] text-gray-400"
                  numberOfLines={1}
                >
                  {activity.meta || activity.user || "System"} -{" "}
                  {activity.time
                    ? dateLabel(activity.time)
                    : "Recently"}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </LinearGradient>

  </ScrollView><AdminBottomBar /></View>;
}
