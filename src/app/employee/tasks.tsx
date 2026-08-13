import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

type ApiTask = {
  id?: string | number;
  task_id?: string | number;
  task_uuid?: string;
  task_code?: string;
  task_name?: string;
  task_title?: string;
  title?: string;
  name?: string;
  module_name?: string;
  moduleName?: string;
  module?: string;
  description?: string;
  task_description?: string;
  project_id?: string | number;
  project_uuid?: string;
  project_name?: string;
  projectName?: string;
  project?: string;
  team?: string;
  assigned_to?: string | number | null;
  assigned_to_name?: string | null;
  assigned_to_code?: string | null;
  assigned_by?: string | number | null;
  assignment_date?: string;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  completion_date?: string | null;
  priority?: string;
  task_priority?: string;
  status?: string;
  task_status?: string;
  current_status?: string;
  comments?: string | null;
  comment?: string | null;
  cancel_reason?: string | null;
  issue_reason?: string | null;
  attachments?: unknown;
  files?: unknown;
  documents?: unknown;
  task_attachments?: unknown;
  progress?: number;
  active?: number;
  created_at?: string;
  updated_at?: string;
  task_details?: unknown;
  [key: string]: unknown;
};

const statusColors: Record<string, string> = {
  Pending: "#f97316",
  "To Do": "#f97316",
  Accepted: "#10b981",
  "In Progress": "#2563eb",
  Review: "#7c3aed",
  Testing: "#8b5cf6",
  Completed: "#16a34a",
  "On Hold": "#ea580c",
  Cancelled: "#e11d48",
  Issue: "#f97316",
};

const statusFilters = [
  "All",
  "Pending",
  "To Do",
  "Accepted",
  "In Progress",
  "Review",
  "Testing",
  "Completed",
  "On Hold",
  "Cancelled",
  "Issue",
];

// Options for status change sheet (exclude the 'All' filter)
const statusOptions = statusFilters.filter((s) => s !== "All");

const employeeReference = (user: Record<string, unknown> | null) => {
  if (!user) return "";
  return (
    [
      user.employee_id,
      user.employeeId,
      user.user_id,
      user.id,
      user._id,
      user.employee?.employee_id,
      user.employee?.employeeId,
      user.employee?.id,
    ]
      .filter(Boolean)
      .map(String)[0] || ""
  );
};

const getTaskStatus = (value?: string | number | null) => {
  const status = String(value || "Pending")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["done", "complete", "completed", "finished"].includes(status)) {
    return "Completed";
  }
  if (["in progress", "inprogress", "ongoing", "started"].includes(status)) {
    return "In Progress";
  }
  if (["accepted", "approved"].includes(status)) {
    return "Accepted";
  }
  if (["review", "in review"].includes(status)) {
    return "Review";
  }
  if (["testing", "test"].includes(status)) {
    return "Testing";
  }
  if (["on hold", "hold"].includes(status)) {
    return "On Hold";
  }
  if (["cancelled", "canceled"].includes(status)) {
    return "Cancelled";
  }
  if (["issue", "problem"].includes(status)) {
    return "Issue";
  }
  if (status === "pending") {
    return "Pending";
  }
  return String(value).trim() || "Pending";
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

const getTaskTitle = (task: ApiTask) =>
  String(
    task.task_name ||
      task.task_title ||
      task.title ||
      task.name ||
      task.module_name ||
      task.project_name ||
      "Assigned task",
  );

const getTaskProjectName = (task: ApiTask) =>
  String(
    task.project_name ||
      task.projectName ||
      task.project ||
      task.team ||
      "No project",
  );

const getTaskModuleName = (task: ApiTask) =>
  String(task.module_name || task.moduleName || task.module || "");

const getTaskDescription = (task: ApiTask) =>
  String(task.description || task.task_description || "");

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
  assigned_to:
    row?.assigned_to ??
    row?.assigned_employee_id ??
    row?.employee_id ??
    row?.assigned_to_id ??
    row?.employeeId ??
    row?.user_id ??
    details?.assigned_to ??
    details?.assigned_employee_id ??
    details?.employee_id ??
    details?.assigned_to_id ??
    details?.employeeId ??
    details?.user_id,
  assigned_to_name:
    row?.assigned_to_name ??
    details?.assigned_to_name ??
    row?.employee_name ??
    details?.employee_name ??
    row?.name ??
    details?.name,
  assigned_by: row?.assigned_by ?? details?.assigned_by ?? row?.assigned_by,
  assignment_date:
    row?.assignment_date ?? details?.assignment_date ?? row?.assignment_date,
});

