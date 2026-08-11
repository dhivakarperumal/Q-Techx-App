import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
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

export default function EmployeeProjectsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<Project[]>([]);
  const [projectTab, setProjectTab] = useState<"assigned" | "unassigned">(
    "assigned",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        const unassigned = allProjects.filter(
          (project) =>
            !assignedIds.has(project.uuid) &&
            (project.project_manager || "").toLowerCase() !== userName,
        );

        setAssignedProjects(assigned);
        setUnassignedProjects(unassigned);
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

  const currentProjects =
    projectTab === "assigned" ? assignedProjects : unassignedProjects;

  const filteredProjects = useMemo(
    () =>
      currentProjects.filter((project) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          [
            project.project_name,
            project.client_name,
            project.project_manager,
            project.project_code,
          ].some((value) => (value || "").toLowerCase().includes(query));
        return (
          matchesSearch &&
          (status === "All" || project.current_status === status)
        );
      }),
    [currentProjects, search, status],
  );

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
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-black text-slate-950">
              My projects
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Track the work you are assigned to.
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
            <Ionicons name="folder-open-outline" size={24} color="#ea580c" />
          </View>
        </View>
        <View className="mt-5 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Ionicons name="search-outline" size={19} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects..."
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 text-sm text-slate-800"
          />
        </View>
        <View className="mt-4 flex-row rounded-2xl border border-slate-200 bg-white p-1">
          <Pressable
            onPress={() => setProjectTab("assigned")}
            className={`flex-1 rounded-xl px-3 py-2 ${projectTab === "assigned" ? "bg-orange-500" : "bg-white"}`}
          >
            <Text
              className={`text-center text-xs font-black ${projectTab === "assigned" ? "text-white" : "text-slate-700"}`}
            >
              Assigned Projects
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setProjectTab("unassigned")}
            className={`flex-1 rounded-xl px-3 py-2 ${projectTab === "unassigned" ? "bg-orange-500" : "bg-white"}`}
          >
            <Text
              className={`text-center text-xs font-black ${projectTab === "unassigned" ? "text-white" : "text-slate-700"}`}
            >
              Unassigned Projects
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingRight: 12 }}
        >
          {statuses.map((item) => (
            <Pressable
              key={item}
              onPress={() => setStatus(item)}
              className={`mr-2 rounded-full border px-4 py-2 ${status === item ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"}`}
            >
              <Text
                className={`text-xs font-bold ${status === item ? "text-white" : "text-slate-600"}`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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
                      <Text className="mr-1 text-xs font-black text-blue-600">
                        View details
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#2563eb"
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
    </View>
  );
}
