import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";
import { LinearGradient } from "expo-linear-gradient";

type Dashboard = {
  employee?: { first_name?: string; employee_code?: string };
  attendance?: {
    checkIn?: string | null;
    checkOut?: string | null;
    presentDays?: number;
    absentDays?: number;
    hoursThisWeek?: number;
  };
  leaveBalance?: number;
  leaves?: {
    pendingCount?: number;
    recent?: {
      leave_type?: string;
      from_date?: string;
      no_of_days?: string | number;
      status?: string;
    }[];
  };
  meetings?: {
    todayCount?: number;
    upcoming?: { id?: string | number; title?: string; startDate?: string }[];
  };
  payroll?: { nextPayDate?: string; nextSalary?: string };
  projects?: {
    activeCount?: number;
    activeList?: { name?: string; progress?: number; due?: string }[];
  };
  tasks?: {
    assigned?: number;
    completed?: number;
    today?: { task_name?: string; title?: string; status?: string }[];
  };
};

const dateLabel = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function Metric({
  label,
  value,
  icon,
  color,
  background,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  background: string;
}) {
  return (
    <View
      className="mb-3 w-[48%] overflow-hidden rounded-2xl border border-orange-100 bg-white"
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
        {/* Icon + Label */}
        <View className="mb-3 flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Ionicons
              name={icon}
              size={20}
              color="#f97316"
            />
          </View>

          <View className="ml-2 flex-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        </View>

        {/* Value */}
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[22px] font-black text-black">
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function EmployeeScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      let response;
      let lastError;
      for (const endpoint of ["/employee/dashboard", "/dashboard/employee"]) {
        try {
          response = await api.get(endpoint);
          break;
        } catch (requestError) {
          lastError = requestError;
        }
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

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const employee = dashboard?.employee;
  const attendance = dashboard?.attendance || {};
  const leaves = dashboard?.leaves || {};
  const tasks = dashboard?.tasks || {};
  const projects = dashboard?.projects || {};
  const payroll = dashboard?.payroll || {};
  const displayName =
    employee?.first_name ||
    user?.first_name ||
    user?.name ||
    user?.full_name ||
    user?.username ||
    "Employee";

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Employee" subtitle="Daily workspace" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
            tintColor="#2563eb"
          />
        }
      >
        {loading ? (
          <View className="items-center py-24">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-slate-500">
              Loading your dashboard...
            </Text>
          </View>
        ) : error ? (
          <View className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <Text className="font-semibold text-rose-700">{error}</Text>
            <Pressable
              onPress={() => fetchDashboard()}
              className="mt-4 self-start rounded-xl bg-rose-600 px-4 py-2"
            >
              <Text className="font-bold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={["#ea580c", "#171717"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mb-5 overflow-hidden rounded-[28px] border border-white/10 p-5"
            >
              {/* Header */}
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-orange-200">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>

                  <Text className="mt-2 text-2xl font-black text-white">
                    Good{" "}
                    {new Date().getHours() < 12
                      ? "Morning"
                      : new Date().getHours() < 17
                        ? "Afternoon"
                        : "Evening"}
                    , {displayName}!
                  </Text>

                  <Text className="mt-1 text-sm text-gray-300">
                    Here's your work summary for today.
                  </Text>
                </View>

                {/* Refresh */}
                <Pressable
                  onPress={() => fetchDashboard(true)}
                  accessibilityLabel="Refresh dashboard"
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={21}
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              {/* Attendance */}
              <View className="mt-5 flex-row gap-3">
                <View className="flex-1 rounded-2xl border border-white/5 bg-white/10 p-3">
                  <View className="mb-2 flex-row items-center">
                    <View className="h-8 w-8 items-center justify-center rounded-xl bg-black/40">
                      <Ionicons
                        name="log-in-outline"
                        size={17}
                        color="#fb923c"
                      />
                    </View>

                    <Text className="ml-2 text-[10px] font-bold uppercase text-orange-200">
                      Check-in
                    </Text>
                  </View>

                  <Text className="text-base font-black text-white">
                    {attendance.checkIn || "Not yet"}
                  </Text>
                </View>

                <View className="flex-1 rounded-2xl border border-white/5 bg-white/10 p-3">
                  <View className="mb-2 flex-row items-center">
                    <View className="h-8 w-8 items-center justify-center rounded-xl bg-black/40">
                      <Ionicons
                        name="log-out-outline"
                        size={17}
                        color="#fb923c"
                      />
                    </View>

                    <Text className="ml-2 text-[10px] font-bold uppercase text-orange-200">
                      Check-out
                    </Text>
                  </View>

                  <Text className="text-base font-black text-white">
                    {attendance.checkOut || "Not yet"}
                  </Text>
                </View>
              </View>

              {/* Leave Balance */}
              <View className="mt-3 flex-row items-center rounded-2xl border border-white/5 bg-white/10 p-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-black/40">
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#fb923c"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[10px] font-bold uppercase text-orange-200">
                    Leave Balance
                  </Text>

                  <Text className="mt-0.5 text-sm font-black text-white">
                    {dashboard?.leaveBalance ?? 0} days left
                  </Text>
                </View>
              </View>
            </LinearGradient>
            <View className="mt-5 flex-row gap-3">
              <Metric
                label="Attendance This Month"
                value={attendance.presentDays ?? 0}
                icon="clipboard-outline"
                color="#16a34a"
                background="#f0fdf4"
              />
              <Metric
                label="Tasks Assigned"
                value={tasks.assigned ?? 0}
                icon="checkbox-outline"
                color="#2563eb"
                background="#eff6ff"
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <Metric
                label="Active Projects"
                value={projects.activeCount ?? 0}
                icon="folder-outline"
                color="#ea580c"
                background="#fff7ed"
              />
              <Metric
                label="Hours This Week"
                value={`${attendance.hoursThisWeek ?? 0}h`}
                icon="time-outline"
                color="#7c3aed"
                background="#f5f3ff"
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <Metric
                label="Pending Leaves"
                value={leaves.pendingCount ?? 0}
                icon="calendar-clear-outline"
                color="#ca8a04"
                background="#fefce8"
              />
              <Metric
                label="Next Pay Date"
                value={payroll.nextPayDate || "N/A"}
                icon="cash-outline"
                color="#059669"
                background="#ecfdf5"
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <Metric
                label="Meetings Today"
                value={dashboard?.meetings?.todayCount ?? 0}
                icon="videocam-outline"
                color="#db2777"
                background="#fdf2f8"
              />
              <Metric
                label="Overdue Tasks"
                value={tasks.overdue ?? 0}
                icon="alert-circle-outline"
                color="#dc2626"
                background="#fef2f2"
              />
            </View>
            {/* Today's Tasks */}
            <View className="mb-5 mt-3 overflow-hidden rounded-3xl bg-white shadow-md">
              {/* Orange top accent */}
              <LinearGradient
                colors={["#fb923c", "#f97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-0.5 w-full"
              />

              <View className="p-5">
                {/* Header */}
                <View className="mb-4 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                      <Ionicons
                        name="checkbox-outline"
                        size={19}
                        color="#f97316"
                      />
                    </View>

                    <View className="ml-3">
                      <Text className="text-base font-black text-black">
                        Today&apos;s Tasks
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-gray-400">
                        Your assigned work
                      </Text>
                    </View>
                  </View>

                  {/* Task count */}
                  <View className="rounded-xl bg-orange-50 px-3 py-2">
                    <Text className="text-xs font-black text-orange-500">
                      {tasks.today?.length ?? 0}
                    </Text>
                  </View>
                </View>

                {/* Task List */}
                <View className="gap-3">
                  {tasks.today?.length ? (
                    tasks.today.map((task, index) => (
                      <View
                        key={`${task.task_name || task.title}-${index}`}
                        className="flex-row items-center rounded-2xl border border-orange-100 bg-orange-50/40 p-3"
                      >
                        {/* Task Icon */}
                        <View className="h-11 w-11 items-center justify-center rounded-xl bg-black">
                          <Ionicons
                            name="clipboard-outline"
                            size={19}
                            color="#f97316"
                          />
                        </View>

                        {/* Task Details */}
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-sm font-bold text-black"
                            numberOfLines={1}
                          >
                            {task.task_name || task.title || "Assigned task"}
                          </Text>

                          <Text
                            className="mt-1 text-[11px] font-medium text-gray-400"
                            numberOfLines={1}
                          >
                            {task.status || "Pending"}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View className="mr-2 rounded-lg bg-white px-2 py-1">
                          <Text className="text-[10px] font-bold text-orange-500">
                            {task.status || "Pending"}
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={17}
                          color="#f97316"
                        />
                      </View>
                    ))
                  ) : (
                    <View className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-6">
                      <View className="mb-2 items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-black">
                          <Ionicons
                            name="checkbox-outline"
                            size={22}
                            color="#f97316"
                          />
                        </View>
                      </View>

                      <Text className="text-center text-sm font-bold text-black">
                        No tasks scheduled for today
                      </Text>

                      <Text className="mt-1 text-center text-xs text-gray-400">
                        You&apos;re all caught up!
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Active Projects */}
            <View className="mb-5 overflow-hidden rounded-3xl bg-white shadow-md">
              {/* Orange top accent */}
              <LinearGradient
                colors={["#fb923c", "#f97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-0.5 w-full"
              />

              <View className="p-5">
                {/* Header */}
                <View className="mb-4 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                      <Ionicons
                        name="folder-outline"
                        size={19}
                        color="#f97316"
                      />
                    </View>

                    <View className="ml-3">
                      <Text className="text-base font-black text-black">
                        Active Projects
                      </Text>

                      <Text className="mt-0.5 text-[10px] text-gray-400">
                        Projects currently assigned to you
                      </Text>
                    </View>
                  </View>

                  {/* Active count */}
                  <View className="rounded-xl bg-orange-50 px-3 py-2">
                    <Text className="text-xs font-black text-orange-500">
                      {projects.activeCount ?? 0} active
                    </Text>
                  </View>
                </View>

                {/* Projects */}
                <View className="gap-3">
                  {projects.activeList?.length ? (
                    projects.activeList.slice(0, 3).map((project, index) => (
                      <View
                        key={`${project.name}-${index}`}
                        className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
                      >
                        {/* Project name + percentage */}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 pr-3">
                            <Text
                              className="text-sm font-bold text-black"
                              numberOfLines={1}
                            >
                              {project.name || "Project"}
                            </Text>

                            <Text className="mt-1 text-[10px] text-gray-400">
                              Project progress
                            </Text>
                          </View>

                          <View className="rounded-lg bg-white px-2.5 py-1">
                            <Text className="text-xs font-black text-orange-500">
                              {project.progress ?? 0}%
                            </Text>
                          </View>
                        </View>

                        {/* Progress bar */}
                        <View className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                          <LinearGradient
                            colors={["#fb923c", "#f97316"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(project.progress || 0))
                              )}%`,
                            }}
                          />
                        </View>

                        {/* Due date */}
                        <View className="mt-3 flex-row items-center">
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#f97316"
                          />

                          <Text className="ml-1.5 text-[11px] text-gray-500">
                            Due {project.due || "-"}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-6">
                      <View className="mb-2 items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-black">
                          <Ionicons
                            name="folder-outline"
                            size={22}
                            color="#f97316"
                          />
                        </View>
                      </View>

                      <Text className="text-center text-sm font-bold text-black">
                        No active projects
                      </Text>

                      <Text className="mt-1 text-center text-xs text-gray-400">
                        Your active projects will appear here.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View className="mt-3 gap-3">
              {projects.activeList?.length ? (
                projects.activeList.slice(0, 3).map((project, index) => (
                  <View
                    key={`${project.name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="flex-1 font-bold text-slate-900"
                        numberOfLines={1}
                      >
                        {project.name || "Project"}
                      </Text>
                      <Text className="ml-3 text-xs font-bold text-blue-600">
                        {project.progress ?? 0}%
                      </Text>
                    </View>
                    <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <View
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(100, Math.max(0, Number(project.progress || 0)))}%`,
                        }}
                      />
                    </View>
                    <Text className="mt-2 text-xs text-slate-500">
                      Due {project.due || "-"}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <Text className="text-center text-sm text-slate-500">
                    No active projects.
                  </Text>
                </View>
              )}
            </View>
            <View className="mt-7 flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                <Ionicons name="cash-outline" size={22} color="#16a34a" />
                <Text className="mt-3 text-xs text-slate-500">Next salary</Text>
                <Text className="mt-1 text-lg font-black text-slate-900">
                  {payroll.nextSalary || "-"}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {payroll.nextPayDate || "Pay date unavailable"}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#7c3aed"
                />
                <Text className="mt-3 text-xs text-slate-500">
                  Pending leave
                </Text>
                <Text className="mt-1 text-lg font-black text-slate-900">
                  {leaves.pendingCount ?? 0}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Requests awaiting review
                </Text>
              </View>
            </View>
            <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">
              Recent leave
            </Text>
            <View className="gap-3">
              {leaves.recent?.length ? (
                leaves.recent.slice(0, 4).map((leave, index) => (
                  <View
                    key={`${leave.leave_type}-${index}`}
                    className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                      <Ionicons
                        name="calendar-clear-outline"
                        size={20}
                        color="#ea580c"
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-slate-900">
                        {leave.leave_type || "Leave"}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        {dateLabel(leave.from_date)} · {leave.no_of_days || 0}{" "}
                        day(s)
                      </Text>
                    </View>
                    <Text
                      className={`text-xs font-bold ${leave.status === "Approved" ? "text-emerald-600" : leave.status === "Rejected" ? "text-rose-600" : "text-orange-600"}`}
                    >
                      {leave.status || "Pending"}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <Text className="text-center text-sm text-slate-500">
                    No recent leave requests.
                  </Text>
                </View>
              )}
            </View>
            <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">
              Upcoming meetings
            </Text>
            <View className="gap-3">
              {dashboard?.meetings?.upcoming?.length ? (
                dashboard.meetings.upcoming
                  .slice(0, 3)
                  .map((meeting, index) => (
                    <View
                      key={meeting.id || index}
                      className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#7c3aed"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-bold text-slate-900">
                          {meeting.title || "Meeting"}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500">
                          {dateLabel(meeting.startDate)}
                        </Text>
                      </View>
                    </View>
                  ))
              ) : (
                <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <Text className="text-center text-sm text-slate-500">
                    No upcoming meetings.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomHome />
    </View>
  );
}