const normalizeAssignment = (row: any): ApiTask[] => {
  const taskDetails = parseTaskDetails(row);

  if (Array.isArray(taskDetails) && taskDetails.length > 0) {
    return taskDetails.map((detail) =>
      normalizeTask(buildTaskRecord(row, detail)),
    );
  }

  return [normalizeTask(buildTaskRecord(row, taskDetails || {}))];
};

const normalizeTask = (row: any): ApiTask => {
  const taskDetails = parseTaskDetails(row) || {};

  return {
    ...row,
    ...taskDetails,
    id: row?.id ?? row?.task_id ?? row?.uuid ?? row?.task_uuid,
    task_id: row?.task_id ?? row?.id ?? row?.uuid,
    task_uuid: row?.task_uuid ?? row?.uuid,
    task_name:
      row?.task_name ??
      taskDetails?.task_name ??
      row?.name ??
      row?.title ??
      taskDetails?.title ??
      row?.task_title ??
      "",
    name:
      row?.name ??
      taskDetails?.name ??
      row?.task_name ??
      row?.title ??
      taskDetails?.title ??
      "",
    project_name:
      row?.project_name ??
      taskDetails?.project_name ??
      row?.projectName ??
      row?.project ??
      row?.team ??
      taskDetails?.team ??
      "",
    module_name:
      row?.module_name ??
      taskDetails?.module_name ??
      row?.moduleName ??
      row?.module ??
      "",
    description:
      row?.description ??
      taskDetails?.description ??
      row?.task_description ??
      taskDetails?.task_description ??
      row?.details ??
      "",
    comments:
      row?.comments ??
      taskDetails?.comments ??
      row?.comment ??
      taskDetails?.comment ??
      row?.cancel_reason ??
      row?.issue_reason ??
      "",
    attachments:
      row?.attachments ??
      taskDetails?.attachments ??
      row?.files ??
      row?.documents ??
      row?.task_attachments,
    start_date:
      row?.start_date ??
      row?.startDate ??
      row?.assignment_date ??
      taskDetails?.start_date ??
      taskDetails?.startDate,
    due_date:
      row?.due_date ??
      row?.dueDate ??
      row?.deadline ??
      taskDetails?.due_date ??
      taskDetails?.dueDate,
    status:
      row?.status ??
      taskDetails?.status ??
      row?.task_status ??
      row?.current_status ??
      taskDetails?.task_status ??
      taskDetails?.current_status,
    priority: row?.priority ?? taskDetails?.priority ?? row?.task_priority,
    uuid: String(row?.uuid ?? row?.task_uuid ?? row?.id ?? row?.task_id ?? ""),
    assigned_to:
      row?.assigned_to ??
      row?.assigned_employee_id ??
      row?.employee_id ??
      row?.assigned_to_id ??
      row?.employeeId ??
      row?.user_id ??
      taskDetails?.assigned_to ??
      taskDetails?.assigned_employee_id ??
      taskDetails?.employee_id ??
      taskDetails?.assigned_to_id ??
      taskDetails?.employeeId ??
      taskDetails?.user_id,
  };
};

