import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

type ProjectOption = { id: string; name: string; code: string };
type EmployeeOption = { id: string; name: string; role?: string };
type PlanModule = {
  title: string;
  duration?: string;
  description?: string;
  documentName?: string;
};

const statusOptions = [
  "Pending",
  "Accepted",
  "To Do",
  "In Progress",
  "Review",
  "Testing",
  "Completed",
  "On Hold",
  "Cancelled",
  "Issue",
];
const statusFilters = ["All", ...statusOptions];
const statusColors: Record<
  string,
  { text: string; background: string; progress: string }
> = {
  Pending: { text: "#f97316", background: "#fef3c7", progress: "#f59e0b" },
  "To Do": { text: "#f97316", background: "#fef3c7", progress: "#f59e0b" },
  Accepted: { text: "#0f766e", background: "#ccfbf1", progress: "#14b8a6" },
  "In Progress": {
    text: "#2563eb",
    background: "#dbeafe",
    progress: "#3b82f6",
  },
  Review: { text: "#7c3aed", background: "#ede9fe", progress: "#8b5cf6" },
  Testing: { text: "#7c3aed", background: "#ede9fe", progress: "#8b5cf6" },
  Completed: { text: "#16a34a", background: "#dcfce7", progress: "#10b981" },
  "On Hold": { text: "#92400e", background: "#fef3c7", progress: "#ea580c" },
  Cancelled: { text: "#b91c1c", background: "#fee2e2", progress: "#ef4444" },
  Issue: { text: "#c2410c", background: "#ffedd5", progress: "#f97316" },
};

