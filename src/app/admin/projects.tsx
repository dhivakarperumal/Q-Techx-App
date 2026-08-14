import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Pressable,
} from "react-native";

import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { FAB } from "../../components/FAB";
import { TopHeader } from "../../components/TopHeader";

const filters = [
  { label: "All Projects", active: true, dot: "#f97316" },
  { label: "In Progress", active: false, dot: "#3b82f6" },
  { label: "Completed", active: false, dot: "#10b981" },
  { label: "On Hold", active: false, dot: "#a855f7" },
];

const ROLES = ["Project Manager", "Developer", "QA", "UI/UX", "Support"];

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assigned" | "unassigned">(
    "assigned",
  );
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState("All Projects");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedRole, setSelectedRole] = useState(ROLES[0] || "");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [assignmentDropdownOpen, setAssignmentDropdownOpen] = useState(false);

  const normalizeProject = useCallback((proj: any) => {
    const rawUuid =
      proj.uuid ||
      proj.project_uuid ||
      proj.projectId ||
      proj.project_id ||
      proj.id;
    const title =
      proj.title ||
      proj.name ||
      proj.project_name ||
      proj.projectName ||
      "Untitled Project";
    const company =
      proj.company ||
      proj.client_name ||
      proj.clientName ||
      proj.client ||
      "Internal";
    const dateValue =
      proj.date ||
      proj.project_start_date ||
      proj.start_date ||
      proj.projectStartDate;
    const endDate =
      proj.end_date || proj.estimated_completion_date || proj.project_end_date;
    
    const formattedStart = formatDate(dateValue);
    const formattedEnd = formatDate(endDate);
    
    const fromDate = formattedStart
      ? `${formattedStart}${formattedEnd ? ` – ${formattedEnd}` : ""}`
      : "No Date Provided";

    return {
      rawId: rawUuid,
      projectId: String(
        proj.id ??
          proj.project_id ??
          proj.projectId ??
          proj.uuid ??
          rawUuid ??
          "",
      ),
      uuid: String(
        rawUuid ?? proj.id ?? proj.project_id ?? proj.projectId ?? "",
      ),
      title,
      company,
      date: fromDate,
      status:
        proj.status ||
        proj.current_status ||
        proj.project_status ||
        "In Progress",
      progress: Number(
        proj.progress ?? proj.project_progress ?? proj.completion ?? 0,
      ),
      icon: "folder-outline",
      iconColor: "#3b82f6",
      iconBg: "bg-blue-50",
      progressColor: "#3b82f6",
      statusColor:
        proj.status === "Completed" || proj.current_status === "Completed"
          ? "text-green-600"
          : proj.status === "On Hold" || proj.current_status === "On Hold"
            ? "text-purple-600"
            : "text-blue-600",
      statusBg:
        proj.status === "Completed" || proj.current_status === "Completed"
          ? "bg-green-100"
          : proj.status === "On Hold" || proj.current_status === "On Hold"
            ? "bg-purple-100"
            : "bg-blue-100",
      raw: proj,
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsResponse, assignmentsResponse] = await Promise.all([
        api
          .get("/projects?limit=1000&page=1")
          .catch(() => ({ data: { data: [] } })),
        api
          .get("/projects/assignments/all?limit=1000&page=1")
          .catch(() => ({ data: { grouped: [] } })),
      ]);

      const projectsPayload = projectsResponse.data;
      const projectsArray = Array.isArray(projectsPayload)
        ? projectsPayload
        : projectsPayload?.data ||
          projectsPayload?.projects ||
          projectsPayload?.rows ||
          [];

      const assignmentsPayload = assignmentsResponse.data;
      const groups =
        assignmentsPayload?.grouped ||
        assignmentsPayload?.data ||
        assignmentsPayload?.rows ||
        assignmentsPayload?.assignments ||
        [];

      const assignmentMap = new Map<string, any>();

      (Array.isArray(groups) ? groups : []).forEach((group: any) => {
        const projectRef =
          group.project_uuid ||
          group.projectId ||
          group.project_id ||
          group.projectID ||
          group.project?.uuid ||
          group.project?.id ||
          group.uuid;

        const projectKey = projectRef ? String(projectRef) : "";
        const employees =
          group.employees ||
          group.assignedEmployees ||
          group.employeeRows ||
          group.project?.employees ||
          [];
        const teams =
          group.teams ||
          group.projectTeams ||
          group.teamAssignments ||
          group.project?.teams ||
          [];

        if (projectKey) {
          const memberData = {
            employees: Array.isArray(employees) ? employees : [],
            teams: Array.isArray(teams) ? teams : [],
            raw: group,
          };
          assignmentMap.set(projectKey, memberData);
        }
      });

      const mappedProjects = (
        Array.isArray(projectsArray) ? projectsArray : []
      ).map((proj: any) => {
        const normalizedProject = normalizeProject(proj);
        const key = String(
          normalizedProject.uuid || normalizedProject.projectId || "",
        );
        const assignmentData =
          assignmentMap.get(key) ||
          assignmentMap.get(
            String(proj.id || proj.project_id || proj.projectId || ""),
          ) ||
          {};
        const assignedEmployees = Array.isArray(assignmentData.employees)
          ? assignmentData.employees
          : [];
        const assignedTeams = Array.isArray(assignmentData.teams)
          ? assignmentData.teams
          : [];
        const names = [
          ...assignedEmployees.map((employee: any) => {
            return (
              employee.full_name ||
              employee.employee_name ||
              employee.name ||
              `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
              employee.employee_id ||
              employee.employeeCode ||
              "Employee"
            );
          }),
          ...assignedTeams.map(
            (team: any) =>
              team.team_name || team.name || team.teamName || "Team",
          ),
        ];

        return {
          ...normalizedProject,
          assignments: names,
          isAssigned: names.length > 0,
          assignmentMeta: assignmentData,
        };
      });

      const assigned = mappedProjects.filter((project) => project.isAssigned);
      const unassigned = mappedProjects.filter(
        (project) => !project.isAssigned,
      );

      setProjects(mappedProjects);
      setAssignedProjects(assigned);
      setUnassignedProjects(unassigned);

      // Compute progress from tasks (completed / total per project)
      try {
        const tasksRes = await api.get("/tasks?limit=1000&page=1");
        const tPayload = tasksRes.data;
        const extractRows = (p: any): any[] => {
          if (Array.isArray(p)) return p;
          if (p && typeof p === "object") {
            for (const key of ["data", "tasks", "rows", "results", "list"]) {
              if (Array.isArray(p[key])) return p[key];
            }
          }
          return [];
        };
        const allTasks = extractRows(tPayload);
        const newProgressMap: Record<string, number> = {};
        mappedProjects.forEach((p: any) => {
          const projectTasks = allTasks.filter((t: any) => {
            const tProjId = String(t.project_id ?? t.projectId ?? t.project?.id ?? "");
            const tProjUuid = String(t.project_uuid ?? t.project?.uuid ?? t.project ?? "");
            const tProjName = String(t.project_name ?? t.projectName ?? t.project?.name ?? "").toLowerCase();
            return (
              tProjId === String(p.projectId) ||
              tProjUuid === p.uuid ||
              (p.title && tProjName === p.title.toLowerCase())
            );
          });
          if (projectTasks.length > 0) {
            const done = projectTasks.filter(
              (t: any) => (t.status ?? t.task_status ?? "").toLowerCase() === "completed"
            ).length;
            newProgressMap[p.uuid] = Math.round((done / projectTasks.length) * 100);
          } else {
            newProgressMap[p.uuid] = 0;
          }
        });
        setProgressMap(newProgressMap);
      } catch (_) {}
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
      setAssignedProjects([]);
      setUnassignedProjects([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeProject]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/employees?limit=1000&page=1");
      const payload = response.data;
      const rows = Array.isArray(payload)
        ? payload
        : payload?.data || payload?.employees || payload?.rows || [];

      const normalized = (Array.isArray(rows) ? rows : []).map(
        (employee: any) => ({
          id:
            employee.employee_id ||
            employee.employeeId ||
            employee.id ||
            employee.employeeCode ||
            employee.uuid ||
            employee.staff_id ||
            "",
          name:
            employee.full_name ||
            employee.employee_name ||
            employee.name ||
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
            employee.username ||
            "Employee",
          activeProjectCount: Number(
            employee.active_projects ||
              employee.activeProjects ||
              employee.active_project_count ||
              employee.activeProjectCount ||
              employee.project_count ||
              employee.current_projects ||
              0,
          ),
          raw: employee,
        }),
      );

      setEmployees(normalized);
    } catch (error) {
      console.error("Failed to fetch employees for assignment modal:", error);
      setEmployees([]);
    }
  }, []);

  const statCards = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(
      (project) =>
        String(project.status || "")
          .toLowerCase()
          .trim() === "in progress",
    ).length;
    const completed = projects.filter(
      (project) =>
        String(project.status || "")
          .toLowerCase()
          .trim() === "completed",
    ).length;
    const onHold = projects.filter(
      (project) =>
        String(project.status || "")
          .toLowerCase()
          .trim() === "on hold",
    ).length;

    const baseCards = [
      {
        label: "Total Projects",
        value: String(total),
        sub: "All Projects",
        icon: "folder",
        color: "#f97316",
        bg: "bg-orange-50",
      },
      {
        label: "In Progress",
        value: String(inProgress),
        sub: `${total ? Math.round((inProgress / total) * 100) : 0}%`,
        icon: "briefcase",
        color: "#3b82f6",
        bg: "bg-blue-50",
      },
      {
        label: "Completed",
        value: String(completed),
        sub: `${total ? Math.round((completed / total) * 100) : 0}%`,
        icon: "checkmark-circle",
        color: "#10b981",
        bg: "bg-green-50",
      },
      {
        label: "On Hold",
        value: String(onHold),
        sub: `${total ? Math.round((onHold / total) * 100) : 0}%`,
        icon: "pause-circle",
        color: "#a855f7",
        bg: "bg-purple-50",
      },
    ];

    return baseCards;
  }, [projects]);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, [fetchProjects, fetchEmployees]);

  const visibleProjects = useMemo(() => {
    const base =
      activeTab === "assigned" ? assignedProjects : unassignedProjects;
    const query = search.trim().toLowerCase();

    return base.filter((project) => {
      const matchesSearch =
        !query ||
        [project.title, project.company, project.status, project.date].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
        );

      const matchesStatus =
        selectedStatusFilter === "All Projects" ||
        project.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    activeTab,
    assignedProjects,
    unassignedProjects,
    search,
    selectedStatusFilter,
  ]);

  const openAssignmentModal = useCallback((projectId = "") => {
    setShowAssignmentModal(true);
    setSelectedProjectId(projectId);
    setSelectedEmployeeIds([]);
    setSelectedRole(ROLES[0] || "");
    setAssignmentSearch("");
    setAssignmentError("");
    setAssignmentSuccess("");
  }, []);

  const handleAssignEmployees = useCallback(async () => {
    if (!selectedProjectId) {
      setAssignmentError("Please select a project first.");
      return;
    }

    if (!selectedEmployeeIds.length) {
      setAssignmentError("Select at least one employee.");
      return;
    }

    try {
      setAssigning(true);
      setAssignmentError("");
      setAssignmentSuccess("");

      await Promise.all(
        selectedEmployeeIds.map((employeeId) =>
          api.post(`/projects/${selectedProjectId}/assignments`, {
            project_id: selectedProjectId,
            employee_id: employeeId,
            role: selectedRole,
          }),
        ),
      );

      await Promise.all([fetchProjects(), fetchEmployees()]);
      setAssignmentSuccess("Project assigned successfully.");
      setActiveTab("assigned");
      setSelectedProjectId("");
      setSelectedEmployeeIds([]);
      setSelectedRole(ROLES[0] || "");
      setAssignmentSearch("");
      setShowAssignmentModal(false);
    } catch (error: any) {
      setAssignmentError(error?.message || "Unable to assign the project.");
    } finally {
      setAssigning(false);
    }
  }, [
    fetchEmployees,
    fetchProjects,
    selectedEmployeeIds,
    selectedProjectId,
    selectedRole,
  ]);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}>
        <View className="mt-5 mb-2 flex-row flex-wrap justify-between">
          {statCards.map((stat, idx) => (
            <View
              key={idx}
              className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white border border-orange-100" style={{ shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}
            >
              <LinearGradient
                colors={["#ffffff", "#fff7ed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons name={stat.icon as any} size={20} color="#f97316" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                      numberOfLines={2}
                    >
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text className="text-[10px] font-bold text-orange-500">
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        <View className="mt-3 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 mb-3">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-2 py-5 rounded text-sm text-slate-900"
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => setStatusDropdownOpen(true)}
            className="flex-1 h-12 rounded-2xl border border-slate-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-xs font-medium text-slate-700">
              {selectedStatusFilter}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
          <Pressable
            onPress={() => setAssignmentDropdownOpen(true)}
            className="flex-1 h-12 rounded-2xl border border-slate-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-xs font-medium text-slate-700 capitalize">
              {activeTab === "assigned" ? "Assigned Projects" : "Unassigned Projects"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
        </View>

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
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Status
              </Text>
              {filters.map((filter) => (
                <Pressable
                  key={filter.label}
                  onPress={() => {
                    setSelectedStatusFilter(filter.label);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${selectedStatusFilter === filter.label ? "font-bold text-orange-500" : "text-slate-700"}`}>
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={assignmentDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAssignmentDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setAssignmentDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Assignment Type
              </Text>
              <Pressable
                onPress={() => {
                  setActiveTab("assigned");
                  setAssignmentDropdownOpen(false);
                }}
                className="px-5 py-4 border-b border-slate-100"
              >
                <Text className={`text-sm ${activeTab === "assigned" ? "font-bold text-orange-500" : "text-slate-700"}`}>
                  Assigned Projects ({assignedProjects.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActiveTab("unassigned");
                  setAssignmentDropdownOpen(false);
                }}
                className="px-5 py-4 border-b border-slate-100"
              >
                <Text className={`text-sm ${activeTab === "unassigned" ? "font-bold text-orange-500" : "text-slate-700"}`}>
                  Unassigned Projects ({unassignedProjects.length})
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        

        <View>
          {loading || assigning ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#f97316" />
              <Text className="text-center text-slate-500 mt-2">
                {assigning ? "Updating assignment..." : "Loading projects..."}
              </Text>
            </View>
          ) : visibleProjects.length === 0 ? (
            <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <Text className="text-center text-slate-600 font-bold">
                No projects found
              </Text>
              <Text className="text-center text-slate-400 text-xs mt-1">
                Try a different search or filter selection.
              </Text>
            </View>
          ) : (
            visibleProjects.map((project, idx) => (
              <TouchableOpacity
                key={`${project.uuid || project.projectId || idx}`}
                className="mb-4 bg-white rounded-[24px] p-4 border border-slate-100 shadow-sm"
                activeOpacity={0.9}
                onPress={() =>
                  router.push(
                    `/admin/project-detail/${project.uuid || project.projectId}`,
                  )
                }
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row flex-1">
                    <View className="mr-4 relative h-14 w-14 rounded-full items-center justify-center bg-orange-50 border border-orange-100">
                      <Ionicons
                        name={project.icon as any}
                        size={25}
                        color="#f97316"
                      />
                    </View>
                    <View className="flex-1 justify-center">
                      <View className="flex-row items-center mb-1.5 flex-wrap">
                        <Text className="text-slate-900 font-bold text-[15px] mr-2">
                          {project.title}
                        </Text>
                        <View className="px-2 py-0.5 rounded-full bg-orange-50">
                          <Text className="text-[9px] font-bold text-orange-600">
                            {project.status}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center mb-1.5">
                        <Ionicons
                          name="business-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="ml-1 text-xs font-semibold text-slate-500">
                          {project.company}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="ml-1 text-xs font-medium text-slate-500">
                          {project.date}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                </View>

                <View>
                  {(() => {
                    const pct = progressMap[project.uuid] ?? project.progress ?? 0;
                    const barColor = pct >= 100 ? "#10b981" : pct >= 50 ? "#3b82f6" : "#f97316";
                    return (
                      <>
                        <View className="mb-3 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Ionicons name="pulse-outline" size={13} color="#64748b" />
                            <Text className="ml-1 text-xs font-semibold text-slate-500">Progress</Text>
                          </View>
                          <Text className="text-xs font-black" style={{ color: barColor }}>{pct}%</Text>
                        </View>
                        <View className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <View
                            className="h-full rounded-full"
                            style={{ width: pct > 0 ? `${pct}%` : "3%", backgroundColor: barColor }}
                          />
                        </View>
                      </>
                    );
                  })()}

                  <View className="mb-3 flex-row items-start rounded-2xl bg-slate-50 p-3">
                    <Ionicons name="people-outline" size={14} color="#64748b" />
                    <Text className="ml-2 flex-1 text-[11px] font-medium text-slate-600">
                      {project.isAssigned
                        ? `Assigned to: ${project.assignments.join(", ")}`
                        : "Unassigned — no employee or team linked yet"}
                    </Text>
                  </View>

                  {activeTab === "unassigned" ? (
                    <View className="flex-row items-center justify-between gap-2">
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/admin/project-detail/${project.uuid || project.projectId}`,
                          )
                        }
                        className="flex-1 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5"
                      >
                        <Text className="text-center text-xs font-black text-orange-700">
                          View Details
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowAssignmentModal(true);
                          setSelectedProjectId(
                            project.projectId ?? project.uuid ?? "",
                          );
                          setSelectedEmployeeIds([]);
                          setSelectedRole(ROLES[0] || "");
                          setAssignmentSearch("");
                          setAssignmentError("");
                          setAssignmentSuccess("");
                        }}
                        className="flex-1 rounded-2xl bg-[#2563eb] px-4 py-2.5"
                      >
                        <Text className="text-center text-xs font-black text-white">
                          Assign Team
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {showAssignmentModal && (
        <Modal visible={showAssignmentModal} transparent animationType="slide">
          <View className="flex-1 bg-black/25 justify-end">
            <View className="max-h-[92%] rounded-t-[32px] border border-slate-200 bg-[#f8fafc] shadow-2xl">
              <View className="items-center pt-3">
                <View className="h-1.5 w-14 rounded-full bg-slate-300" />
              </View>
              <View className="flex-row items-center justify-between border-b border-slate-200 bg-black px-5 pb-4 pt-4 rounded-t-[32px]">
                <View className="flex-1 pr-3">
                  <Text className="text-xl font-black text-orange-500">
                    Project Assignment
                  </Text>
                  <Text className="mt-1 text-xs text-orange-200">
                    Assign employees to a project
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAssignmentModal(false)}
                  className="h-9 w-9 items-center justify-center rounded-full bg-orange-100"
                >
                  <Ionicons name="close" size={20} color="#c2410c" />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
              >
                <Text className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">
                  Select Project
                </Text>
                <View className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {projects.length === 0 ? (
                    <Text className="text-slate-500 text-xs">
                      No projects available.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {projects.map((project) => (
                        <TouchableOpacity
                          key={`${project.uuid || project.projectId}`}
                          onPress={() => {
                            setSelectedProjectId(
                              project.projectId || project.uuid || "",
                            );
                            setAssignmentError("");
                          }}
                          className={`px-4 py-3 mr-2 rounded-xl border ${selectedProjectId === (project.projectId || project.uuid || "") ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                        >
                          <Text
                            className={`text-xs font-bold ${selectedProjectId === (project.projectId || project.uuid || "") ? "text-orange-700" : "text-slate-700"}`}
                          >
                            {project.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <Text className="text-xs font-black uppercase tracking-wide text-slate-400 mt-5 mb-2">
                  Assign as Role
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setSelectedRole(role)}
                      className={`px-4 py-2 rounded-full border ${selectedRole === role ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                    >
                      <Text
                        className={`text-xs font-black ${selectedRole === role ? "text-orange-600" : "text-slate-700"}`}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text className="text-xs font-black uppercase tracking-wide text-slate-400 mt-5 mb-2">
                  Select Employees
                </Text>
                <View className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex-row items-center">
                  <Ionicons name="search" size={18} color="#94a3b8" />
                  <TextInput
                    value={assignmentSearch}
                    onChangeText={setAssignmentSearch}
                    placeholder="Search employees..."
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-2 text-sm text-slate-900"
                  />
                </View>

                <View className="mt-4 flex-row flex-wrap">
                  {employees
                    .filter((employee) => {
                      const query = assignmentSearch.trim().toLowerCase();
                      if (!query) return true;
                      return String(employee.name || "")
                        .toLowerCase()
                        .includes(query);
                    })
                    .filter(
                      (employee) => Number(employee.activeProjectCount) < 3,
                    )
                    .map((employee) => {
                      const isSelected = selectedEmployeeIds.includes(
                        String(employee.id),
                      );
                      return (
                        <TouchableOpacity
                          key={String(employee.id)}
                          onPress={() => {
                            const employeeId = String(employee.id);
                            if (isSelected) {
                              setSelectedEmployeeIds((current) =>
                                current.filter((id) => id !== employeeId),
                              );
                            } else {
                              setSelectedEmployeeIds((current) => [
                                ...current,
                                employeeId,
                              ]);
                            }
                            setAssignmentError("");
                          }}
                          className={`rounded-xl border px-3 py-2 mr-2 mb-2 ${isSelected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                        >
                          <Text
                            className={`text-xs font-bold ${isSelected ? "text-orange-600" : "text-slate-700"}`}
                          >
                            {employee.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {assignmentError ? (
                  <View className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <Text className="text-rose-700 text-xs font-bold">
                      {assignmentError}
                    </Text>
                  </View>
                ) : null}

                {assignmentSuccess ? (
                  <View className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <Text className="text-emerald-700 text-xs font-bold">
                      {assignmentSuccess}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  disabled={
                    !selectedProjectId ||
                    selectedEmployeeIds.length === 0 ||
                    assigning
                  }
                  onPress={handleAssignEmployees}
                  className={`mt-6 rounded-2xl px-5 py-3 ${!selectedProjectId || selectedEmployeeIds.length === 0 || assigning ? "bg-slate-200" : "bg-orange-500"}`}
                >
                  <Text
                    className={`text-center text-sm font-black ${!selectedProjectId || selectedEmployeeIds.length === 0 || assigning ? "text-slate-500" : "text-white"}`}
                  >
                    {assigning ? "Assigning..." : "Assign"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <AdminBottomBar />

      <FAB onPress={() => openAssignmentModal()} />
    </View>
  );
}
