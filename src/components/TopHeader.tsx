import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import {
  AlignLeft,
  CalendarDays,
  CheckCircle2,
  Bell,
  Video,
  CheckSquare,
} from "lucide-react-native";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import api from "../api";

const { width } = Dimensions.get("window");

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

type TopHeaderProps = {
  title?: string;
  subtitle?: string;
};

type LeaveNotification = {
  id?: number | string;
  employee: string;
  type: string;
  date: string;
  status: string;
  reason?: string;
};

type TaskNotification = {
  id?: number | string;
  title: string;
  project: string;
  assigned: string;
  assignedId: string;
  status: string;
};

type EmployeeAlert = {
  id: string | number;
  type: "task" | "leave" | "meeting";
  title: string;
  sub: string;
  time: string;
  link: string;
  status?: string;
};

const getEmployeeReference = (user: Record<string, unknown> | null | undefined): string[] => {
  if (!user) return [];
  const u = user as any;
  return [
    u?.employee_id,
    u?.employeeId,
    u?.user_id,
    u?.id,
    u?._id,
    u?.userId,
    u?.uuid,
    u?.employee_code,
    u?.employeeCode,
    u?.employee?.employee_id,
    u?.employee?.employeeId,
    u?.employee?.id,
  ]
    .filter(Boolean)
    .map(String);
};

