import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api";

/* ─── constants ────────────────────────────────────────────── */
const ROLES = ["Project Manager", "Developer", "QA", "UI/UX", "Support"];

const statusMeta: Record<string, { color: string; bg: string; icon: any }> = {
  "In Progress": { color: "#2563eb", bg: "#dbeafe", icon: "briefcase" },
  Completed:     { color: "#16a34a", bg: "#dcfce7", icon: "checkmark-circle" },
  "On Hold":     { color: "#7c3aed", bg: "#ede9fe", icon: "pause-circle" },
  Cancelled:     { color: "#dc2626", bg: "#fee2e2", icon: "close-circle" },
  Planning:      { color: "#d97706", bg: "#fef3c7", icon: "bulb" },
};

const getStatus = (s: string) =>
  statusMeta[s] ?? { color: "#64748b", bg: "#f1f5f9", icon: "folder" };

/* ─── helpers ──────────────────────────────────────────────── */
const fmtDate = (v?: string) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/* ─── small components ─────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: "#fff", borderRadius: 24, padding: 18,
      marginBottom: 14, borderWidth: 1, borderColor: "#f1f5f9",
      shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    }, style]}>
      {children}
    </View>
  );
}

function CardTitle({ title, icon }: { title: string; icon: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
        <Ionicons name={icon} size={15} color="#f97316" />
      </View>
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f8fafc" }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Ionicons name={icon} size={16} color="#64748b" />
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#1e293b", fontWeight: "500", lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
}

function MemberAvatar({ name, role }: { name: string; role?: string }) {
  const palette = ["#f97316", "#0ea5e9", "#a855f7", "#10b981", "#e11d48", "#f59e0b"];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <View style={{ marginRight: 10, marginBottom: 10, alignItems: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{initials}</Text>
      </View>
      <Text style={{ fontSize: 10, color: "#1e293b", fontWeight: "600", maxWidth: 52, textAlign: "center" }} numberOfLines={1}>{name.split(" ")[0]}</Text>
      {role ? <Text style={{ fontSize: 9, color: "#94a3b8", textAlign: "center" }}>{role}</Text> : null}
    </View>
  );
}

/* ─── main screen ──────────────────────────────────────────── */
export default function ProjectDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [project, setProject]         = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tasks, setTasks]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  /* assign-employee modal state */
  const [assignModal, setAssignModal]         = useState(false);
  const [employees, setEmployees]             = useState<any[]>([]);
  const [empSearch, setEmpSearch]             = useState("");
  const [selectedEmpIds, setSelectedEmpIds]   = useState<string[]>([]);
  const [selectedRole, setSelectedRole]       = useState(ROLES[0] ?? "");
  const [assigning, setAssigning]             = useState(false);
  const [assignError, setAssignError]         = useState("");

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const [projRes, assignRes, taskRes] = await Promise.allSettled([
        api.get(`/projects/${uuid}`),
        api.get(`/projects/${uuid}/assignments`),
        api.get(`/projects/${uuid}/tasks?limit=100`),
      ]);

      if (projRes.status === "fulfilled") {
        const d = projRes.value.data;
        setProject(d?.data ?? d);
      }
      if (assignRes.status === "fulfilled") {
        const d = assignRes.value.data;
        const rows =
          d?.data ?? d?.employees ?? d?.assignments ?? d?.rows ?? d ?? [];
        setAssignments(Array.isArray(rows) ? rows : []);
      }
      if (taskRes.status === "fulfilled") {
        const d = taskRes.value.data;
        const rows = d?.data ?? d?.tasks ?? d?.rows ?? d ?? [];
        setTasks(Array.isArray(rows) ? rows : []);
      }
    } catch (_) {
      Alert.alert("Error", "Could not load project details.");
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/employees?limit=1000&page=1");
      const d = res.data;
      const rows = Array.isArray(d) ? d : d?.data ?? d?.employees ?? d?.rows ?? [];
      setEmployees(
        rows.map((e: any) => ({
          id: e.employee_id ?? e.id ?? e.uuid ?? "",
          name:
            e.full_name ??
            e.employee_name ??
            e.name ??
            `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ??
            "Employee",
          activeProjects: Number(e.active_projects ?? e.activeProjects ?? 0),
        }))
      );
    } catch (_) {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAssign = async () => {
    if (!selectedEmpIds.length) {
      setAssignError("Select at least one employee.");
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      await Promise.all(
        selectedEmpIds.map((eid) =>
          api.post(`/projects/${uuid}/assignments`, {
            project_id: uuid,
            employee_id: eid,
            role: selectedRole,
          })
        )
      );
      setAssignModal(false);
      setSelectedEmpIds([]);
      await fetchAll();
    } catch (err: any) {
      setAssignError(err?.message ?? "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  /* ── loading / error states ── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, color: "#94a3b8", fontWeight: "600" }}>Loading project…</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
        <Text style={{ marginTop: 12, color: "#64748b", fontWeight: "600", fontSize: 15 }}>Project not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#f97316", borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  /* ── derived values ── */
  const title =
    project.title ?? project.name ?? project.project_name ?? "Untitled Project";
  const client =
    project.company ?? project.client_name ?? project.client ?? "Internal";
  const statusStr =
    project.status ?? project.current_status ?? project.project_status ?? "In Progress";
  const { color: sColor, bg: sBg, icon: sIcon } = getStatus(statusStr);
  const progress = Number(project.progress ?? project.project_progress ?? project.completion ?? 0);
  const startDate = project.date ?? project.project_start_date ?? project.start_date;
  const endDate   = project.end_date ?? project.estimated_completion_date ?? project.project_end_date;
  const budget    = project.budget ?? project.project_budget;
  const description = project.description ?? project.project_description ?? project.notes ?? project.project_notes;

  /* task stats */
  const totalTasks     = tasks.length;
  const doneTasks      = tasks.filter((t: any) => (t.status ?? t.task_status ?? "").toLowerCase() === "completed").length;
  const inProgressTasks = tasks.filter((t: any) => ["in progress", "in-progress"].includes((t.status ?? "").toLowerCase())).length;
  const todoTasks      = totalTasks - doneTasks - inProgressTasks;

  const progressColor =
    statusStr === "Completed" ? "#10b981" :
    statusStr === "On Hold"   ? "#a855f7" : "#3b82f6";

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>

      {/* ══ Hero Header ═══════════════════════════════════════ */}
      <View style={{ backgroundColor: "#0f172a", paddingBottom: 28, paddingHorizontal: 20 }}>
        <SafeAreaView edges={["top"]}>
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 22, marginTop: 6 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>Projects</Text>
          </Pressable>

          {/* Icon + title */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20, backgroundColor: sBg,
              alignItems: "center", justifyContent: "center",
              shadowColor: sColor, shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
            }}>
              <Ionicons name={sIcon} size={28} color={sColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 26 }}>{title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 }}>
                <Ionicons name="business-outline" size={12} color="#64748b" />
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{client}</Text>
              </View>
            </View>
          </View>

          {/* Status + progress row */}
          <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: sBg }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: sColor }}>{statusStr}</Text>
            </View>
            <View style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <View style={{ width: `${progress}%`, height: "100%", backgroundColor: progressColor, borderRadius: 3 }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{progress}%</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* ══ Scrollable Body ═══════════════════════════════════ */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* ── Quick Stats ── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Tasks", value: totalTasks, color: "#f97316", bg: "#fff7ed" },
            { label: "Done",        value: doneTasks,  color: "#10b981", bg: "#dcfce7" },
            { label: "Ongoing",     value: inProgressTasks, color: "#3b82f6", bg: "#dbeafe" },
            { label: "To Do",       value: todoTasks,  color: "#a855f7", bg: "#ede9fe" },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: "#94a3b8", marginTop: 2, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Project Info ── */}
        <Card>
          <CardTitle title="Project Details" icon="folder-open-outline" />
          <InfoRow icon="calendar-outline"     label="Start Date"   value={fmtDate(startDate)} />
          <InfoRow icon="flag-outline"          label="End Date"     value={fmtDate(endDate)} />
          <InfoRow icon="cash-outline"          label="Budget"       value={budget ? `₹ ${budget}` : undefined} />
          <InfoRow icon="business-outline"      label="Client"       value={client} />
          {description ? (
            <View style={{ paddingTop: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Description</Text>
              <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{description}</Text>
            </View>
          ) : null}
        </Card>

        {/* ── Team Members ── */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <CardTitle title={`Team (${assignments.length})`} icon="people-outline" />
            <TouchableOpacity
              onPress={() => {
                fetchEmployees();
                setAssignModal(true);
                setSelectedEmpIds([]);
                setSelectedRole(ROLES[0] ?? "");
                setEmpSearch("");
                setAssignError("");
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa" }}
            >
              <Ionicons name="person-add-outline" size={14} color="#f97316" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#f97316" }}>Assign</Text>
            </TouchableOpacity>
          </View>

          {assignments.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name="people-outline" size={36} color="#e2e8f0" />
              <Text style={{ marginTop: 10, color: "#94a3b8", fontWeight: "600", fontSize: 13 }}>No members assigned yet</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {assignments.map((a: any, i: number) => {
                const name =
                  a.full_name ?? a.employee_name ?? a.name ??
                  `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() ?? "Employee";
                const role = a.role ?? a.assignment_role ?? a.position;
                return <MemberAvatar key={a.id ?? a.employee_id ?? i} name={name} role={role} />;
              })}
            </View>
          )}
        </Card>

        {/* ── Tasks ── */}
        <Card>
          <CardTitle title={`Tasks (${totalTasks})`} icon="checkmark-circle-outline" />
          {tasks.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name="clipboard-outline" size={36} color="#e2e8f0" />
              <Text style={{ marginTop: 10, color: "#94a3b8", fontWeight: "600", fontSize: 13 }}>No tasks yet</Text>
            </View>
          ) : (
            tasks.slice(0, 15).map((task: any, i: number) => {
              const tStatus = task.status ?? task.task_status ?? "To Do";
              const isDone  = tStatus.toLowerCase() === "completed";
              const isWip   = ["in progress", "in-progress"].includes(tStatus.toLowerCase());
              const dotColor = isDone ? "#10b981" : isWip ? "#3b82f6" : "#94a3b8";
              const assignee =
                task.assigned_to_name ?? task.employee_name ??
                task.assignee_name ?? task.assigned_employee_name;
              return (
                <View key={task.id ?? task.task_id ?? i} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: i < tasks.length - 1 ? 1 : 0, borderBottomColor: "#f8fafc" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor, marginTop: 5, marginRight: 12, flexShrink: 0 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: isDone ? "#94a3b8" : "#1e293b", textDecorationLine: isDone ? "line-through" : "none" }}>
                      {task.title ?? task.task_title ?? task.name ?? `Task ${i + 1}`}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: isDone ? "#dcfce7" : isWip ? "#dbeafe" : "#f1f5f9" }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: isDone ? "#16a34a" : isWip ? "#2563eb" : "#64748b" }}>{tStatus}</Text>
                      </View>
                      {assignee ? (
                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>→ {assignee}</Text>
                      ) : null}
                      {task.due_date ? (
                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(task.due_date)}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })
          )}
          {tasks.length > 15 ? (
            <Text style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
              +{tasks.length - 15} more tasks
            </Text>
          ) : null}
        </Card>

        {/* ── Progress Bar Detail ── */}
        <Card>
          <CardTitle title="Progress" icon="stats-chart-outline" />
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748b" }}>Overall Completion</Text>
              <Text style={{ fontSize: 14, fontWeight: "800", color: progressColor }}>{progress}%</Text>
            </View>
            <View style={{ height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
              <View style={{ width: `${progress}%`, height: "100%", backgroundColor: progressColor, borderRadius: 5 }} />
            </View>
          </View>
          {totalTasks > 0 ? (
            <>
              <View style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#10b981" }}>{doneTasks}</Text>
                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: "600" }}>Done</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#3b82f6" }}>{inProgressTasks}</Text>
                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: "600" }}>Ongoing</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#a855f7" }}>{todoTasks}</Text>
                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: "600" }}>To Do</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#f97316" }}>{totalTasks}</Text>
                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: "600" }}>Total</Text>
                </View>
              </View>
            </>
          ) : null}
        </Card>

      </ScrollView>

      {/* ══ Assign Employee Modal ══════════════════════════════ */}
      <Modal visible={assignModal} transparent animationType="slide" onRequestClose={() => setAssignModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "88%" }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" }} />
            </View>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Assign Employee</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Add team members to this project</Text>
              </View>
              <Pressable onPress={() => setAssignModal(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
              {/* Role */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Role</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {ROLES.map(r => (
                  <Pressable
                    key={r}
                    onPress={() => setSelectedRole(r)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: selectedRole === r ? "#fff7ed" : "#f8fafc", borderColor: selectedRole === r ? "#f97316" : "#e2e8f0" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: selectedRole === r ? "#f97316" : "#64748b" }}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Search employees */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Select Employees</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 }}>
                <Ionicons name="search" size={16} color="#94a3b8" />
                <TextInput
                  value={empSearch}
                  onChangeText={setEmpSearch}
                  placeholder="Search employees..."
                  placeholderTextColor="#94a3b8"
                  style={{ flex: 1, marginLeft: 8, fontSize: 14, color: "#1e293b" }}
                />
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {employees
                  .filter(e => !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()))
                  .filter(e => e.activeProjects < 3)
                  .map(e => {
                    const sel = selectedEmpIds.includes(String(e.id));
                    const palette = ["#f97316", "#0ea5e9", "#a855f7", "#10b981", "#e11d48", "#f59e0b"];
                    const color = palette[(e.name?.charCodeAt(0) ?? 0) % palette.length];
                    const initials = e.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <Pressable
                        key={String(e.id)}
                        onPress={() => {
                          const id = String(e.id);
                          setSelectedEmpIds(cur =>
                            cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
                          );
                          setAssignError("");
                        }}
                        style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, backgroundColor: sel ? "#fff7ed" : "#f8fafc", borderColor: sel ? "#f97316" : "#e2e8f0", marginRight: 8, marginBottom: 8, gap: 8 }}
                      >
                        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: sel ? color : "#e2e8f0", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 11, fontWeight: "800", color: sel ? "#fff" : "#94a3b8" }}>{initials}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: sel ? "#f97316" : "#475569" }}>{e.name}</Text>
                        {sel ? <Ionicons name="checkmark-circle" size={14} color="#f97316" /> : null}
                      </Pressable>
                    );
                  })}
              </View>

              {assignError ? (
                <View style={{ marginTop: 10, backgroundColor: "#fee2e2", borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>{assignError}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={assigning || !selectedEmpIds.length}
                onPress={handleAssign}
                style={{ marginTop: 20, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: assigning || !selectedEmpIds.length ? "#e2e8f0" : "#f97316", shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: assigning || !selectedEmpIds.length ? 0 : 0.3, shadowRadius: 10, elevation: assigning || !selectedEmpIds.length ? 0 : 5 }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: assigning || !selectedEmpIds.length ? "#94a3b8" : "#fff" }}>
                  {assigning ? "Assigning…" : selectedEmpIds.length ? `Assign ${selectedEmpIds.length} Employee${selectedEmpIds.length > 1 ? "s" : ""}` : "Select Employees"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
