import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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

type Project = {
  id?: number;
  uuid: string;
  project_name?: string;
  project_code?: string;
  client_name?: string;
  project_manager?: string;
  current_status?: string;
  project_start_date?: string;
  estimated_completion_date?: string;
};

type AssignmentGroup = {
  project_uuid?: string;
  employees?: { employee_id?: string | number }[];
};

const statuses = [
  "All",
  "Planning",
  "In Progress",
  "Testing",
  "On Hold",
  "Live",
  "Completed",
  "Cancelled",
];
const statusColors: Record<
  string,
  { text: string; background: string; dot: string }
> = {
  Planning: { text: "#2563eb", background: "#eff6ff", dot: "#3b82f6" },
  "In Progress": { text: "#059669", background: "#ecfdf5", dot: "#10b981" },
  Testing: { text: "#7c3aed", background: "#f5f3ff", dot: "#8b5cf6" },
  "On Hold": { text: "#ea580c", background: "#fff7ed", dot: "#f97316" },
  Live: { text: "#0891b2", background: "#ecfeff", dot: "#06b6d4" },
  Completed: { text: "#7c3aed", background: "#f5f3ff", dot: "#8b5cf6" },
  Cancelled: { text: "#e11d48", background: "#fff1f2", dot: "#f43f5e" },
};

const employeeReference = (user: Record<string, unknown> | null) => {
  if (!user) return "";
  return (
    [user.employee_id, user.employeeId, user.user_id, user.id, user._id]
      .filter(Boolean)
      .map(String)[0] || ""
  );
};

