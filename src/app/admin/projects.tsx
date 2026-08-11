import { Ionicons } from "@expo/vector-icons";
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

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<any[]>([]);
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
    const fromDate = dateValue
      ? `${dateValue}${endDate ? ` – ${endDate}` : ""}`
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

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 mb-6"
          className="overflow-visible"
        >
          {statCards.map((stat, idx) => (
            <View
              key={idx}
              className="bg-white rounded-[24px] p-4 mr-4 border border-slate-100 shadow-sm w-[130px]"
            >
              <View
                className={`w-10 h-10 rounded-[14px] ${stat.bg} items-center justify-center mb-3`}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={20}
                  color={stat.color}
                />
              </View>
              <Text className="text-slate-500 font-bold text-[10px] mb-1">
                {stat.label}
              </Text>
              <Text className="text-slate-900 font-black text-2xl tracking-tight mb-1">
                {stat.value}
              </Text>
              <Text className="text-slate-400 text-[10px] font-medium">
                {stat.sub}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="px-5 mb-4 flex-row items-center gap-3">
          <View className="flex-1 bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search projects..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
          </View>
          <TouchableOpacity className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
            <Ionicons name="filter" size={18} color="#64748b" />
            <Text className="text-slate-700 font-bold text-sm ml-2 mr-1">
              Filter
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 mb-6"
        >
          {filters.map((filter, idx) => (
            <TouchableOpacity
              key={idx}
              className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
                selectedStatusFilter === filter.label
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white"
              }`}
              onPress={() => setSelectedStatusFilter(filter.label)}
            >
              {selectedStatusFilter === filter.label ? (
                <Ionicons
                  name="grid"
                  size={14}
                  color="#f97316"
                  className="mr-2"
                />
              ) : (
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: filter.dot }}
                />
              )}
              <Text
                className={`text-xs font-bold ${selectedStatusFilter === filter.label ? "text-orange-600 ml-1.5" : "text-slate-600"}`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-5 mb-4">
          <View className="flex-row rounded-2xl border border-slate-200 bg-white p-1">
            <TouchableOpacity
              onPress={() => setActiveTab("assigned")}
              className={`flex-1 rounded-xl px-3 py-2 ${activeTab === "assigned" ? "bg-orange-500" : "bg-white"}`}
            >
              <Text
                className={`text-center text-xs font-black ${activeTab === "assigned" ? "text-white" : "text-slate-700"}`}
              >
                Assigned Projects ({assignedProjects.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("unassigned")}
              className={`flex-1 rounded-xl px-3 py-2 ${activeTab === "unassigned" ? "bg-orange-500" : "bg-white"}`}
            >
              <Text
                className={`text-center text-xs font-black ${activeTab === "unassigned" ? "text-white" : "text-slate-700"}`}
              >
                Unassigned Projects ({unassignedProjects.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mb-4">
          <TouchableOpacity
            onPress={() => {
              openAssignmentModal();
            }}
            className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex-row items-center justify-center"
          >
            <View className="w-11 h-11 rounded-2xl bg-orange-500 items-center justify-center mr-3">
              <Ionicons name="add" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-black text-sm">
                Project Assigned
              </Text>
              <Text className="text-slate-500 text-[11px] font-medium">
                Add employees to a project
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View className="px-5">
          {loading || assigning ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#2563eb" />
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
                className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm"
                activeOpacity={0.88}
                onPress={() => router.push(`/admin/project-detail/${project.uuid || project.projectId}`)}
              >
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-14 h-14 rounded-[18px] ${project.iconBg} items-center justify-center mr-4`}
                    >
                      <Ionicons
                        name={project.icon as any}
                        size={28}
                        color={project.iconColor}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-bold text-base mb-1">
                        {project.title}
                      </Text>
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="business-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-xs ml-1">
                          {project.company}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-xs ml-1">
                          {project.date}
                        </Text>
                      </View>
                      <View className="mt-2 flex-row items-center flex-wrap">
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color="#64748b"
                        />
                        <Text className="text-slate-500 text-[11px] ml-1">
                          {project.isAssigned
                            ? `Assigned to: ${project.assignments.join(", ")}`
                            : "Unassigned — no employee or team linked"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="items-end justify-between min-h-[52px] py-1">
                    <TouchableOpacity>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                    <View
                      className={`px-2 py-1 rounded-md ${project.statusBg}`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${project.statusColor}`}
                      >
                        {project.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center mt-2">
                  <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mr-3">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.progressColor,
                      }}
                    />
                  </View>
                  <Text
                    className="text-slate-600 font-bold text-xs"
                    style={{ color: project.progressColor }}
                  >
                    {project.progress}%
                  </Text>
                </View>

                {activeTab === "unassigned" && (
                  <View className="mt-4 flex-row items-center justify-between">
                    <TouchableOpacity
                      onPress={() => router.push(`/admin/project-detail/${project.uuid || project.projectId}`)}
                      className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
                      <Text className="text-orange-700 font-black text-xs">
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
                      className="bg-[#2563eb] rounded-xl px-4 py-2"
                    >
                      <Text className="text-white font-black text-xs">
                        Assign Employee / Assign Team
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {showAssignmentModal && (
        <Modal visible={showAssignmentModal} transparent animationType="slide">
          <View className="flex-1 bg-black/30 justify-end">
            <View className="bg-white rounded-t-[30px] max-h-[90%]">
              <View className="px-5 py-4 border-b border-slate-100 flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-black text-slate-900">
                    Project Assignment
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    Assign employees to a project
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#94a3b8" />
                </TouchableOpacity>
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
