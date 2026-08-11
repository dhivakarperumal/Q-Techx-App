import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api, { API_BASE_URL } from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { FAB } from "../../components/FAB";
import { TopHeader } from "../../components/TopHeader";

type Task = {
  id: string;
  title: string;
  project: string;
  date: string;
  priority: string;
  status: string;
  progress: number;
  assignee: string;
  avatar?: string;
};

const statusFilters = ["All", "In Progress", "Completed", "Pending"];
const statusColors: Record<
  string,
  { text: string; background: string; progress: string }
> = {
  Completed: { text: "#16a34a", background: "#dcfce7", progress: "#10b981" },
  "In Progress": {
    text: "#2563eb",
    background: "#dbeafe",
    progress: "#3b82f6",
  },
  Pending: { text: "#9333ea", background: "#f3e8ff", progress: "#a855f7" },
};

const valueOf = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const firstValue = (...values: unknown[]) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

const displayStatus = (value: unknown) => {
  const status = String(value || "Pending")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  if (["done", "complete", "completed", "finished"].includes(status))
    return "Completed";
  if (["in progress", "inprogress", "ongoing", "started"].includes(status))
    return "In Progress";
  return "Pending";
};

const displayDate = (value: unknown) => {
  if (!value) return "No due date";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const extractTasks = (responseData: any): any[] => {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  return payload?.tasks || payload?.rows || payload?.results || [];
};

const mapTask = (raw: any, index: number): Task => {
  const status = displayStatus(
    firstValue(raw.status, raw.task_status, raw.current_status),
  );
  const progress = Math.min(
    100,
    Math.max(
      0,
      valueOf(
        firstValue(
          raw.progress,
          raw.progress_percentage,
          status === "Completed" ? 100 : 0,
        ),
      ),
    ),
  );
  const assignee =
    raw.assignee || raw.assigned_to || raw.employee || raw.user || {};
  const profilePhoto = firstValue(
    assignee.profile_photo,
    assignee.avatar,
    raw.profile_photo,
    raw.avatar,
  );
  const baseUrl = API_BASE_URL.replace(/\/api$/, "");

  return {
    id: String(firstValue(raw.id, raw.task_id, raw.uuid, index)),
    title: String(
      firstValue(raw.title, raw.task_name, raw.name, "Untitled task"),
    ),
    project: String(
      firstValue(
        raw.project_name,
        raw.project?.name,
        raw.project?.project_name,
        raw.project,
        "Internal",
      ),
    ),
    date: displayDate(
      firstValue(raw.due_date, raw.dueDate, raw.deadline, raw.end_date),
    ),
    priority: String(firstValue(raw.priority, raw.task_priority, "Medium")),
    status,
    progress,
    assignee: String(
      firstValue(
        assignee.name,
        assignee.full_name,
        [assignee.first_name, assignee.last_name].filter(Boolean).join(" "),
        raw.assigned_to_name,
        "Unassigned",
      ),
    ),
    avatar: profilePhoto
      ? String(profilePhoto).startsWith("http")
        ? String(profilePhoto)
        : `${baseUrl}${profilePhoto}`
      : undefined,
  };
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get("/tasks");
      setTasks(extractTasks(response.data).map(mapTask));
      setError("");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;
      const matchesSearch =
        !query ||
        [task.title, task.project, task.assignee, task.priority].some((value) =>
          value.toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(
      (task) => task.status === "In Progress",
    ).length;
    const completed = tasks.filter(
      (task) => task.status === "Completed",
    ).length;
    const pending = tasks.filter((task) => task.status === "Pending").length;
    return [
      [
        "Total Tasks",
        total,
        "All Tasks",
        "clipboard-outline",
        "#f97316",
        "#fff7ed",
      ],
      [
        "In Progress",
        inProgress,
        `${total ? Math.round((inProgress / total) * 100) : 0}%`,
        "play-circle-outline",
        "#3b82f6",
        "#eff6ff",
      ],
      [
        "Completed",
        completed,
        `${total ? Math.round((completed / total) * 100) : 0}%`,
        "checkmark-circle-outline",
        "#10b981",
        "#ecfdf5",
      ],
      [
        "Pending",
        pending,
        `${total ? Math.round((pending / total) * 100) : 0}%`,
        "time-outline",
        "#a855f7",
        "#faf5ff",
      ],
    ] as const;
  }, [tasks]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTasks(true)}
            tintColor="#f97316"
          />
        }
      >
        <View className="mb-6 flex-row items-center justify-between px-5">
          <View className="flex-1">
            <Text className="text-3xl font-black tracking-tight text-slate-900">
              Tasks
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Organize, track and complete tasks efficiently
            </Text>
          </View>
          <TouchableOpacity className="flex-row items-center rounded-xl bg-orange-500 px-4 py-2.5 shadow-sm">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-sm font-bold text-white">New Task</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mb-6 px-5"
        >
          {stats.map(([label, value, sub, icon, color, background]) => (
            <View
              key={label}
              className="mr-4 w-[130px] rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm"
            >
              <View
                className="mb-3 h-10 w-10 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: background }}
              >
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text className="mb-1 text-[10px] font-bold text-slate-500">
                {label}
              </Text>
              <Text className="mb-1 text-2xl font-black text-slate-900">
                {value}
              </Text>
              <Text className="text-[10px] font-medium text-slate-400">
                {sub}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="mb-4 flex-row items-center gap-3 px-5">
          <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks..."
              placeholderTextColor="#94a3b8"
              className="ml-2 flex-1 text-sm font-medium text-slate-800"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mb-6 px-5"
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setStatusFilter(filter)}
              className={`mr-3 flex-row items-center rounded-full border px-4 py-2 ${statusFilter === filter ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
            >
              <View
                className="mr-2 h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    filter === "All" ? "#f97316" : statusColors[filter]?.text,
                }}
              />
              <Text
                className={`text-xs font-bold ${statusFilter === filter ? "text-orange-600" : "text-slate-600"}`}
              >
                {filter === "All" ? "All Tasks" : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="mb-4 px-5">
          <Text className="text-sm font-bold text-slate-800">
            Tasks ({filteredTasks.length})
          </Text>
        </View>

        <View className="px-5">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="mt-3 text-sm text-slate-500">
                Loading tasks...
              </Text>
            </View>
          ) : error ? (
            <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <Text className="font-semibold text-rose-700">{error}</Text>
              <TouchableOpacity
                onPress={() => fetchTasks()}
                className="mt-3 self-start rounded-xl bg-rose-600 px-4 py-2"
              >
                <Text className="font-bold text-white">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredTasks.length === 0 ? (
            <Text className="py-12 text-center text-sm text-slate-500">
              No tasks found.
            </Text>
          ) : (
            filteredTasks.map((task) => {
              const colors = statusColors[task.status] || statusColors.Pending;
              return (
                <View
                  key={task.id}
                  className="mb-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <View className="mb-4 flex-row justify-between">
                    <View className="flex-1 flex-row">
                      <View className="mr-4 h-14 w-14 items-center justify-center rounded-[18px] bg-slate-100">
                        <Ionicons
                          name="clipboard-outline"
                          size={28}
                          color="#64748b"
                        />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text
                          className="mb-1.5 text-[15px] font-bold text-slate-900"
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        <Text
                          className="mb-1 text-[10px] text-slate-500"
                          numberOfLines={1}
                        >
                          Project:{" "}
                          <Text className="font-semibold text-blue-600">
                            {task.project}
                          </Text>
                        </Text>
                        <Text
                          className="text-[10px] text-slate-500"
                          numberOfLines={1}
                        >
                          Due: {task.date} - {task.assignee}
                        </Text>
                      </View>
                    </View>
                    <View className="ml-2 items-end justify-between">
                      <View
                        className="rounded-md px-2 py-1"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text
                          className="text-[9px] font-bold"
                          style={{ color: colors.text }}
                        >
                          {task.status}
                        </Text>
                      </View>
                      {task.avatar ? (
                        <Image
                          source={{ uri: task.avatar }}
                          className="mt-2 h-6 w-6 rounded-full bg-slate-200"
                        />
                      ) : null}
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-[6px] flex-1 overflow-hidden rounded-full bg-slate-100">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${task.progress}%`,
                          backgroundColor: colors.progress,
                        }}
                      />
                    </View>
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: colors.progress }}
                    >
                      {task.progress}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <AdminBottomBar />
      <FAB onPress={() => {}} />
    </View>
  );
}