const STATUS_PROGRESS_MAP: Record<string, number> = {
  "Pending": 0,
  "Accepted": 10,
  "To Do": 5,
  "In Progress": 50,
  "Review": 75,
  "Testing": 85,
  "Completed": 100,
  "On Hold": 30,
  "Cancelled": 0,
  "Issue": 40,
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
  if (!value) return "Pending";
  const rawStatus = String(value).trim();
  const status = rawStatus.toLowerCase();
  
  if (["done", "complete", "completed", "finished"].includes(status))
    return "Completed";
  if (["in progress", "inprogress", "ongoing", "started", "progress"].includes(status))
    return "In Progress";
  if (["accepted", "approved"].includes(status)) return "Accepted";
  if (["review", "in review", "under review"].includes(status)) return "Review";
  if (["testing", "test"].includes(status)) return "Testing";
  if (["on hold", "hold"].includes(status)) return "On Hold";
  if (["cancelled", "canceled"].includes(status)) return "Cancelled";
  if (["issue", "problem", "blocked"].includes(status)) return "Issue";
  if (["pending", "to do"].includes(status)) {
    // Return original case if it matches, otherwise fallback
    if (rawStatus === "To Do" || rawStatus === "Pending") return rawStatus;
    if (status === "to do") return "To Do";
    return "Pending";
  }
  return rawStatus || "Pending";
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

const extractProjects = (responseData: any): any[] => {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  return payload?.projects || payload?.rows || payload?.results || [];
};

const mapProject = (project: any, index: number): ProjectOption => ({
  id: String(project.uuid ?? project.id ?? index),
  name: String(
    project.project_name ??
      project.projectName ??
      project.name ??
      project.title ??
      "Untitled project",
  ),
  code: String(
    project.project_code ?? project.projectCode ?? project.code ?? "PRJ",
  ),
});

const mapTask = (raw: any, index: number): Task => {
  const getEffectiveProgress = (rawProgress: any, mappedStatus: string) => {
    if (rawProgress !== null && rawProgress !== undefined && rawProgress !== "") {
      const numericProgress = Number(rawProgress);
      // If progress is strictly greater than 0, use it. Otherwise, use the status-based fallback.
      // This prevents default 0s in the database from hiding the status-based progress (e.g. 50% for In Progress).
      if (Number.isFinite(numericProgress) && numericProgress > 0) return numericProgress;
    }
    return STATUS_PROGRESS_MAP[mappedStatus] ?? 0;
  };

  const status = displayStatus(
    firstValue(raw.status, raw.task_status, raw.current_status),
  );
  
  const rawProgressValue = firstValue(raw.progress, raw.progress_percentage);
  const progress = Math.min(
    100,
    Math.max(
      0,
      getEffectiveProgress(rawProgressValue, status)
    )
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
    id: String(firstValue(raw.uuid, raw.task_uuid, raw.task_id, raw.id, index)),
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
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [modules, setModules] = useState<PlanModule[]>([]);
  const [projectDataLoading, setProjectDataLoading] = useState(false);
  const [taskAttachment, setTaskAttachment] = useState<any>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");

  // Reason prompt for Cancelled / Issue
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [reasonSheetVisible, setReasonSheetVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<
    "startDate" | "dueDate" | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [taskForm, setTaskForm] = useState({
    projectId: "",
    assignedTo: "",
    team: "",
    selectedModules: [] as string[],
    priority: "Medium",
    status: "Pending",
    startDate: "",
    dueDate: "",
    title: "",
    description: "",
  });

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

  const openStatusSheet = (task: Task) => {
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
    // Re-open the status sheet so user can pick a different status
    setStatusSheetVisible(true);
  };

  const submitStatusUpdate = async (task: Task, status: string, reason = "") => {
    if (!task?.id) {
      setStatusUpdateError("Unable to identify this task.");
      return;
    }

    setUpdatingStatus(true);
    setStatusUpdateError("");
    const taskId = task.id;

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

  const updateTaskStatus = (task: Task, status: string) => {
    if (status === "Cancelled" || status === "Issue") {
      setPendingStatus(status);
      setReasonText("");
      setStatusSheetVisible(false);
      setReasonSheetVisible(true);
    } else {
      submitStatusUpdate(task, status);
    }
  };

  useEffect(() => {
    fetchTasks();
    api
      .get("/projects?limit=1000&page=1")
      .then((response) => {
        setProjects(extractProjects(response.data).map(mapProject));
      })
      .catch(() => setProjects([]));
  }, [fetchTasks]);

  useEffect(() => {
    if (!taskForm.projectId) {
      setEmployees([]);
      setModules([]);
      return;
    }

    setProjectDataLoading(true);
    Promise.all([
      api.get(`/projects/${taskForm.projectId}/assignments`),
      api.get("/project-plans"),
    ])
      .then(([employeeResponse, planResponse]) => {
        const employeePayload = employeeResponse.data;
        const employeeRows =
          employeePayload?.assignedEmployees ||
          employeePayload?.project?.assignedEmployees ||
          employeePayload?.project?.employees ||
          employeePayload?.data ||
          [];
        setEmployees(
          employeeRows.map((employee: any) => ({
            id: String(
              employee.employee_id ??
                employee.id ??
                employee.employeeCode ??
                employee.employee_code,
            ),
            name: String(
              employee.full_name ||
                employee.employee_name ||
                `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                "Employee",
            ),
            role: employee.designation || employee.role,
          })),
        );

        const plans =
          planResponse.data?.data ||
          planResponse.data?.plans ||
          planResponse.data ||
          [];
        const matchedPlan = plans.find(
          (plan: any) =>
            String(plan.project_id ?? plan.projectId) ===
            String(taskForm.projectId),
        );
        const rawModules =
          matchedPlan?.modules ?? matchedPlan?.taskmodule ?? [];
        const parsedModules =
          typeof rawModules === "string" ? JSON.parse(rawModules) : rawModules;
        setModules(
          Array.isArray(parsedModules)
            ? parsedModules.map((module: any) => ({
                title:
                  module.title ||
                  module.name ||
                  module.module_name ||
                  "Untitled module",
                duration: module.duration,
                description: module.description,
                documentName: module.documentName || module.document,
              }))
            : [],
        );
      })
      .catch(() => {
        setEmployees([]);
        setModules([]);
      })
      .finally(() => setProjectDataLoading(false));
  }, [taskForm.projectId]);

  const openTaskSheet = () => setSheetVisible(true);

  const resetTaskForm = () => {
    setTaskForm({
      projectId: "",
      assignedTo: "",
      team: "",
      selectedModules: [],
      priority: "Medium",
      status: "Pending",
      startDate: "",
      dueDate: "",
      title: "",
      description: "",
    });
    setTaskAttachment(null);
  };

  const chooseTaskAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0])
      setTaskAttachment(result.assets[0]);
  };

  const closeTaskSheet = () => {
    if (saving) return;
    setSheetVisible(false);
    resetTaskForm();
  };

  const openDatePicker = (field: "startDate" | "dueDate") => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setShowDatePicker(false);
      setDatePickerField(null);
      return;
    }

    const chosenDate = selectedDate ?? new Date();
    const isoDate = chosenDate.toISOString().slice(0, 10);

    if (datePickerField === "startDate") {
      setTaskForm((current) => ({ ...current, startDate: isoDate }));
    }

    if (datePickerField === "dueDate") {
      setTaskForm((current) => ({ ...current, dueDate: isoDate }));
    }

    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const createTask = async () => {
    if (
      !taskForm.projectId ||
      !taskForm.assignedTo ||
      taskForm.selectedModules.length === 0
    )
      return;
    setSaving(true);
    try {
      for (const moduleTitle of taskForm.selectedModules) {
        const module = modules.find((item) => item.title === moduleTitle);
        const taskFields = {
          project_id: taskForm.projectId,
          task_name: moduleTitle,
          module_name: moduleTitle,
          title: moduleTitle,
          description: module?.description || "",
          priority: taskForm.priority,
          status: taskForm.status,
          assignment_date: new Date().toISOString().slice(0, 10),
          start_date: taskForm.startDate || "",
          due_date: taskForm.dueDate || null,
          duration: module?.duration || null,
          team: taskForm.team,
        };
        let taskBody: FormData | typeof taskFields = taskFields;
        if (taskAttachment) {
          const multipart = new FormData();
          Object.entries(taskFields).forEach(([key, value]) =>
            multipart.append(key, value == null ? "" : String(value)),
          );
          multipart.append("attachment", {
            uri: taskAttachment.uri,
            name: taskAttachment.name || "attachment",
            type: taskAttachment.mimeType || "application/octet-stream",
          } as any);
          taskBody = multipart;
        }
        const taskResponse = await api.post(
          "/tasks",
          taskBody,
          taskAttachment
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined,
        );
        const taskId =
          taskResponse.data?.data?.uuid ||
          taskResponse.data?.data?.id ||
          taskResponse.data?.uuid;
        if (!taskId) throw new Error(`Could not create task: ${moduleTitle}`);
        await api.post("/tasks/assign", {
          project_id: taskForm.projectId,
          employee_id: taskForm.assignedTo,
          task_id: taskId,
          assigned_date: new Date().toISOString().slice(0, 10),
          start_date: taskForm.startDate || null,
          due_date: taskForm.dueDate || null,
          status: taskForm.status,
          duration: module?.duration || null,
          team: taskForm.team || null,
        });
      }
      setSheetVisible(false);
      resetTaskForm();
      await fetchTasks(true);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to create task.");
    } finally {
      setSaving(false);
    }
  };

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
                      <TouchableOpacity
                        onPress={() => openStatusSheet(task)}
                        activeOpacity={0.75}
                        className="rounded-md px-2 py-1"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text
                          className="text-[9px] font-bold"
                          style={{ color: colors.text }}
                        >
                          {task.status}
                        </Text>
                      </TouchableOpacity>
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
      <FAB onPress={openTaskSheet} />

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeTaskSheet}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={closeTaskSheet}
          />
          <View className="max-h-[88%] rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-black text-slate-900">
                  New Task
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Add a task to a project
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={closeTaskSheet}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="mb-2 text-xs font-bold text-slate-500">
                Project *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                <View className="flex-row gap-2">
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      onPress={() =>
                        setTaskForm((current) => ({
                          ...current,
                          projectId: project.id,
                        }))
                      }
                      className={`rounded-full border px-3 py-2.5 ${taskForm.projectId === project.id ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${taskForm.projectId === project.id ? "text-orange-600" : "text-slate-600"}`}
                      >
                        {project.code} - {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text className="mb-2 text-xs font-bold text-slate-500">
                Assign To Employee *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                <View className="flex-row gap-2">
                  {projectDataLoading ? (
                    <ActivityIndicator color="#f97316" />
                  ) : (
                    employees.map((employee) => (
                      <TouchableOpacity
                        key={employee.id}
                        onPress={() =>
                          setTaskForm((current) => ({
                            ...current,
                            assignedTo: employee.id,
                            team: employee.role || current.team,
                          }))
                        }
                        className={`rounded-full border px-3 py-2.5 ${taskForm.assignedTo === employee.id ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                      >
                        <Text
                          className={`text-xs font-bold ${taskForm.assignedTo === employee.id ? "text-orange-600" : "text-slate-600"}`}
                        >
                          {employee.name}
                          {employee.role ? ` · ${employee.role}` : ""}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>
              <Text className="mb-2 text-xs font-bold text-slate-500">
                Task Modules *
              </Text>
              {modules.length === 0 ? (
                <Text className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No task modules found for this project plan.
                </Text>
              ) : (
                <View className="mb-4 gap-2">
                  {modules.map((module) => {
                    const selected = taskForm.selectedModules.includes(
                      module.title,
                    );
                    return (
                      <TouchableOpacity
                        key={module.title}
                        onPress={() =>
                          setTaskForm((current) => ({
                            ...current,
                            selectedModules: selected
                              ? current.selectedModules.filter(
                                  (title) => title !== module.title,
                                )
                              : [...current.selectedModules, module.title],
                          }))
                        }
                        className={`flex-row items-center rounded-2xl border p-3 ${selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                      >
                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={20}
                          color={selected ? "#f97316" : "#94a3b8"}
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-bold text-slate-800">
                            {module.title}
                          </Text>
                          <Text className="mt-1 text-xs text-slate-500">
                            {module.duration || "No duration"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text className="mb-2 text-xs font-bold text-slate-500">
                Team / Department
              </Text>
              <TextInput
                value={taskForm.team}
                onChangeText={(value) =>
                  setTaskForm((current) => ({ ...current, team: value }))
                }
                placeholder="e.g. Frontend, Backend"
                placeholderTextColor="#94a3b8"
                className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900"
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-2 text-xs font-bold text-slate-500">
                    Start Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => openDatePicker("startDate")}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5"
                  >
                    <Text className="text-slate-900">
                      {taskForm.startDate || "Select start date"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="mb-2 text-xs font-bold text-slate-500">
                    End Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => openDatePicker("dueDate")}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5"
                  >
                    <Text className="text-slate-900">
                      {taskForm.dueDate || "Select end date"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-2 text-xs font-bold text-slate-500">
                    Priority
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {["Low", "Medium", "High"].map((value) => (
                        <TouchableOpacity
                          key={value}
                          onPress={() =>
                            setTaskForm((current) => ({
                              ...current,
                              priority: value,
                            }))
                          }
                          className={`rounded-full border px-3 py-2 ${taskForm.priority === value ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                        >
                          <Text className="text-xs font-bold text-slate-700">
                            {value}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
              <Text className="mb-2 mt-4 text-xs font-bold text-slate-500">
                Attachment
              </Text>
              <TouchableOpacity
                onPress={chooseTaskAttachment}
                className="mb-4 flex-row items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
              >
                <Ionicons name="attach-outline" size={22} color="#f97316" />
                <Text className="ml-3 flex-1 text-sm font-semibold text-slate-700">
                  {taskAttachment?.name || "Choose a document"}
                </Text>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
              <Text className="mb-2 mt-4 text-xs font-bold text-slate-500">
                Status
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-5"
              >
                <View className="flex-row gap-2">
                  {[
                    "Pending",
                    "In Progress",
                    "Review",
                    "Testing",
                    "Completed",
                  ].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setTaskForm((current) => ({
                          ...current,
                          status: value,
                        }))
                      }
                      className={`rounded-full border px-3 py-2 ${taskForm.status === value ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                    >
                      <Text className="text-xs font-bold text-slate-700">
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                disabled={
                  saving ||
                  !taskForm.projectId ||
                  !taskForm.assignedTo ||
                  taskForm.selectedModules.length === 0
                }
                onPress={createTask}
                className="items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-50"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-black text-white">Assign Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            {showDatePicker && datePickerField ? (
              <DateTimePicker
                value={
                  datePickerField === "startDate"
                    ? taskForm.startDate
                      ? new Date(taskForm.startDate)
                      : new Date()
                    : taskForm.dueDate
                      ? new Date(taskForm.dueDate)
                      : new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDatePickerChange}
              />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                  {activeTask?.title || "Select a status"}
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
                  const isActive = activeTask?.status === value;
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
              style={{ color: pendingStatus === "Cancelled" ? "#e11d48" : "#f97316" }}
            >
              {pendingStatus === "Cancelled" ? "Cancel Task" : "Report Issue"}
            </Text>
            <Text className="mt-1 mb-4 text-sm text-slate-500">
              Please provide a reason for{" "}
              {pendingStatus === "Cancelled" ? "cancelling" : "reporting an issue with"}{" "}
              <Text className="font-bold text-slate-800">
                {activeTask?.title || "this task"}
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
                <Text className="text-sm font-semibold text-rose-700">{statusUpdateError}</Text>
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
                    {pendingStatus === "Cancelled" ? "Confirm Cancel" : "Submit Issue"}
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
