import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import {
  AlignLeft,
  CalendarDays,
  CheckCircle2,
  X,
  RefreshCw,
  CheckCircle,
} from "lucide-react-native";
import { useRef, useState, useEffect, useCallback } from "react";
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

  const [leaveNotifications, setLeaveNotifications] = useState<
    LeaveNotification[]
  >([]);

  const [taskNotifications, setTaskNotifications] = useState<
    TaskNotification[]
  >([]);

  const [notificationType, setNotificationType] = useState<
    "leave" | "task" | null
  >(null);

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
    (user?.role as string)?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Admin";

  const rawRole = String(user?.role || user?.user_role || user?.role_name || "").toLowerCase().trim();
  const inAdminGroup = segments.length > 0 && segments[0] === "admin";

  const isAdmin =
    inAdminGroup ||
    rawRole === "admin" ||
    rawRole === "administrator" ||
    rawRole.includes("admin") ||
    Boolean(user?.is_admin || user?.isAdmin || (user?.role_id && Number(user.role_id) === 1));

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setNotificationsLoading(true);

      // -----------------------------------------
      // 1. FETCH PENDING LEAVE REQUESTS
      // -----------------------------------------
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
          "[TopHeader] Leave notification API error:",
          error?.status || error?.response?.status,
          error?.message
        );
      }

      // -----------------------------------------
      // 2. FETCH ACTIVE / PENDING TASK NOTIFICATIONS
      // -----------------------------------------
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
          "[TopHeader] Task notification API error:",
          error?.status || error?.response?.status,
          error?.message
        );
      }
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLeaveNotifications([]);
      setTaskNotifications([]);
      return;
    }

    fetchNotifications();

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchNotifications]);

  const leaveCount = leaveNotifications.length;
  const taskCount = taskNotifications.length;

  const totalNotificationCount = leaveCount + taskCount;

  const openNotifications = (type: "leave" | "task") => {
    setNotificationType(type);
  };

  const closeNotifications = () => {
    setNotificationType(null);
  };

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
        setTimeout(() => router.push("/admin/profile" as any), 150);
      },
    },
    // {
    //   icon: "settings-outline" as const,
    //   label: "Settings",
    //   onPress: () => {
    //     closeDropdown();
    //     Alert.alert("Settings", "Settings page coming soon.");
    //   },
    // },
    {
      icon: "log-out-outline" as const,
      label: "Log Out",
      color: "#ef4444",
      onPress: handleLogout,
    },
  ];

  const sidebarItems = [
    { label: "Dashboard", icon: "home-outline" as const, route: "/admin" },
    { label: "Projects", icon: "folder-outline" as const, route: "/admin/projects" },
    { label: "Tasks", icon: "checkmark-outline" as const, route: "/admin/tasks" },
    { label: "Team", icon: "people-outline" as const, route: "/admin/team" },
    { label: "Settings", icon: "settings-outline" as const, route: null },
  ];

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

        {/* Right — Admin Notifications + Avatar */}
        <View className="flex-row items-center gap-2.5">

          {isAdmin && (
            <>
              {/* LEAVE NOTIFICATIONS */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openNotifications("leave")}
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

              {/* TASK NOTIFICATIONS */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openNotifications("task")}
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

      {/* ─── FULL-SCREEN MENU MODAL ─── */}
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
              <Text className="text-xl font-black text-slate-900 tracking-tight">Q TECHX</Text>
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
        visible={notificationType !== null}
        animationType="fade"
        onRequestClose={closeNotifications}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={closeNotifications}
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
                      notificationType === "leave"
                        ? "calendar-outline"
                        : "checkmark-circle-outline"
                    }
                    size={21}
                    color="#f97316"
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                    {notificationType === "leave"
                      ? "Leave Requests"
                      : "Task Notifications"}
                  </Text>

                  <Text className="mt-0.5 text-[11px] text-slate-500">
                    {notificationType === "leave"
                      ? `${leaveCount} pending request${leaveCount !== 1 ? "s" : ""}`
                      : `${taskCount} active task${taskCount !== 1 ? "s" : ""}`}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  onPress={fetchNotifications}
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
                  onPress={closeNotifications}
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
            ) : notificationType === "leave" ? (

              /* LEAVE LIST */
              <View>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {leaveNotifications.length > 0 ? (
                    leaveNotifications.map((leave, index) => (
                      <TouchableOpacity
                        key={`${leave.id || index}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          closeNotifications();
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
                    closeNotifications();
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
                          closeNotifications();
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
                    closeNotifications();
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