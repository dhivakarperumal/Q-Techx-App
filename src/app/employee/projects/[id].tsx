import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import api from "../../../api";
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (!id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError("");
      let fetchedProject: any = null;
      const [projectResponse, progressResponse, assignmentsResponse, tasksResponse] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/progress`),
        api.get(`/projects/${id}/assignments`),
        api.get(`/tasks/assignments`)
      ]);
      
      if (projectResponse.status === "fulfilled") {
        const d = projectResponse.value.data;
        fetchedProject = d?.data ?? d;
        setProject(fetchedProject);
      }
      
      if (progressResponse.status === "fulfilled") {
        setProgress(progressResponse.value.data || null);
      }
      
      if (assignmentsResponse.status === "fulfilled") {
        setEmployees(normalizeEmployees(assignmentsResponse.value.data));
      }
      
      if (tasksResponse.status === "fulfilled") {
        const extract = (res: any) => {
          const payload = res?.data ?? res;
          if (Array.isArray(payload)) return payload;
          return payload?.tasks || payload?.rows || payload?.results || payload?.data || [];
        };
        let rows = extract(tasksResponse.value.data);
        if (!Array.isArray(rows)) {
          if (rows?.data && Array.isArray(rows.data)) rows = rows.data;
          else if (rows?.tasks && Array.isArray(rows.tasks)) rows = rows.tasks;
          else rows = [];
        }
        
        let filteredRows = rows.filter((t: any) => {
          if (!t) return false;
          let pId = "";
          if (typeof t.project === "string" || typeof t.project === "number") {
             pId = String(t.project);
          } else {
             pId = String(t.project_id || t.projectId || t.project_uuid || t.project?.uuid || t.project?.id || "");
          }
          if (pId) {
            if (pId === String(id)) return true;
            if (fetchedProject && (pId === String(fetchedProject.id) || pId === String(fetchedProject.projectId) || pId === String(fetchedProject.project_id))) {
              return true;
            }
          }
          
          let possibleName = String(t.project_name || t.projectName || t.project?.name || t.project?.title || "");
          if (!possibleName && typeof t.project === "string" && isNaN(Number(t.project))) {
            possibleName = t.project;
          }
          const pName = possibleName.toLowerCase().trim();
          
          const currentProjName1 = String(fetchedProject?.title || "").toLowerCase().trim();
          const currentProjName2 = String(fetchedProject?.name || "").toLowerCase().trim();
          const currentProjName3 = String(fetchedProject?.project_name || "").toLowerCase().trim();
          
          if (pName && (pName === currentProjName1 || pName === currentProjName2 || pName === currentProjName3)) {
            return true;
          }
          
          return false;
        });
        setTasks(filteredRows);
      }
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load project details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  if (loading) return <View className="flex-1 bg-slate-50 items-center justify-center"><ActivityIndicator size="large" color="#f97316" /><Text className="mt-3 text-sm font-medium text-slate-500">Loading project details...</Text></View>;
  if (error || !project) return <View className="flex-1 bg-slate-50 p-5 pt-16"><Pressable onPress={() => router.back()} className="flex-row items-center self-start rounded-full bg-white px-4 py-2 shadow-sm border border-slate-100"><Ionicons name="arrow-back" size={18} color="#f97316" /><Text className="ml-2 font-bold text-slate-700">Go back</Text></Pressable><View className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5"><Text className="font-semibold text-rose-700">{error || "Project not found"}</Text></View></View>;

  const percent = Math.min(100, Math.max(0, Number(progress?.progress ?? project.overall_progress ?? 0)));
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
          <Text className="ml-3 text-lg font-black text-slate-800">Project Details</Text>
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
                {project.project_code || "Project"}
              </Text>
              <Text className="mt-2 text-2xl font-black text-slate-900">
                {project.project_name}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-slate-500">
                Client: <Text className="font-bold text-slate-700">{project.client_name || "Internal project"}</Text>
              </Text>
            </View>
            <View className="rounded-xl px-3 py-2 bg-blue-50">
              <Text className="text-xs font-bold text-blue-700">
                {project.current_status || "Unknown"}
              </Text>
            </View>
          </View>
          <View className="mt-6 flex-row items-end justify-between">
            <Text className="text-sm font-semibold text-slate-500">Overall progress</Text>
            <Text className="text-2xl font-black text-slate-800">{percent}%</Text>
          </View>
          <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <View className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
          </View>
        </View>
    <View className="mt-5 flex-row gap-3"><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="cash-outline" size={20} color="#16a34a" /><Text className="mt-2 text-xs text-slate-500">Budget</Text><Text className="mt-1 text-lg font-black text-slate-900">{money(project.total_project_cost)}</Text></View><View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4"><Ionicons name="time-outline" size={20} color="#ea580c" /><Text className="mt-2 text-xs text-slate-500">Deadline</Text><Text className="mt-1 text-sm font-black text-slate-900">{formatDate(project.estimated_completion_date)}</Text></View></View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Task progress</Text><View className="flex-row flex-wrap gap-3">{[["Total", progress?.total], ["Completed", progress?.completed], ["In Progress", progress?.inProgress], ["Pending", progress?.pending], ["On Hold", progress?.onHold], ["Cancelled", progress?.cancelled]].map(([label, value]) => <View key={String(label)} className="w-[30%] rounded-xl border border-slate-200 bg-white p-3"><Text className="text-xl font-black text-slate-900">{value ?? 0}</Text><Text className="mt-1 text-[10px] font-bold uppercase text-slate-400">{label}</Text></View>)}</View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Project information</Text><View className="gap-3 rounded-2xl border border-slate-200 bg-white p-4"><View className="flex-row gap-3"><View className="flex-1"><Info label="Category" value={project.project_category} /></View><View className="flex-1"><Info label="Industry" value={project.industry} /></View></View><View className="flex-row gap-3"><View className="flex-1"><Info label="Start date" value={formatDate(project.project_start_date)} /></View><View className="flex-1"><Info label="Manager" value={project.project_manager} /></View></View><Info label="Description" value={project.description} /></View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Team ({employees.length})</Text><View className="gap-3">{employees.length ? employees.map((employee, index) => <View key={String(employee.employee_id || index)} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Text className="font-black text-blue-600">{(employee.employee_name || "?").slice(0, 1).toUpperCase()}</Text></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{employee.employee_name || "Unknown employee"}</Text><Text className="mt-1 text-xs text-slate-500">{employee.designation || "Employee"}{employee.email ? `  ·  ${employee.email}` : ""}</Text></View><Text className="text-xs font-bold text-emerald-600">{employee.status || "Assigned"}</Text></View>) : <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><Text className="text-center text-sm text-slate-500">No team members assigned.</Text></View>}</View>
    <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Assigned Tasks ({tasks.length})</Text>
    <View className="gap-3">
      {(() => {
        let allTasks: any[] = [];
        tasks.forEach((assignment) => {
          let details = assignment.task_details ?? assignment.task ?? assignment.details;
          if (typeof details === "string") {
            try { details = JSON.parse(details); } catch (e) { details = null; }
          }
          if (Array.isArray(details) && details.length > 0) {
            details.forEach(d => allTasks.push({ ...assignment, ...d, _assignment_id: assignment.id }));
          } else {
            allTasks.push({ ...assignment, ...(details || {}), _assignment_id: assignment.id });
          }
        });
        
        if (allTasks.length === 0) {
          return (
            <View className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
              <Text className="text-center text-sm text-slate-500">No tasks assigned to you for this project.</Text>
            </View>
          );
        }

        return allTasks.map((taskObj, index) => {
          const title = taskObj?.title || taskObj?.task_title || taskObj?.name || taskObj?.task_name || "Untitled Task";
          const tStatus = taskObj?.status ?? taskObj?.task_status ?? "Pending";
          const dueDate = taskObj?.due_date ?? taskObj?.deadline;
          const taskId = taskObj?.task_id ?? taskObj?.id ?? taskObj?.task_uuid ?? taskObj?.uuid ?? index;
          const isDone = tStatus.toLowerCase() === "completed";
          return (
            <Pressable key={String(taskId) + index} onPress={() => router.push(`/employee/task/${taskId}`)} className="rounded-2xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className={`font-bold text-slate-900 ${isDone ? "line-through opacity-50" : ""}`}>{title}</Text>
                  {dueDate ? <Text className="mt-1 text-xs text-slate-500">Due: {formatDate(dueDate)}</Text> : null}
                </View>
                <View className={`rounded-lg px-2 py-1 ${isDone ? "bg-emerald-100" : "bg-blue-100"}`}>
                  <Text className={`text-[10px] font-bold uppercase ${isDone ? "text-emerald-700" : "text-blue-700"}`}>{tStatus}</Text>
                </View>
              </View>
            </Pressable>
          );
        });
      })()}
    </View>
    </ScrollView>
  </View>
  );
}