const getTaskComments = (task: ApiTask) =>
  String(
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

const getTaskAttachmentsLabel = (task: ApiTask) => {
  const attachments =
    task.attachments || task.files || task.documents || task.task_attachments;
  if (!attachments) return "No attachments";
  if (Array.isArray(attachments)) {
    return `${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`;
  }
  return String(attachments);
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

export default function EmployeeTasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [taskSummary, setTaskSummary] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
  });

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Custom Date Range State
  const [customRangeVisible, setCustomRangeVisible] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customPickerField, setCustomPickerField] = useState<
    "start" | "end" | null
  >(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const [activeTask, setActiveTask] = useState<ApiTask | null>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");

  // Reason prompt for Cancelled / Issue
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [reasonSheetVisible, setReasonSheetVisible] = useState(false);

  const openStatusSheet = (task: ApiTask) => {
    setActiveTask(task);
    setStatusSheetVisible(true);
    setStatusUpdateError("");
  };

  const closeStatusSheet = () => {
    if (updatingStatus) return;
    setStatusSheetVisible(false);
    setActiveTask(null);
    setStatusUpdateError("");
  };

  const closeReasonSheet = () => {
    if (updatingStatus) return;
    setReasonSheetVisible(false);
    setPendingStatus(null);
    setReasonText("");
  };

  const submitStatusUpdate = async (
    task: ApiTask,
    status: string,
    reason = "",
  ) => {
    const taskId = task.task_uuid || task.uuid || task.task_id || task.id;
    if (!taskId) {
      setStatusUpdateError("Unable to identify this task.");
      return;
    }

    setUpdatingStatus(true);
    setStatusUpdateError("");

    // Build comments field: append reason with tag for Cancelled/Issue
    let comments = "";
    if (status === "Cancelled" && reason.trim()) {
      comments = `[Cancelled]: ${reason.trim()}`;
    } else if (status === "Issue" && reason.trim()) {
      comments = `[Issue]: ${reason.trim()}`;
    }

    const payload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (comments) payload.comments = comments;

    try {
      await api.put(`/tasks/${taskId}`, payload);
      setStatusSheetVisible(false);
      setReasonSheetVisible(false);
      setActiveTask(null);
      setPendingStatus(null);
      setReasonText("");
      await fetchTasks(true);
    } catch (error: any) {
      if (
        error?.status === 404 ||
        String(error?.message).toLowerCase().includes("not found")
      ) {
        try {
          await api.put(`/tasks/${taskId}/status`, payload);
          setStatusSheetVisible(false);
          setReasonSheetVisible(false);
          setActiveTask(null);
          setPendingStatus(null);
          setReasonText("");
          await fetchTasks(true);
          return;
        } catch (secondError: any) {
          setStatusUpdateError(
            secondError?.message || "Unable to update task status.",
          );
          return;
        }
      }
      setStatusUpdateError(error?.message || "Unable to update task status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateTaskStatus = (task: ApiTask, status: string) => {
    if (status === "Cancelled" || status === "Issue") {
      // Show reason prompt first
      setPendingStatus(status);
      setReasonText("");
      setStatusSheetVisible(false);
      setReasonSheetVisible(true);
    } else {
      submitStatusUpdate(task, status);
    }
  };

  const handleCustomDatePickerChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setShowCustomDatePicker(false);
      setCustomPickerField(null);
      return;
    }

    const chosenDate = selectedDate ?? new Date();
    const isoDate = chosenDate.toISOString().slice(0, 10);

    if (customPickerField === "start") setCustomStart(isoDate);
    if (customPickerField === "end") setCustomEnd(isoDate);

    setShowCustomDatePicker(false);
    setCustomPickerField(null);
  };

  const fetchTasks = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        const employeeId = employeeReference(user);
        const { data: assignmentPayload } = await api.get("/tasks/assignments");
        const rows =
          collectRows(assignmentPayload).flatMap(normalizeAssignment);

        const filtered = rows.filter((task) => {
          const assignedEmployeeId = String(
            task.assigned_to ??
              task.assigned_employee_id ??
              task.employee_id ??
              task.employeeId ??
              task.user_id ??
              "",
          );
          return (
            assignedEmployeeId &&
            employeeId &&
            assignedEmployeeId === String(employeeId)
          );
        });

        const summary = filtered.reduce(
          (acc, task) => {
            const status = getTaskStatus(
              task.status || task.task_status || task.current_status,
            );
            acc.total += 1;
            if (status === "In Progress") acc.inProgress += 1;
            else if (status === "Completed") acc.completed += 1;
            else if (status === "On Hold") acc.onHold += 1;
            return acc;
          },
          {
            total: 0,
            inProgress: 0,
            completed: 0,
            onHold: 0,
          },
        );

        setTasks(filtered);
        setTaskSummary(summary);
      } catch (requestError: any) {
        setError(requestError?.message || "Unable to load assigned tasks.");
        setTasks([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = (() => {
    const query = search.trim().toLowerCase();

    // Helper to check date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    return tasks.filter((task) => {
      const status = getTaskStatus(
        task.status || task.task_status || task.current_status,
      );
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const title = getTaskTitle(task);
      const project = getTaskProjectName(task);
      const priority = String(task.priority || task.task_priority || "Medium");

      const matchesSearch =
        !query ||
        [title, project, priority].some((value) =>
          value.toLowerCase().includes(query),
        );

      let matchesDate = true;
      const taskDateRaw =
        task.due_date ||
        task.dueDate ||
        task.deadline ||
        task.start_date ||
        task.startDate;
      if (dateFilter !== "All" && taskDateRaw) {
        const taskDate = new Date(String(taskDateRaw));
        if (!Number.isNaN(taskDate.getTime())) {
          taskDate.setHours(0, 0, 0, 0);

          switch (dateFilter) {
            case "Today":
              matchesDate = taskDate.getTime() === today.getTime();
              break;
            case "Yesterday":
              matchesDate = taskDate.getTime() === yesterday.getTime();
              break;
            case "This Week":
              matchesDate = taskDate >= startOfWeek && taskDate <= endOfWeek;
              break;
            case "This Month":
              matchesDate = taskDate >= startOfMonth && taskDate <= endOfMonth;
              break;
            case "Last Month":
              matchesDate =
                taskDate >= startOfLastMonth && taskDate <= endOfLastMonth;
              break;
            case "Custom Range":
              if (customStart && customEnd) {
                const cs = new Date(customStart);
                cs.setHours(0, 0, 0, 0);
                const ce = new Date(customEnd);
                ce.setHours(23, 59, 59, 999);
                matchesDate = taskDate >= cs && taskDate <= ce;
              }
              break;
          }
        }
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  })();

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Tasks" subtitle="Your assigned work" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTasks(true)}
            tintColor="#2563eb"
          />
        }
      >
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row justify-between">
          {[
            {
              label: "Tasks",
              value: String(taskSummary.total),
              sub: "Total",
              icon: "checkbox",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Active",
              value: String(taskSummary.inProgress),
              sub: "Ongoing",
              icon: "time",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Done",
              value: String(taskSummary.completed),
              sub: "Completed",
              icon: "checkmark-circle",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-emerald-500",
            },
          ].map((stat, idx) => (
            <View
              key={idx}
              className="w-[32%] overflow-hidden rounded-2xl bg-white border border-orange-100"
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
                style={{ paddingHorizontal: 8, paddingVertical: 12 }}
              >
                <View className="flex-col items-start mb-2">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-black mb-2">
                    <Ionicons
                      name={stat.icon as any}
                      size={16}
                      color="#f97316"
                    />
                  </View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                    numberOfLines={1}
                  >
                    {stat.label}
                  </Text>
                </View>
                <View className="flex-col items-start">
                  <Text className="text-xl font-black text-black">
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-[9px] font-bold ${stat.subColor || "text-gray-400"}`}
                  >
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Filter & Search Bar */}
        <View className="mb-4 flex-row items-center gap-3">
          {/* Search */}
          <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-sm shadow-slate-100">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search assigned tasks..."
              placeholderTextColor="#94a3b8"
              className="ml-2 flex-1 text-sm font-medium text-slate-800"
            />
          </View>
        </View>

        <View className="mb-6 flex-row items-center gap-3">
          {/* Status Dropdown */}
          <Pressable
            onPress={() => setStatusDropdownOpen(true)}
            className="flex-1 h-12 py-4 rounded-2xl border border-slate-200 bg-white px-3 flex-row items-center justify-between shadow-sm shadow-slate-100"
          >
            <Text
              className="text-xs font-medium text-slate-700"
              numberOfLines={1}
            >
              {statusFilter === "All" ? "All Tasks" : statusFilter}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>

          {/* Date Dropdown */}
          <Pressable
            onPress={() => setDateDropdownOpen(true)}
            className="flex-1 h-12 py-4 rounded-2xl border border-slate-200 bg-white px-3 flex-row items-center justify-between shadow-sm shadow-slate-100"
          >
            <Text
              className="text-xs font-medium text-slate-700"
              numberOfLines={1}
            >
              {dateFilter === "Custom Range" && customStart && customEnd
                ? `${new Date(customStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${new Date(customEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                : dateFilter === "All"
                  ? "All Dates"
                  : dateFilter}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
        </View>

        {loading ? (
          <View className="mt-8 items-center py-10">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-slate-500">
              Loading assigned tasks...
            </Text>
          </View>
        ) : error ? (
          <View className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <Text className="font-semibold text-rose-700">{error}</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <Text className="text-center text-sm text-slate-500">
              No tasks found for the selected filters.
            </Text>
          </View>
        ) : (
          <View className="mt-6 gap-3">
            {filteredTasks.map((task, index) => {
              const title = getTaskTitle(task);
              const project = getTaskProjectName(task);
              const moduleName = getTaskModuleName(task);
              const description = getTaskDescription(task);
              const comments = getTaskComments(task);
              const attachmentsLabel = getTaskAttachmentsLabel(task);
              const status = getTaskStatus(
                task.status || task.task_status || task.current_status,
              );
              const color = statusColors[status] || "#f97316";
              const start = getDueText(
                task.start_date || task.startDate || task.assignment_date,
              );
              const due = getDueText(
                task.due_date || task.dueDate || task.deadline,
              );
              const priority = String(
                task.priority || task.task_priority || "Medium",
              );

              return (
                <Pressable
                  key={`${task.uuid || task.id || task.task_id || index}`}
                  onPress={() =>
                    router.push(
                      `/employee/task/${task.uuid || task.id || task.task_id}`,
                    )
                  }
                  className="mb-4 overflow-hidden rounded-[24px] border border-orange-200 bg-white p-5 active:opacity-90"
                  style={{
                    shadowColor: "#f97316",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                    elevation: 4,
                  }}
                >
                  <View className="mb-4 flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 border border-slate-100">
                        <Ionicons
                          name="clipboard-outline"
                          size={24}
                          color={color}
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
                          {title}
                        </Text>
                        {moduleName ? (
                          <Text className="mt-0.5 text-xs font-medium text-slate-500" numberOfLines={1}>
                            {moduleName}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => openStatusSheet(task)}
                      activeOpacity={0.8}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: `${color}15`,
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color }}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="mb-4 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                    <Text className="text-xs font-medium text-slate-700">
                      Project: <Text className="font-bold">{project}</Text>
                    </Text>
                  </View>

                  {description ? (
                    <Text
                      numberOfLines={2}
                      className="mb-4 text-sm leading-5 text-slate-600"
                    >
                      {description}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center justify-between pt-1">
                    <View className="flex-row gap-2">
                      <View className="flex-row items-center rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                        <Ionicons name="calendar-outline" size={12} color="#64748b" />
                        <Text className="ml-1 text-[11px] font-medium text-slate-600">
                          {due}
                        </Text>
                      </View>
                      <View className="flex-row items-center rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                        <Ionicons name="flag-outline" size={12} color={priority === "High" ? "#ef4444" : priority === "Medium" ? "#f97316" : "#3b82f6"} />
                        <Text className="ml-1 text-[11px] font-medium" style={{ color: priority === "High" ? "#ef4444" : priority === "Medium" ? "#f97316" : "#3b82f6" }}>
                          {priority}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {(comments || attachmentsLabel) && (
                    <View className="mt-4 border-t border-slate-100 pt-3">
                      {comments ? (
                        <Text className="text-[11px] leading-4 text-slate-500">
                          <Text className="font-semibold text-slate-700">Reason:</Text> {comments}
                        </Text>
                      ) : null}
                      {attachmentsLabel ? (
                        <View className="mt-2 flex-row items-center">
                          <Ionicons name="attach" size={14} color="#64748b" />
                          <Text className="ml-1 text-[11px] font-medium text-slate-600">
                            {attachmentsLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomHome />

      <Modal
        visible={statusDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusDropdownOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-8"
          onPress={() => setStatusDropdownOpen(false)}
        >
          <Pressable
            className="bg-white rounded-2xl overflow-hidden max-h-[70%]"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
              Select Status
            </Text>
            <ScrollView>
              {statusFilters.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    setStatusFilter(filter);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${statusFilter === filter ? "font-bold text-orange-600" : "text-slate-700"}`}
                  >
                    {filter === "All" ? "All Tasks" : filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={dateDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDateDropdownOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-8"
          onPress={() => setDateDropdownOpen(false)}
        >
          <Pressable
            className="bg-white rounded-2xl overflow-hidden max-h-[70%]"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
              Select Date
            </Text>
            <ScrollView>
              {[
                "All",
                "Today",
                "Yesterday",
                "This Week",
                "This Month",
                "Last Month",
                "Custom Range",
              ].map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    setDateFilter(filter);
                    setDateDropdownOpen(false);
                    if (filter === "Custom Range") {
                      setCustomRangeVisible(true);
                    }
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${dateFilter === filter ? "font-bold text-orange-600" : "text-slate-700"}`}
                  >
                    {filter === "All" ? "All Dates" : filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Range Selection Modal */}
      <Modal
        visible={customRangeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomRangeVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-8">
          <View className="bg-white rounded-2xl overflow-hidden p-6">
            <Text className="text-lg font-bold text-slate-900 mb-4">
              Select Date Range
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-700 mb-1">
                Start Date
              </Text>
              <Pressable
                onPress={() => {
                  setCustomPickerField("start");
                  setShowCustomDatePicker(true);
                }}
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex-row items-center justify-between"
              >
                <Text
                  className={`text-sm ${customStart ? "text-slate-900" : "text-slate-400"}`}
                >
                  {customStart || "Select start date"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-1">
                End Date
              </Text>
              <Pressable
                onPress={() => {
                  setCustomPickerField("end");
                  setShowCustomDatePicker(true);
                }}
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 flex-row items-center justify-between"
              >
                <Text
                  className={`text-sm ${customEnd ? "text-slate-900" : "text-slate-400"}`}
                >
                  {customEnd || "Select end date"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setCustomRangeVisible(false);
                  if (!customStart || !customEnd) {
                    setDateFilter("All");
                  }
                }}
                className="flex-1 h-12 items-center justify-center rounded-xl bg-slate-100"
              >
                <Text className="font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCustomRangeVisible(false)}
                disabled={!customStart || !customEnd}
                className={`flex-1 h-12 items-center justify-center rounded-xl ${
                  customStart && customEnd ? "bg-orange-600" : "bg-orange-300"
                }`}
              >
                <Text className="font-bold text-white">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showCustomDatePicker && (
        <DateTimePicker
          value={
            customPickerField === "start"
              ? customStart
                ? new Date(customStart)
                : new Date()
              : customEnd
                ? new Date(customEnd)
                : new Date()
          }
          mode="date"
          display="default"
          onChange={handleCustomDatePickerChange}
        />
      )}

      <Modal
        visible={statusSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeStatusSheet}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={closeStatusSheet}
          />
          <View className="max-h-[70%] rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-black text-slate-900">
                  Update Status
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {activeTask ? getTaskTitle(activeTask) : "Select a status"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={closeStatusSheet}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {statusUpdateError ? (
                <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <Text className="text-sm font-semibold text-rose-700">
                    {statusUpdateError}
                  </Text>
                </View>
              ) : null}
              <Text className="mb-3 text-sm font-bold text-slate-600">
                Pick a new status
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {statusOptions.map((value) => {
                  const isActive = activeTask
                    ? getTaskStatus(
                        activeTask.status ||
                          activeTask.task_status ||
                          activeTask.current_status,
                      ) === value
                    : false;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        activeTask && updateTaskStatus(activeTask, value)
                      }
                      disabled={updatingStatus}
                      className={`rounded-2xl border px-4 py-3 ${isActive ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${isActive ? "text-orange-600" : "text-slate-700"}`}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={closeStatusSheet}
                disabled={updatingStatus}
                className="mt-6 items-center rounded-2xl border border-slate-200 bg-white py-4"
              >
                <Text className="font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Reason / Cancel prompt modal ── */}
      <Modal
        visible={reasonSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReasonSheet}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={closeReasonSheet}
          />
          <View className="rounded-t-[28px] bg-white px-5 pb-10 pt-6">
            <Text
              className="text-xl font-black"
              style={{
                color: pendingStatus === "Cancelled" ? "#e11d48" : "#f97316",
              }}
            >
              {pendingStatus === "Cancelled" ? "Cancel Task" : "Report Issue"}
            </Text>
            <Text className="mt-1 mb-4 text-sm text-slate-500">
              Please provide a reason for{" "}
              {pendingStatus === "Cancelled"
                ? "cancelling"
                : "reporting an issue with"}{" "}
              <Text className="font-bold text-slate-800">
                {activeTask ? getTaskTitle(activeTask) : "this task"}
              </Text>
              .
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder={
                pendingStatus === "Cancelled"
                  ? "Enter cancellation reason..."
                  : "Describe the issue you are facing..."
              }
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 mb-5"
              style={{ minHeight: 110 }}
            />
            {statusUpdateError ? (
              <View className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <Text className="text-sm font-semibold text-rose-700">
                  {statusUpdateError}
                </Text>
              </View>
            ) : null}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closeReasonSheet}
                disabled={updatingStatus}
                className="flex-1 items-center rounded-2xl border border-slate-200 bg-white py-3.5"
              >
                <Text className="font-bold text-slate-700">Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  activeTask &&
                  pendingStatus &&
                  submitStatusUpdate(activeTask, pendingStatus, reasonText)
                }
                disabled={updatingStatus}
                className="flex-1 items-center rounded-2xl py-3.5"
                style={{
                  backgroundColor:
                    pendingStatus === "Cancelled" ? "#e11d48" : "#f97316",
                }}
              >
                {updatingStatus ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-black text-white">
                    {pendingStatus === "Cancelled"
                      ? "Confirm Cancel"
                      : "Submit Issue"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