function formatTimeSafe(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDateSafe(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate().toString().padStart(2, "0")} ${MONTH_SHORT[d.getMonth()] || ""} ${d.getFullYear()}`;
}

function isSameDaySafe(dateStr?: string | Date | null, compare = new Date()): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === compare.getFullYear() &&
    d.getMonth() === compare.getMonth() &&
    d.getDate() === compare.getDate()
  );
}

export function TopHeader({ title, subtitle }: TopHeaderProps) {
  const router = useRouter();
  const segments = useSegments();
  const { user, logout } = useAuth();

  // Profile Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;

  // Sidebar (Full-Screen Menu) state
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarSlideAnim = useRef(new Animated.Value(-width)).current;
  const sidebarFadeAnim = useRef(new Animated.Value(0)).current;

  // Admin Notification state
  const [leaveNotifications, setLeaveNotifications] = useState<LeaveNotification[]>([]);
  const [taskNotifications, setTaskNotifications] = useState<TaskNotification[]>([]);
  const [adminNotificationType, setAdminNotificationType] = useState<"leave" | "task" | null>(null);

  // Employee Notification state
  const [employeeAlerts, setEmployeeAlerts] = useState<{
    tasks: EmployeeAlert[];
    leaves: EmployeeAlert[];
    meetings: EmployeeAlert[];
  }>({ tasks: [], leaves: [], meetings: [] });
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeFilterTab, setEmployeeFilterTab] = useState<"All" | "Tasks" | "Leaves" | "Meetings">("All");

  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Derive display name
  const rawName =
    (user?.name as string) ||
    (user?.full_name as string) ||
    (user?.first_name as string) ||
    (user?.username as string) ||
    (user?.employee_name as string) ||
    (user?.displayName as string) ||
    "";

  const userEmail = (user?.email as string) || "";
  const emailUsername = userEmail.includes("@")
    ? userEmail.split("@")[0]
    : userEmail;

  const capitalise = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName = rawName
    ? capitalise(rawName)
    : emailUsername
      ? capitalise(emailUsername)
      : "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();
  const userRole =
    (user?.role as string)?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Staff";

  const rawRole = String(user?.role || user?.user_role || user?.role_name || "").toLowerCase().trim();
  const inAdminGroup = segments.length > 0 && segments[0] === "admin";

  const isAdmin =
    inAdminGroup ||
    rawRole === "admin" ||
    rawRole === "administrator" ||
    rawRole.includes("admin") ||
    Boolean(user?.is_admin || user?.isAdmin || (user?.role_id && Number(user.role_id) === 1));

  // -------------------------------------------------------------
  // ADMIN NOTIFICATIONS FETCH
  // -------------------------------------------------------------
  const fetchAdminNotifications = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setNotificationsLoading(true);

      // 1. FETCH PENDING LEAVE REQUESTS
      try {
        const { data } = await api.get("/employee-leaves/all");
        const rawLeaves = data?.data ?? data?.leaves ?? data;
        const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];

        const pendingLeaves = leaves
          .filter((leave: any) => {
            const status = String(leave?.status || "").toLowerCase().trim();
            return !status || status === "pending" || status === "applied" || status === "requested";
          })
          .map((leave: any) => {
            const empName =
              `${leave?.first_name || ""} ${leave?.last_name || ""}`.trim() ||
              leave?.employee_name ||
              leave?.full_name ||
              leave?.name ||
              leave?.employee_code ||
              "Employee";

            let formattedDate = "";
            if (leave?.from_date) {
              const d = new Date(leave.from_date);
              if (!isNaN(d.getTime())) {
                formattedDate = `${d.getDate().toString().padStart(2, "0")} ${MONTH_SHORT[d.getMonth()] || ""} ${d.getFullYear()}`;
              } else {
                formattedDate = String(leave.from_date);
              }
            }

            return {
              id: leave?.id || leave?.leave_id || leave?.uuid,
              employee: empName,
              type: leave?.leave_type || leave?.type || "Leave",
              date: formattedDate,
              status: leave?.status || "Pending",
              reason: leave?.reason || leave?.description || "",
            };
          });

        setLeaveNotifications(pendingLeaves);
      } catch (error: any) {
        console.error(
          "[TopHeader] Admin Leave notification API error:",
          error?.status || error?.response?.status,
          error?.message
        );
      }

      // 2. FETCH ACTIVE / PENDING TASK NOTIFICATIONS
      try {
        const { data } = await api.get("/tasks", {
          params: {
            page: 1,
            limit: 100,
          },
        });

        const rawTasks = data?.data?.tasks ?? data?.data ?? data?.tasks ?? data;
        const tasks = Array.isArray(rawTasks) ? rawTasks : [];

        const activeTasks = tasks
          .filter((task: any) => {
            const status = String(task?.status || "").toLowerCase().trim();
            return (
              status !== "completed" &&
              status !== "cancelled" &&
              status !== "canceled" &&
              status !== "done" &&
              status !== "closed"
            );
          })
          .map((task: any) => ({
            id: task?.id || task?.task_id || task?.uuid,
            title:
              task?.task_name ||
              task?.module_name ||
              task?.title ||
              task?.name ||
              "Untitled Task",
            project: task?.project_name || task?.project_title || task?.project || "",
            assigned:
              task?.assigned_to_name ||
              task?.employee_name ||
              task?.assigned_name ||
              (typeof task?.assigned_to === "string" ? task.assigned_to : "") ||
              "",
            assignedId:
              task?.assigned_to_code ||
              task?.employee_code ||
              "",
            status: task?.status || "Pending",
          }));

        setTaskNotifications(activeTasks);
      } catch (error: any) {
        console.error(
          "[TopHeader] Admin Task notification API error:",
          error?.status || error?.response?.status,
          error?.message
        );
      }
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAdmin]);

  // -------------------------------------------------------------
  // EMPLOYEE ALERTS FETCH (Tasks, Leaves, Meetings)
  // -------------------------------------------------------------
  const fetchEmployeeAlerts = useCallback(async () => {
    if (!user || isAdmin) return;
    try {
      setNotificationsLoading(true);
      const possibleIds = getEmployeeReference(user);
      const currentUserName = (
        (user?.name as string) ||
        (user?.full_name as string) ||
        (user?.username as string) ||
        (user?.employee_name as string) ||
        ""
      ).trim().toLowerCase();

      let taskAlerts: EmployeeAlert[] = [];
      let leaveAlerts: EmployeeAlert[] = [];
      let meetingAlerts: EmployeeAlert[] = [];

      // 1. Fetch Employee Tasks
      try {
        const [assignRes, taskRes] = await Promise.all([
          api.get("/tasks/assignments").catch(() => ({ data: [] })),
          api.get("/tasks", { params: { page: 1, limit: 100 } }).catch(() => ({ data: [] })),
        ]);

        const rawAssignments = assignRes.data?.data ?? assignRes.data ?? [];
        const rawTasks = taskRes.data?.data?.tasks ?? taskRes.data?.data ?? taskRes.data?.tasks ?? taskRes.data ?? [];

        const assignList = Array.isArray(rawAssignments) ? rawAssignments : [];
        const taskList = Array.isArray(rawTasks) ? rawTasks : [];

        const combinedTasks = [...assignList, ...taskList];
        const uniqueTaskMap = new Map<string, any>();

        for (const t of combinedTasks) {
          const tId = String(t?.uuid || t?.id || t?.task_id || "");
          if (tId && !uniqueTaskMap.has(tId)) {
            uniqueTaskMap.set(tId, t);
          }
        }

        const employeeTasks = Array.from(uniqueTaskMap.values()).filter((t: any) => {
          const assignedId = String(
            t?.assigned_to ??
            t?.assigned_employee_id ??
            t?.employee_id ??
            t?.employeeId ??
            t?.user_id ??
            t?.assigned_to_code ??
            ""
          );
          const assignedName = String(
            t?.assigned_to_name ??
            t?.employee_name ??
            t?.assigned_name ??
            ""
          ).trim().toLowerCase();

          const isAssigned =
            (assignedId && possibleIds.includes(assignedId)) ||
            (currentUserName && assignedName && assignedName === currentUserName);

          if (!isAssigned && possibleIds.length > 0) return false;

          const status = String(t?.status || t?.task_status || t?.current_status || "").toLowerCase().trim();
          const isFinished = ["completed", "done", "cancelled", "closed"].includes(status);
          const isToday = isSameDaySafe(t?.assignment_date || t?.created_at);

          return !isFinished || isToday;
        });

        taskAlerts = employeeTasks.slice(0, 15).map((t: any) => {
          const isToday = isSameDaySafe(t?.assignment_date || t?.created_at);
          const dateVal = t?.assignment_date || t?.created_at || t?.updated_at;
          return {
            id: t?.uuid || t?.id || t?.task_id || Math.random(),
            type: "task",
            title: isToday ? "Today Assigned Task" : "Assigned Task",
            sub: t?.task_name || t?.module_name || t?.title || t?.name || "Untitled Task",
            time: formatTimeSafe(dateVal),
            link: "/employee/tasks",
            status: t?.status || "Pending",
          };
        });
      } catch (err) {
        console.error("[TopHeader] Employee Tasks error:", err);
      }

      // 2. Fetch Employee Leaves
      try {
        const { data } = await api.get("/employee-leaves/my-leaves");
        const rawLeaves = data?.data?.leaves ?? data?.data ?? data?.leaves ?? data;
        const leaves = Array.isArray(rawLeaves) ? rawLeaves : [];

        const myLeaves = leaves.filter((l: any) => {
          const s = String(l?.status || "").toLowerCase().trim();
          return s === "approved" || s === "pending" || s === "rejected" || !s;
        });

        leaveAlerts = myLeaves.slice(0, 15).map((l: any) => {
          const status = String(l?.status || "Pending");
          const isApproved = status.toLowerCase() === "approved";
          const fromStr = formatDateSafe(l?.from_date);
          const toStr = formatDateSafe(l?.to_date || l?.from_date);
          const dateRange = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
          const leaveType = l?.leave_type || l?.type || "Leave";

          return {
            id: l?.id || l?.leave_id || l?.uuid || Math.random(),
            type: "leave",
            title: isApproved ? "Leave approved" : `Leave ${status.toLowerCase()}`,
            sub: `${dateRange} · ${leaveType}`,
            time: formatTimeSafe(l?.updated_at || l?.created_at),
            link: "/employee/leave",
            status: status,
          };
        });
      } catch (err) {
        console.error("[TopHeader] Employee Leaves error:", err);
      }

      // 3. Fetch Employee Meetings / Events
      try {
        const [eventsRes, myEventsRes] = await Promise.all([
          api.get("/events").catch(() => ({ data: [] })),
          api.get("/myevents").catch(() => ({ data: [] })),
        ]);

        const normalizeList = (payload: any) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          if (Array.isArray(payload?.rows)) return payload.rows;
          if (Array.isArray(payload?.events)) return payload.events;
          return [];
        };

        let personalEvents = normalizeList(myEventsRes?.data);
        let officeEvents = normalizeList(eventsRes?.data);

        if (possibleIds.length > 0) {
          personalEvents = personalEvents.filter((evt: any) =>
            possibleIds.includes(String(evt?.user_id || evt?.userId || evt?.employeeId || evt?.employee_id || ""))
          );
          officeEvents = officeEvents.filter((evt: any) => {
            const participants = evt?.participants;
            if (!participants) return true;
            const normalizedParticipants =
              typeof participants === "string"
                ? (() => {
                    try {
                      return JSON.parse(participants);
                    } catch {
                      return [];
                    }
                  })()
                : participants;
            if (!Array.isArray(normalizedParticipants)) return true;
            return normalizedParticipants.some((part: any) => {
              if (typeof part === "object" && part !== null) {
                const partId = String(part.user_id || part.userId || part.employee_id || part.employeeId || "");
                const partName = String(part.name || part.full_name || part.username || "").trim().toLowerCase();
                return (
                  (partId && possibleIds.includes(partId)) ||
                  (currentUserName && partName && partName === currentUserName)
                );
              }
              return (
                typeof part === "string" &&
                currentUserName &&
                String(part).trim().toLowerCase() === currentUserName
              );
            });
          });
        }

        const allEvents = [...personalEvents, ...officeEvents];
        const uniqueEvents = Array.from(
          new Map(
            allEvents.map((evt: any) => [
              evt?.id ||
                evt?.uuid ||
                `${evt?.title || evt?.event_name || "event"}-${evt?.planDate || evt?.startDate || evt?.plan_date || evt?.start_time || evt?.date || ""}`,
              evt,
            ])
          ).values()
        );

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcomingEvents = uniqueEvents.filter((evt: any) => {
          const dateVal =
            evt?.planDate ||
            evt?.startDate ||
            evt?.plan_date ||
            evt?.start_time ||
            evt?.date ||
            evt?.start ||
            evt?.event_date;
          if (!dateVal) return false;
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return false;
          return d >= now;
        });

        meetingAlerts = upcomingEvents.slice(0, 10).map((evt: any) => {
          const dateVal =
            evt?.planDate ||
            evt?.startDate ||
            evt?.plan_date ||
            evt?.start_time ||
            evt?.date ||
            evt?.start ||
            evt?.event_date;
          const meetingTime = formatTimeSafe(dateVal);
          const meetingDateStr = formatDateSafe(dateVal);

          return {
            id:
              evt?.id ||
              evt?.uuid ||
              `${evt?.title || evt?.event_name || evt?.planTitle || "meeting"}-${dateVal || ""}`,
            type: "meeting",
            title: "Meeting allotted",
            sub: `${evt?.title || evt?.event_name || evt?.planTitle || "Meeting"} · ${meetingDateStr}`,
            time: meetingTime,
            link: "/employee/meetings",
          };
        });
      } catch (err) {
        console.error("[TopHeader] Employee Meetings error:", err);
      }

      setEmployeeAlerts({
        tasks: taskAlerts,
        leaves: leaveAlerts,
        meetings: meetingAlerts,
      });
    } finally {
      setNotificationsLoading(false);
    }
  }, [user, isAdmin]);

  // Initial & periodic fetch based on role
  useEffect(() => {
    if (isAdmin) {
      fetchAdminNotifications();
      const interval = setInterval(fetchAdminNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      fetchEmployeeAlerts();
      const interval = setInterval(fetchEmployeeAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchAdminNotifications, fetchEmployeeAlerts]);

  // Admin Counts
  const leaveCount = leaveNotifications.length;
  const taskCount = taskNotifications.length;

  // Employee Combined Alerts & Unread Count
  const allEmployeeAlerts = useMemo(
    () => [...employeeAlerts.tasks, ...employeeAlerts.leaves, ...employeeAlerts.meetings],
    [employeeAlerts]
  );
  const employeeUnreadCount = allEmployeeAlerts.length;

  const filteredEmployeeAlerts = useMemo(() => {
    if (employeeFilterTab === "Tasks") return employeeAlerts.tasks;
    if (employeeFilterTab === "Leaves") return employeeAlerts.leaves;
    if (employeeFilterTab === "Meetings") return employeeAlerts.meetings;
    return allEmployeeAlerts;
  }, [employeeFilterTab, employeeAlerts, allEmployeeAlerts]);

  // -- Profile Dropdown Logic --
  const openDropdown = () => {
    setDropdownVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -8,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setDropdownVisible(false));
  };

  // -- Sidebar (Full Screen) Logic --
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.parallel([
      Animated.timing(sidebarFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarSlideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setSidebarVisible(false));
  };

  const handleLogout = () => {
    closeDropdown();
    closeSidebar();
    setTimeout(() => {
      Alert.alert("Log out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]);
    }, 200);
  };

  const dropdownItems = [
    {
      icon: "person-circle-outline" as const,
      label: "My Profile",
      onPress: () => {
        closeDropdown();
        setTimeout(() => {
          if (isAdmin) router.push("/admin/profile" as any);
          else router.push("/employee/profile" as any);
        }, 150);
      },
    },
    {
      icon: "log-out-outline" as const,
      label: "Log Out",
      color: "#ef4444",
      onPress: handleLogout,
    },
  ];

  const adminSidebarItems = [
    { label: "Dashboard", icon: "home-outline" as const, route: "/admin" },
    { label: "Projects", icon: "folder-outline" as const, route: "/admin/projects" },
    { label: "Tasks", icon: "checkmark-outline" as const, route: "/admin/tasks" },
    { label: "Team", icon: "people-outline" as const, route: "/admin/team" },
    { label: "Leaves", icon: "calendar-outline" as const, route: "/admin/leaves" },
    { label: "More", icon: "grid-outline" as const, route: "/admin/more" },
  ];

  const employeeSidebarItems = [
    { label: "Dashboard", icon: "home-outline" as const, route: "/employee" },
    { label: "Attendance", icon: "time-outline" as const, route: "/employee/attendance" },
    { label: "Leave", icon: "calendar-outline" as const, route: "/employee/leave" },
    { label: "Projects", icon: "folder-outline" as const, route: "/employee/projects" },
    { label: "Tasks", icon: "checkmark-outline" as const, route: "/employee/tasks" },
    { label: "Meetings", icon: "videocam-outline" as const, route: "/employee/meetings" },
    { label: "More", icon: "grid-outline" as const, route: "/employee/more" },
  ];

  const sidebarItems = isAdmin ? adminSidebarItems : employeeSidebarItems;

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between px-5 py-4">
        {/* Left — Hamburger Menu */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openSidebar}
          className="p-1 -ml-1"
        >
          <AlignLeft size={28} color="#1e293b" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="mx-3 flex-1">
          <Text className="text-base font-black text-slate-900">{title || "Q TECHX"}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text> : null}
        </View>

        {/* Right — Notifications + Avatar */}
        <View className="flex-row items-center gap-2.5">

          {isAdmin ? (
            <>
              {/* ADMIN LEAVE NOTIFICATIONS */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAdminNotificationType("leave")}
                accessibilityLabel="Leave requests"
                accessibilityRole="button"
                className="relative h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"
              >
                <CalendarDays
                  size={20}
                  color="#f97316"
                  strokeWidth={2.2}
                />

                {leaveCount > 0 && (
                  <View className="absolute -right-1.5 -top-1.5 min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-orange-500 border-2 border-white">
                    <Text className="text-[9px] font-black text-white">
                      {leaveCount > 99 ? "99+" : leaveCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* ADMIN TASK NOTIFICATIONS */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAdminNotificationType("task")}
                accessibilityLabel="Task notifications"
                accessibilityRole="button"
                className="relative h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"
              >
                <CheckCircle2
                  size={20}
                  color="#f97316"
                  strokeWidth={2.2}
                />

                {taskCount > 0 && (
                  <View className="absolute -right-1.5 -top-1.5 min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-orange-500 border-2 border-white">
                    <Text className="text-[9px] font-black text-white">
                      {taskCount > 99 ? "99+" : taskCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* EMPLOYEE NOTIFICATIONS BELL */
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEmployeeModalVisible(true)}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              className="relative h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100"
            >
              <Bell
                size={20}
                color="#f97316"
                strokeWidth={2.2}
              />

              {employeeUnreadCount > 0 && (
                <View className="absolute -right-1.5 -top-1.5 min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-orange-500 border-2 border-white">
                  <Text className="text-[9px] font-black text-white">
                    {employeeUnreadCount > 99 ? "99+" : employeeUnreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openDropdown}
            accessibilityLabel="Open profile menu"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-800 shadow-sm overflow-hidden"
          >
            <Text className="text-base font-bold text-white">
              {avatarLetter}
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* ─── FULL-SCREEN SIDEBAR MODAL ─── */}
      <Modal
        transparent
        visible={sidebarVisible}
        animationType="none"
        onRequestClose={closeSidebar}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            transform: [{ translateX: sidebarSlideAnim }],
            zIndex: 2,
            opacity: sidebarFadeAnim,
          }}
        >
          <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white">
            <View className="px-6 py-6 border-b border-slate-100 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-black text-slate-900 tracking-tight">Q TECHX</Text>
                <Text className="text-xs text-orange-600 font-bold mt-0.5">{isAdmin ? "Admin Workspace" : "Employee Portal"}</Text>
              </View>
              {/* Close Button */}
              <TouchableOpacity onPress={closeSidebar} className="p-2 bg-slate-50 rounded-full">
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="flex-1 py-4 px-2">
              {sidebarItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => {
                    closeSidebar();
                    if (item.route) router.push(item.route as any);
                    else Alert.alert(item.label, `${item.label} coming soon!`);
                  }}
                  className="flex-row items-center px-6 py-5 mx-2 rounded-2xl mb-1 active:bg-slate-50"
                >
                  <Ionicons name={item.icon} size={24} color="#f97316" />
                  <Text className="text-slate-700 font-bold text-lg ml-5">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="px-8 py-8 border-t border-slate-100">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                className="flex-row items-center bg-red-50 p-4 rounded-2xl justify-center"
              >
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                <Text className="text-red-500 font-bold text-base ml-3">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>

      {/* ─── ADMIN NOTIFICATIONS MODAL ─── */}
      <Modal
        transparent
        visible={adminNotificationType !== null}
        animationType="fade"
        onRequestClose={() => setAdminNotificationType(null)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setAdminNotificationType(null)}
        >
          <Pressable
            className="absolute right-4 top-20 w-[335px] max-h-[520px] rounded-3xl bg-white shadow-xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">

              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <Ionicons
                    name={
                      adminNotificationType === "leave"
                        ? "calendar-outline"
                        : "checkmark-circle-outline"
                    }
                    size={21}
                    color="#f97316"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                    {adminNotificationType === "leave"
                      ? "Leave Requests"
                      : "Task Notifications"}
                  </Text>

                  <Text className="mt-0.5 text-[11px] text-slate-500">
                    {adminNotificationType === "leave"
                      ? `${leaveCount} pending request${leaveCount !== 1 ? "s" : ""}`
                      : `${taskCount} active task${taskCount !== 1 ? "s" : ""}`}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  onPress={fetchAdminNotifications}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                  accessibilityLabel="Refresh notifications"
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color="#64748b"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAdminNotificationType(null)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                  accessibilityLabel="Close"
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

            </View>

            {/* Loading */}
            {notificationsLoading ? (
              <View className="items-center justify-center py-12">
                <Ionicons
                  name="refresh-outline"
                  size={28}
                  color="#f97316"
                />

                <Text className="mt-3 text-xs text-slate-500">
                  Loading notifications...
                </Text>
              </View>
            ) : adminNotificationType === "leave" ? (

              /* LEAVE LIST */
              <View>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {leaveNotifications.length > 0 ? (
                    leaveNotifications.map((leave, index) => (
                      <TouchableOpacity
                        key={`${leave.id || index}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          setAdminNotificationType(null);
                          router.push("/admin/leaves" as any);
                        }}
                        className="border-b border-slate-100 px-5 py-3.5 flex-row items-start justify-between"
                      >
                        <View className="flex-row items-start flex-1 mr-2">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 mt-0.5">
                            <Ionicons
                              name="calendar-outline"
                              size={18}
                              color="#f97316"
                            />
                          </View>

                          <View className="ml-3 flex-1">
                            <Text
                              className="text-sm font-bold text-slate-900"
                              numberOfLines={1}
                            >
                              {leave.employee}
                            </Text>

                            <Text className="mt-0.5 text-xs text-slate-500">
                              {leave.type}
                              {leave.date ? ` · ${leave.date}` : ""}
                            </Text>

                            {leave.reason ? (
                              <Text className="mt-1 text-[11px] text-slate-400" numberOfLines={1}>
                                {leave.reason}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View className="self-center rounded-full bg-orange-50 px-2 py-1 border border-orange-200">
                          <Text className="text-[9px] font-bold text-orange-600">
                            {leave.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="items-center justify-center py-10 px-6">
                      <Ionicons
                        name="checkmark-done-circle-outline"
                        size={40}
                        color="#cbd5e1"
                      />

                      <Text className="mt-3 text-sm font-bold text-slate-700">
                        No pending leaves
                      </Text>

                      <Text className="mt-1 text-center text-xs text-slate-400">
                        All leave requests are up to date.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Footer Action */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setAdminNotificationType(null);
                    router.push("/admin/leaves" as any);
                  }}
                  className="mx-4 my-3 items-center justify-center rounded-xl bg-orange-500 py-2.5"
                >
                  <Text className="text-xs font-black text-white">
                    Manage All Leaves →
                  </Text>
                </TouchableOpacity>
              </View>

            ) : (

              /* TASK LIST */
              <View>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {taskNotifications.length > 0 ? (
                    taskNotifications.map((task, index) => (
                      <TouchableOpacity
                        key={`${task.id || index}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          setAdminNotificationType(null);
                          router.push("/admin/tasks" as any);
                        }}
                        className="border-b border-slate-100 px-5 py-3.5 flex-row items-start justify-between"
                      >
                        <View className="flex-row items-start flex-1 mr-2">
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 mt-0.5">
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={18}
                              color="#f97316"
                            />
                          </View>

                          <View className="ml-3 flex-1">
                            <Text
                              className="text-sm font-bold text-slate-900"
                              numberOfLines={1}
                            >
                              {task.title}
                            </Text>

                            {task.project ? (
                              <Text
                                className="mt-0.5 text-xs text-slate-500"
                                numberOfLines={1}
                              >
                                {task.project}
                              </Text>
                            ) : null}

                            {task.assigned ? (
                              <Text
                                className="mt-1 text-[11px] text-slate-400"
                                numberOfLines={1}
                              >
                                Assigned to {task.assigned}
                                {task.assignedId ? ` (${task.assignedId})` : ""}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View className="self-center rounded-full bg-orange-50 px-2 py-1 border border-orange-200">
                          <Text className="text-[9px] font-bold text-orange-600">
                            {task.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="items-center justify-center py-10 px-6">
                      <Ionicons
                        name="checkmark-done-circle-outline"
                        size={40}
                        color="#cbd5e1"
                      />

                      <Text className="mt-3 text-sm font-bold text-slate-700">
                        No active tasks
                      </Text>

                      <Text className="mt-1 text-center text-xs text-slate-400">
                        There are no pending task notifications.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Footer Action */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setAdminNotificationType(null);
                    router.push("/admin/tasks" as any);
                  }}
                  className="mx-4 my-3 items-center justify-center rounded-xl bg-orange-500 py-2.5"
                >
                  <Text className="text-xs font-black text-white">
                    Manage All Tasks →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── EMPLOYEE NOTIFICATIONS MODAL ─── */}
      <Modal
        transparent
        visible={employeeModalVisible}
        animationType="fade"
        onRequestClose={() => setEmployeeModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setEmployeeModalVisible(false)}
        >
          <Pressable
            className="absolute right-4 top-20 w-[335px] max-h-[540px] rounded-3xl bg-white shadow-xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                  <Bell size={20} color="#f97316" strokeWidth={2.2} />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                    Notifications
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-slate-500">
                    {employeeUnreadCount} new update{employeeUnreadCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  onPress={fetchEmployeeAlerts}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                  accessibilityLabel="Refresh notifications"
                >
                  <Ionicons name="refresh" size={16} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setEmployeeModalVisible(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Filter Tabs */}
            <View className="flex-row items-center px-4 py-2 bg-slate-50 border-b border-slate-100 gap-1.5">
              {(["All", "Tasks", "Leaves", "Meetings"] as const).map((tab) => {
                const isSelected = employeeFilterTab === tab;
                const count =
                  tab === "All"
                    ? allEmployeeAlerts.length
                    : tab === "Tasks"
                    ? employeeAlerts.tasks.length
                    : tab === "Leaves"
                    ? employeeAlerts.leaves.length
                    : employeeAlerts.meetings.length;

                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setEmployeeFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isSelected
                        ? "bg-orange-500 border-orange-500"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {tab} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Content List */}
            {notificationsLoading ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="refresh-outline" size={28} color="#f97316" />
                <Text className="mt-3 text-xs text-slate-500">
                  Loading notifications...
                </Text>
              </View>
            ) : (
              <View>
                <ScrollView style={{ maxHeight: 310 }} showsVerticalScrollIndicator={false}>
                  {filteredEmployeeAlerts.length > 0 ? (
                    filteredEmployeeAlerts.map((alert, index) => {
                      const isTask = alert.type === "task";
                      const isLeave = alert.type === "leave";
                      const isMeeting = alert.type === "meeting";

                      return (
                        <TouchableOpacity
                          key={`${alert.type}-${alert.id || index}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            setEmployeeModalVisible(false);
                            if (alert.link) router.push(alert.link as any);
                          }}
                          className="border-b border-slate-100 px-5 py-3.5 flex-row items-start justify-between"
                        >
                          <View className="flex-row items-start flex-1 mr-2">
                            <View
                              className={`h-9 w-9 items-center justify-center rounded-xl border mt-0.5 ${
                                isTask
                                  ? "bg-blue-50 border-blue-200"
                                  : isLeave
                                  ? "bg-green-50 border-green-200"
                                  : "bg-pink-50 border-pink-200"
                              }`}
                            >
                              {isTask ? (
                                <CheckSquare size={17} color="#3b82f6" />
                              ) : isLeave ? (
                                <CheckCircle2 size={17} color="#10b981" />
                              ) : (
                                <Video size={17} color="#ec4899" />
                              )}
                            </View>

                            <View className="ml-3 flex-1">
                              <Text
                                className="text-sm font-bold text-slate-900"
                                numberOfLines={1}
                              >
                                {alert.title}
                              </Text>

                              <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={2}>
                                {alert.sub}
                              </Text>
                            </View>
                          </View>

                          {alert.time ? (
                            <Text className="text-[10px] text-slate-400 mt-1">
                              {alert.time}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View className="items-center justify-center py-12 px-6">
                      <Ionicons
                        name="checkmark-done-circle-outline"
                        size={40}
                        color="#cbd5e1"
                      />
                      <Text className="mt-3 text-sm font-bold text-slate-700">
                        No notifications
                      </Text>
                      <Text className="mt-1 text-center text-xs text-slate-400">
                        You are all caught up for {employeeFilterTab.toLowerCase()}!
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Employee Quick Actions Footer */}
                <View className="flex-row items-center justify-between p-3 border-t border-slate-100 bg-slate-50">
                  <TouchableOpacity
                    onPress={() => {
                      setEmployeeModalVisible(false);
                      router.push("/employee/tasks" as any);
                    }}
                    className="flex-1 items-center py-1.5 mx-1 bg-white rounded-lg border border-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">Tasks</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEmployeeModalVisible(false);
                      router.push("/employee/leave" as any);
                    }}
                    className="flex-1 items-center py-1.5 mx-1 bg-white rounded-lg border border-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">Leave</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setEmployeeModalVisible(false);
                      router.push("/employee/meetings" as any);
                    }}
                    className="flex-1 items-center py-1.5 mx-1 bg-white rounded-lg border border-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">Meetings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── PROFILE DROPDOWN MODAL ─── */}
      <Modal
        transparent
        visible={dropdownVisible}
        animationType="none"
        onRequestClose={closeDropdown}
        statusBarTranslucent
      >
        <Pressable className="flex-1" onPress={closeDropdown}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              position: "absolute",
              top: 90,
              right: 16,
              minWidth: 220,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            {/* User info header */}
            <View className="border-b border-slate-100 px-4 py-4">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                <Text className="text-xl font-bold text-white">{avatarLetter}</Text>
              </View>
              <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                {displayName}
              </Text>
              {userEmail ? (
                <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
                  {userEmail}
                </Text>
              ) : null}
              <View className="mt-2 self-start rounded-full bg-orange-50 px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-orange-600">{userRole}</Text>
              </View>
            </View>

            {/* Menu items */}
            <View className="py-2">
              {dropdownItems.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: index === dropdownItems.length - 1 ? 1 : 0,
                    borderTopColor: index === dropdownItems.length - 1 ? "#f1f5f9" : "transparent",
                    marginTop: index === dropdownItems.length - 1 ? 4 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor:
                        item.color === "#ef4444" ? "#fef2f2" : "#f8fafc",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.color ?? "#475569"}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: item.color ?? "#1e293b",
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}