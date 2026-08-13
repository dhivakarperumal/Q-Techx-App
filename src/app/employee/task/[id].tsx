import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import api from "../../../api";
import { useAuth } from "../../../auth/AuthContext";

// Reusing types and parsing logic from tasks.tsx for consistency
type ApiTask = {
  id?: string | number;
  task_id?: string | number;
  task_uuid?: string;
  task_name?: string;
  task_title?: string;
  title?: string;
  name?: string;
  module_name?: string;
  project_name?: string;
  description?: string;
  task_description?: string;
  start_date?: string;
  startDate?: string;
  assignment_date?: string;
  due_date?: string;
  dueDate?: string;
  deadline?: string;
  status?: string;
  task_status?: string;
  current_status?: string;
  priority?: string;
  task_priority?: string;
  comments?: string | null;
  comment?: string | null;
  cancel_reason?: string | null;
  issue_reason?: string | null;
  attachments?: unknown;
  files?: unknown;
  documents?: unknown;
  task_attachments?: unknown;
  assigned_to?: string | number | null;
  employee_id?: string | number | null;
  assigned_employee_id?: string | number | null;
  employeeId?: string | number | null;
  [key: string]: unknown;
};

const statusColors: Record<string, string> = {
  Completed: "#16a34a",
  "In Progress": "#2563eb",
  Pending: "#f97316",
};

const getTaskStatus = (value?: string | number | null) => {
  const status = String(value || "Pending")
    .trim()
    .toLowerCase();
  if (["done", "complete", "completed", "finished"].includes(status)) {
    return "Completed";
  }
  if (["in progress", "inprogress", "ongoing", "started"].includes(status)) {
    return "In Progress";
  }
  return "Pending";
};

const getDueText = (value?: string | number | null) => {
  if (!value) return "No due date";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const firstValue = (...values: any[]) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

const parseTaskDetails = (row: any): any => {
  const details = row?.task_details ?? row?.taskDetails ?? row?.task_detail;
  if (!details) return null;
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  }
  return details;
};

const buildTaskRecord = (row: any, details: any = {}): any => ({
  ...row,
  ...details,
});

const normalizeTask = (row: any): ApiTask => {
  const taskDetails = parseTaskDetails(row) || {};
  return {
    ...row,
    ...taskDetails,
    id: row?.id ?? row?.task_id ?? row?.uuid ?? row?.task_uuid,
    task_id: row?.task_id ?? row?.id ?? row?.uuid,
  };
};

const normalizeAssignment = (row: any): ApiTask[] => {
  const taskDetails = parseTaskDetails(row);

  if (Array.isArray(taskDetails) && taskDetails.length > 0) {
    return taskDetails.map((detail) =>
      normalizeTask(buildTaskRecord(row, detail)),
    );
  }

  return [normalizeTask(buildTaskRecord(row, taskDetails || {}))];
};

const collectRows = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.tasks,
    payload.data,
    payload.rows,
    payload.results,
    payload.assignments,
    payload.employee_task_assignments,
    payload.task_assignments,
    payload.items,
    payload.today,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = collectRows(candidate);
      if (nested.length) return nested;
    }
  }

  return [];
};

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </Text>
      <Text className="mt-1 text-sm font-bold text-slate-800">
        {value || "-"}
      </Text>
    </View>
  );
}

export default function EmployeeTaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [task, setTask] = useState<ApiTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(
    async (isRefresh = false) => {
      if (!id) return;
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        // Since we don't have a guaranteed specific endpoint for single tasks, 
        // we'll fetch assignments and filter for the matching task.
        const { data: assignmentPayload } = await api.get("/tasks/assignments");
        const rows = collectRows(assignmentPayload).flatMap(normalizeAssignment);
        
        const matchedTask = rows.find((t) => String(t.id) === String(id) || String(t.task_id) === String(id) || String(t.task_uuid) === String(id));

        if (matchedTask) {
          setTask(matchedTask);
        } else {
          setError("Task not found.");
        }
      } catch (requestError: any) {
        setError(requestError?.message || "Unable to load task details.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading)
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-3 text-sm font-medium text-slate-500">
          Loading task details...
        </Text>
      </View>
    );

  if (error || !task)
    return (
      <View className="flex-1 bg-slate-50 p-5 pt-16">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start rounded-full bg-white px-4 py-2 shadow-sm border border-slate-100"
        >
          <Ionicons name="arrow-back" size={18} color="#f97316" />
          <Text className="ml-2 font-bold text-slate-700">Go back</Text>
        </Pressable>
        <View className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <Text className="font-semibold text-rose-700">
            {error || "Task not found"}
          </Text>
        </View>
      </View>
    );

  const title = String(
    task.task_name ||
      task.task_title ||
      task.title ||
      task.name ||
      task.module_name ||
      task.project_name ||
      "Assigned task",
  );
  const project = String(
    task.project_name ||
      task.projectName ||
      task.project ||
      task.team ||
      "No project",
  );
  const moduleName = String(
    task.module_name || task.moduleName || task.module || "",
  );
  const description = String(
    task.description || task.task_description || "",
  );
  const comments = String(
    firstValue(
      task.comments,
      task.comment,
      task.cancel_reason,
      task.issue_reason,
      task.task_comments,
      task.task_comment,
      task.comment_text,
    ) || "",
  );
  
  const rawStatus = task.status || task.task_status || task.current_status;
  const status = getTaskStatus(rawStatus);
  const color = statusColors[status] || "#f97316";
  const start = getDueText(
    task.start_date || task.startDate || task.assignment_date,
  );
  const due = getDueText(task.due_date || task.dueDate || task.deadline);
  const priority = String(task.priority || task.task_priority || "Medium");

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={["#fff7ed", "#ffffff", "#f8fafc"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetails(true)}
            tintColor="#f97316"
          />
        }
      >
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100"
          >
            <Ionicons name="arrow-back" size={22} color="#f97316" />
          </Pressable>
          <Text className="ml-3 text-lg font-black text-slate-800">Task Details</Text>
        </View>

        <View
          className="mb-6 overflow-hidden rounded-[24px] border border-orange-200 bg-white p-6 shadow-sm"
          style={{
            shadowColor: "#f97316",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-orange-500">
                {task.task_code || "Task"}
              </Text>
              <Text className="mt-2 text-2xl font-black text-slate-900">
                {title}
              </Text>
              <Text className="mt-1.5 text-sm font-semibold text-slate-500">
                Project: <Text className="font-bold text-slate-700">{project}</Text>
              </Text>
              {moduleName ? (
                <Text className="mt-1 text-xs font-medium text-slate-400">
                  Module: {moduleName}
                </Text>
              ) : null}
            </View>
            <View className="rounded-xl px-3 py-2" style={{ backgroundColor: `${color}15` }}>
              <Text className="text-xs font-bold" style={{ color }}>
                {rawStatus || "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            <Text className="mt-2 text-xs text-slate-500">Start Date</Text>
            <Text className="mt-1 text-sm font-black text-slate-900">
              {start}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <Ionicons name="time-outline" size={20} color="#ea580c" />
            <Text className="mt-2 text-xs text-slate-500">Deadline</Text>
            <Text className="mt-1 text-sm font-black text-slate-900">
              {due}
            </Text>
          </View>
        </View>

        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">
          Task Information
        </Text>
        <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Info label="Priority" value={priority} />
            </View>
            <View className="flex-1">
              <Info label="Status" value={status} />
            </View>
          </View>
          {description ? (
            <Info label="Description" value={description} />
          ) : null}
          {comments ? (
            <Info label="Comments/Reasons" value={comments} />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