const formatDate = (value?: string) => {
  if (!value) return "No start date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

function StatusBadge({ status }: { status?: string }) {
  const style = statusColors[status || ""] || {
    text: "#64748b",
    background: "#f1f5f9",
    dot: "#94a3b8",
  };
  return (
    <View
      className="flex-row items-center self-start rounded-full px-3 py-1.5"
      style={{ backgroundColor: style.background }}
    >
      <View
        className="mr-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      <Text className="text-xs font-bold" style={{ color: style.text }}>
        {status || "Unknown"}
      </Text>
    </View>
  );
}

const getProgress = (proj: any) => {
  const raw =
    proj?.progress ??
    proj?.project_progress ??
    proj?.progress_percentage ??
    proj?.progressPercent ??
    proj?.progress_percent ??
    proj?.completion ??
    proj?.completion_percentage ??
    proj?.overall_progress ??
    proj?.overallProgress ??
    0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

export default function EmployeeProjectsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  const fetchProjects = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");
        const [projectsResponse, assignmentsResponse] = await Promise.all([
          api.get("/projects?limit=100&page=1"),
          api.get("/projects/assignments/all?limit=100&page=1"),
        ]);
        const allProjects: Project[] = projectsResponse.data?.data || [];
        const groups: AssignmentGroup[] =
          assignmentsResponse.data?.grouped || [];
        const userId = employeeReference(user);
        const userName = String(
          user?.profileName || user?.name || user?.username || "",
        ).toLowerCase();

        const assignedIds = new Set<string>(
          groups
            .filter((group) =>
              group.employees?.some(
                (employee) => String(employee.employee_id) === String(userId),
              ),
            )
            .map((group) => group.project_uuid)
            .filter(Boolean) as string[],
        );

        const assigned = allProjects.filter(
          (project) =>
            assignedIds.has(project.uuid) ||
            (project.project_manager || "").toLowerCase() === userName,
        );

        setAssignedProjects(assigned);

        // Fetch all tasks to compute progress (completed / total per project)
        let globalTasks: any[] = [];
        try {
          const globalRes = await api.get("/tasks?limit=1000&page=1");
          const payload = globalRes.data;
          const extractRows = (p: any): any[] => {
            if (Array.isArray(p)) return p;
            if (p && typeof p === "object") {
              for (const key of ["data", "tasks", "rows", "results", "list"]) {
                if (Array.isArray(p[key])) return p[key];
              }
            }
            return [];
          };
          globalTasks = extractRows(payload);
        } catch (_) {}

        const newProgressMap: Record<string, number> = {};
        assigned.forEach((p) => {
          const projectTasks = globalTasks.filter((t: any) => {
            const tProjId = String(
              t.project_id ?? t.projectId ?? t.project?.id ?? "",
            );
            const tProjUuid = String(
              t.project_uuid ?? t.project?.uuid ?? t.project ?? "",
            );
            const tProjName = String(
              t.project_name ?? t.projectName ?? t.project?.name ?? "",
            ).toLowerCase();
            return (
              tProjId === String(p.id) ||
              tProjUuid === p.uuid ||
              (p.project_name && tProjName === p.project_name.toLowerCase())
            );
          });
          if (projectTasks.length > 0) {
            const done = projectTasks.filter(
              (t: any) =>
                (t.status ?? t.task_status ?? "").toLowerCase() === "completed",
            ).length;
            newProgressMap[p.uuid] = Math.round(
              (done / projectTasks.length) * 100,
            );
          } else {
            newProgressMap[p.uuid] = 0;
          }
        });
        setProgressMap(newProgressMap);
      } catch (requestError: any) {
        setError(requestError?.message || "Unable to load assigned projects.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const currentProjects = assignedProjects;

  const projectSummary = useMemo(() => {
    return currentProjects.reduce(
      (acc, project) => {
        const status = String(project.current_status || "").trim();
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
  }, [currentProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();

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

    return currentProjects.filter((project) => {
      const matchesSearch =
        !query ||
        [
          project.project_name,
          project.client_name,
          project.project_manager,
          project.project_code,
        ].some((value) => (value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || project.current_status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== "All" && project.project_start_date) {
        const pDate = new Date(project.project_start_date);
        if (!Number.isNaN(pDate.getTime())) {
          pDate.setHours(0, 0, 0, 0);

          switch (dateFilter) {
            case "Today":
              matchesDate = pDate.getTime() === today.getTime();
              break;
            case "Yesterday":
              matchesDate = pDate.getTime() === yesterday.getTime();
              break;
            case "This Week":
              matchesDate = pDate >= startOfWeek && pDate <= endOfWeek;
              break;
            case "This Month":
              matchesDate = pDate >= startOfMonth && pDate <= endOfMonth;
              break;
            case "Last Month":
              matchesDate =
                pDate >= startOfLastMonth && pDate <= endOfLastMonth;
              break;
            case "Custom Range":
              if (customStart && customEnd) {
                const cs = new Date(customStart);
                cs.setHours(0, 0, 0, 0);
                const ce = new Date(customEnd);
                ce.setHours(23, 59, 59, 999);
                matchesDate = pDate >= cs && pDate <= ce;
              }
              break;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    currentProjects,
    search,
    statusFilter,
    dateFilter,
    customStart,
    customEnd,
  ]);

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Projects" subtitle="Your assigned work" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProjects(true)}
            tintColor="#2563eb"
          />
        }
      >
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row justify-between">
          {[
            {
              label: "Assigned",
              value: String(projectSummary.total),
              sub: "Total",
              icon: "folder",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Active",
              value: String(projectSummary.inProgress),
              sub: "Ongoing",
              icon: "time",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Done",
              value: String(projectSummary.completed),
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
        <View className="mb-4 flex-row items-center gap-3 mt-4">
          {/* Search */}
          <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-sm shadow-slate-100">
            <Ionicons name="search-outline" size={20} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search projects..."
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
              {statusFilter === "All" ? "All Status" : statusFilter}
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
          <View className="items-center py-24">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-slate-500">
              Loading your projects...
            </Text>
          </View>
        ) : error ? (
          <View className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <Text className="font-semibold text-rose-700">{error}</Text>
            <Pressable
              onPress={() => fetchProjects()}
              className="mt-4 self-start rounded-xl bg-rose-600 px-4 py-2"
            >
              <Text className="font-bold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-5 gap-3">
            {filteredProjects.map((project) => (
              <Pressable
                key={project.uuid}
                onPress={() =>
                  router.push(`/employee/projects/${project.uuid}` as any)
                }
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-0 shadow-sm active:bg-slate-50"
              >
                <View className="border-b border-slate-100 bg-slate-50/80 px-4 py-4">
                  <View className="flex-row items-start justify-between">
                    <View className="mr-3 flex-1">
                      <Text
                        className="text-base font-black text-slate-900"
                        numberOfLines={1}
                      >
                        {project.project_name || "Untitled project"}
                      </Text>
                      <Text className="mt-1 text-xs font-semibold text-slate-400">
                        {project.project_code || "Project"}
                        {project.client_name
                          ? `  ·  ${project.client_name}`
                          : ""}
                      </Text>
                    </View>
                    <StatusBadge status={project.current_status} />
                  </View>
                </View>
                <View className="px-4 py-4">
                  <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#64748b"
                      />
                      <Text className="ml-2 text-xs font-semibold text-slate-600">
                        Started {formatDate(project.project_start_date)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="mr-1 text-xs font-black text-orange-600">
                        View details
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#f97316"
                      />
                    </View>
                  </View>
                  <View className="flex-row items-center rounded-2xl border border-slate-100 bg-white px-3 py-3">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-orange-100">
                      <Ionicons
                        name="folder-open-outline"
                        size={20}
                        color="#ea580c"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-700">
                        {project.client_name || "Client information pending"}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400">
                        {project.project_manager
                          ? `Managed by ${project.project_manager}`
                          : "Project progress is being tracked"}
                      </Text>
                    </View>
                  </View>
                  <View className="px-4 pb-4">
                    {(() => {
                      const pct =
                        progressMap[project.uuid] ?? getProgress(project);
                      const barColor =
                        pct >= 100
                          ? "#10b981"
                          : pct >= 50
                            ? "#2563eb"
                            : "#f97316";
                      return (
                        <>
                          <View className="mb-2 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Ionicons
                                name="pulse-outline"
                                size={13}
                                color="#64748b"
                              />
                              <Text className="ml-1 text-xs font-semibold text-slate-500">
                                Progress
                              </Text>
                            </View>
                            <Text
                              className="text-xs font-black"
                              style={{ color: barColor }}
                            >
                              {pct}%
                            </Text>
                          </View>
                          <View className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: pct > 0 ? `${pct}%` : "4%",
                                backgroundColor: barColor,
                              }}
                            />
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>
              </Pressable>
            ))}
            {filteredProjects.length === 0 && (
              <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                <Text className="text-center font-semibold text-slate-600">
                  No projects found
                </Text>
                <Text className="mt-1 text-center text-sm text-slate-400">
                  Try another search or status filter.
                </Text>
              </View>
            )}
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
              {statuses.map((filter) => (
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
                    {filter === "All" ? "All Status" : filter}
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
    </View>
  );
}
