import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import api from "../../../api";
import { BottomHome } from "../../../components/BottomHome";
import { TopHeader } from "../../../components/TopHeader";

type Project = Record<string, any>;
type Progress = { total?: number; completed?: number; inProgress?: number; pending?: number; onHold?: number; cancelled?: number; remaining?: number; progress?: number };
type Employee = { employee_id?: string | number; employee_name?: string; designation?: string; email?: string; status?: string };

const normalizeEmployees = (payload: any): Employee[] => {
  const candidates = [
    payload?.assignedEmployees,
    payload?.employees,
    payload?.data,
    payload?.data?.assignedEmployees,
    payload?.data?.employees,
    payload?.project?.employees,
  ];
  const rows = candidates.find(Array.isArray) || [];

  return rows.map((employee: any) => {
    const source = employee?.employee || employee?.user || employee;
    const employeeName = source.employee_name
      || source.full_name
      || source.name
      || [source.first_name, source.last_name].filter(Boolean).join(" ").trim();

    return {
      employee_id: source.employee_id || source.employeeId || source.user_id || source.id,
      employee_name: employeeName || "Unknown employee",
      designation: source.designation || source.role || source.job_title,
      email: source.email || source.personal_email || source.official_email,
      status: source.status || employee.status || "Assigned",
    };
  });
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const money = (value?: string | number) => value == null || value === "" ? "-" : `₹${Number(value).toLocaleString("en-IN")}`;

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <View className="rounded-xl border border-slate-100 bg-slate-50 p-3"><Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Text><Text className="mt-1 text-sm font-bold text-slate-800">{value || "-"}</Text></View>;
}

export default function EmployeeProjectDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (!id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError("");
      const [projectResponse, progressResponse, assignmentsResponse] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/progress`),
        api.get(`/projects/${id}/assignments`).catch(() => ({ data: {} })),
      ]);
      setProject(projectResponse.data?.data || null);
      setProgress(progressResponse.data || null);
      setEmployees(normalizeEmployees(assignmentsResponse.data));
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load project details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  if (loading) return <View className="flex-1 bg-slate-50"><TopHeader title="Project" subtitle="Project details" /><View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /><Text className="mt-3 text-sm text-slate-500">Loading project details...</Text></View><BottomHome /></View>;
  if (error || !project) return <View className="flex-1 bg-slate-50"><TopHeader title="Project" subtitle="Project details" /><View className="flex-1 p-5"><Pressable onPress={() => router.back()} className="flex-row items-center"><Ionicons name="arrow-back" size={20} color="#2563eb" /><Text className="ml-2 font-bold text-blue-600">Back to projects</Text></Pressable><View className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5"><Text className="font-semibold text-rose-700">{error || "Project not found"}</Text></View></View><BottomHome /></View>;

  const percent = Math.min(100, Math.max(0, Number(progress?.progress ?? project.overall_progress ?? 0)));
  return <View className="flex-1 bg-slate-50"><TopHeader title="Project" subtitle="Project details" /><ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDetails(true)} tintColor="#2563eb" />}>
    <Pressable onPress={() => router.back()} className="mb-5 flex-row items-center"><Ionicons name="arrow-back" size={20} color="#2563eb" /><Text className="ml-2 font-bold text-blue-600">Back to projects</Text></Pressable>
    <View className="rounded-3xl bg-slate-900 p-5"><View className="flex-row items-start justify-between"><View className="mr-3 flex-1"><Text className="text-xs font-bold uppercase tracking-widest text-blue-300">{project.project_code || "Project"}</Text><Text className="mt-2 text-2xl font-black text-white">{project.project_name}</Text><Text className="mt-1 text-sm text-slate-300">{project.client_name || "Internal project"}</Text></View><View className="rounded-xl bg-white/10 px-3 py-2"><Text className="text-xs font-bold text-white">{project.current_status || "Unknown"}</Text></View></View><View className="mt-6 flex-row items-end justify-between"><Text className="text-sm font-semibold text-slate-300">Overall progress</Text><Text className="text-3xl font-black text-white">{percent}%</Text></View><View className="mt-3 h-3 overflow-hidden rounded-full bg-white/15"><View className="h-full rounded-full bg-blue-400" style={{ width: `${percent}%` }} /></View></View>
    <View className="mt-5 flex-row gap-3"><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="cash-outline" size={20} color="#16a34a" /><Text className="mt-2 text-xs text-slate-500">Budget</Text><Text className="mt-1 text-lg font-black text-slate-900">{money(project.total_project_cost)}</Text></View><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="time-outline" size={20} color="#ea580c" /><Text className="mt-2 text-xs text-slate-500">Deadline</Text><Text className="mt-1 text-sm font-black text-slate-900">{formatDate(project.estimated_completion_date)}</Text></View></View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Task progress</Text><View className="flex-row flex-wrap gap-3">{[["Total", progress?.total], ["Completed", progress?.completed], ["In Progress", progress?.inProgress], ["Pending", progress?.pending], ["On Hold", progress?.onHold], ["Cancelled", progress?.cancelled]].map(([label, value]) => <View key={String(label)} className="w-[30%] rounded-xl border border-slate-200 bg-white p-3"><Text className="text-xl font-black text-slate-900">{value ?? 0}</Text><Text className="mt-1 text-[10px] font-bold uppercase text-slate-400">{label}</Text></View>)}</View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Project information</Text><View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4"><View className="flex-row gap-3"><View className="flex-1"><Info label="Category" value={project.project_category} /></View><View className="flex-1"><Info label="Industry" value={project.industry} /></View></View><View className="flex-row gap-3"><View className="flex-1"><Info label="Start date" value={formatDate(project.project_start_date)} /></View><View className="flex-1"><Info label="Manager" value={project.project_manager} /></View></View><Info label="Description" value={project.description} /></View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Team ({employees.length})</Text><View className="gap-3">{employees.length ? employees.map((employee, index) => <View key={String(employee.employee_id || index)} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Text className="font-black text-blue-600">{(employee.employee_name || "?").slice(0, 1).toUpperCase()}</Text></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{employee.employee_name || "Unknown employee"}</Text><Text className="mt-1 text-xs text-slate-500">{employee.designation || "Employee"}{employee.email ? `  ·  ${employee.email}` : ""}</Text></View><Text className="text-xs font-bold text-emerald-600">{employee.status || "Assigned"}</Text></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No team members assigned.</Text></View>}</View>
  </ScrollView><BottomHome /></View>;
}
