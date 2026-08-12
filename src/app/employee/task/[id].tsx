import { Ionicons } from "@expo/vector-icons";
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
import { BottomHome } from "../../../components/BottomHome";
import { TopHeader } from "../../../components/TopHeader";

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
      <View className="flex-1 bg-slate-50">
        <TopHeader title="Task" subtitle="Task details" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-sm text-slate-500">
            Loading task details...
          </Text>
        </View>
        <BottomHome />
      </View>
    );

  if (error || !task)
    return (
      <View className="flex-1 bg-slate-50">
        <TopHeader title="Task" subtitle="Task details" />
        <View className="flex-1 p-5">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="#2563eb" />
            <Text className="ml-2 font-bold text-blue-600">Back to tasks</Text>
          </Pressable>
          <View className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <Text className="font-semibold text-rose-700">
              {error || "Task not found"}
            </Text>
          </View>
        </View>
        <BottomHome />
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
      <TopHeader title="Task" subtitle="Task details" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetails(true)}
            tintColor="#2563eb"
          />
        }
      >
        <Pressable
          onPress={() => router.back()}
          className="mb-5 flex-row items-center"
        >
          <Ionicons name="arrow-back" size={20} color="#2563eb" />
          <Text className="ml-2 font-bold text-blue-600">Back to tasks</Text>
        </Pressable>

        <View className="rounded-3xl bg-slate-900 p-5">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-blue-300">
                {task.task_code || "Task"}
              </Text>
              <Text className="mt-2 text-2xl font-black text-white">
                {title}
              </Text>
              <Text className="mt-1 text-sm text-slate-300">
                {project}
              </Text>
              {moduleName ? (
                <Text className="mt-1 text-xs text-blue-200">
                  Module: {moduleName}
                </Text>
              ) : null}
            </View>
            <View className="rounded-xl bg-white/10 px-3 py-2">
              <Text className="text-xs font-bold text-white">
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
      <BottomHome />
    </View>
  );
}
