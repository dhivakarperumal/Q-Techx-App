import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";

import api, { API_BASE_URL } from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";


export default function TeamScreen() {
  const router = useRouter();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [roleFilter, setRoleFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);


  const fetchTeam = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data } = await api.get("/employees");

      const usersArray = Array.isArray(data)
        ? data
        : data?.data || data?.users || [];

      const mappedTeam = usersArray.map((emp: any) => {
        const baseUrl = API_BASE_URL.replace(/\/api$/, "");

        const avatarUrl = emp.profile_photo
          ? emp.profile_photo.startsWith("http")
            ? emp.profile_photo
            : `${baseUrl}${emp.profile_photo}`
          : null;

        return {
          id:
            emp.employee_id ||
            emp.employeeId ||
            emp.id ||
            emp.uuid ||
            emp._id ||
            emp.employee_code ||
            emp.employeeCode,

          name:
            `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
            "Unknown",

          role: emp.role || "Employee",
          roleColor: "text-orange-500",
          roleBg: "bg-orange-50",

          team:
            emp.department ||
            emp.team ||
            emp.employee_code ||
            "General",

          email: emp.email || "N/A",
          phone: emp.phone || emp.mobile || "N/A",

          status: emp.employment_status || emp.status || "Active",

          statusColor:
            (emp.employment_status || emp.status) === "Inactive"
              ? "text-red-600"
              : "text-green-600",

          statusBg:
            (emp.employment_status || emp.status) === "Inactive"
              ? "bg-red-100"
              : "bg-green-100",

          avatar: avatarUrl,

          onlineDot:
            (emp.employment_status || emp.status) === "Inactive"
              ? "bg-slate-300"
              : "bg-orange-500",
        };
      });

      setTeam(mappedTeam);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);


  // Calculate stats dynamically based on the fetched team data
  const total = team.length;
  const activeCount = team.filter((m) => m.status === "Active").length;
  const inactiveCount = team.filter((m) => m.status === "Inactive").length;

  const getPercent = (count: number) =>
    total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0%";

  const dynamicStats = [
    {
      label: "Total Members",
      value: String(total),
      sub: "All Members",
      icon: "people",
      color: "#f97316",
      bg: "#fff7ed",
      subColor: "text-orange-500",
    },
    {
      label: "Active",
      value: String(activeCount),
      sub: getPercent(activeCount),
      icon: "person-add",
      color: "#f97316",
      bg: "#fff7ed",
      subColor: "text-green-500",
    },
    {
      label: "Roles",
      value: String(new Set(team.map((m) => m.role).filter(Boolean)).size),
      sub: "All Roles",
      icon: "briefcase",
      color: "#f97316",
      bg: "#fff7ed",
      subColor: "text-violet-500",
    },
    {
      label: "Inactive",
      value: String(inactiveCount),
      sub: getPercent(inactiveCount),
      icon: "person-remove",
      color: "#f97316",
      bg: "#fff7ed",
      subColor: "text-red-500",
    },
  ];

  const filteredTeam = team.filter((member) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search);

    const matchesStatus =
      !statusFilter || member.status === statusFilter;

    const matchesRole =
      !roleFilter || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <View className="flex-1 bg-white">
      <TopHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTeam(true)}
            colors={["#f97316"]}
            tintColor="#f97316"
          />
        }
      >
        {/* ── STATS SECTION ── */}
        <View className="px-5 mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View
              key={idx}
              className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white border border-orange-100"
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons name={stat.icon as any} size={20} color="#f97316" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={2}>
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text className={`text-[10px] font-bold ${stat.subColor || "text-gray-400"}`}>
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── SEARCH & FILTER ── */}
        <View className="px-5 mb-6">

          {/* Search */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />

            <TextInput
              placeholder="Search team members..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
          </View>

          {/* Dropdown Filters */}
          <View className="flex-row gap-3">

            {/* Status */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setStatusDropdownOpen(true);
                  setRoleDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700">
                  {statusFilter || "All Status"}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Role */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setRoleDropdownOpen(true);
                  setStatusDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700">
                  {roleFilter || "All Roles"}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

          </View>
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

              {[
                "",
                "Active",
                "Inactive",
                "Terminated",
                "Resigned",
              ].map((status) => (
                <TouchableOpacity
                  key={status || "all"}
                  onPress={() => {
                    setStatusFilter(status);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${statusFilter === status
                      ? "font-bold text-orange-500"
                      : "text-slate-700"
                      }`}
                  >
                    {status || "All Status"}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={roleDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRoleDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setRoleDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Role
              </Text>

              {[
                "",
                "Employee",
                "Manager",
                "HR",
                "Admin",
              ].map((role) => (
                <TouchableOpacity
                  key={role || "all"}
                  onPress={() => {
                    setRoleFilter(role);
                    setRoleDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${roleFilter === role
                      ? "font-bold text-orange-500"
                      : "text-slate-700"
                      }`}
                  >
                    {role || "All Roles"}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── LIST HEADER ── */}
        <View className="px-5 mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Team Members ({filteredTeam.length})
          </Text>
        </View>

        {/* ── TEAM LIST ── */}
        <View className="px-5">
          {loading ? (
            <Text className="text-center text-slate-500 mt-4">
              Loading team...
            </Text>
          ) : filteredTeam.length === 0 ? (
            <Text className="text-center text-slate-500 mt-4">
              No team members found.
            </Text>
          ) : (
            filteredTeam.map((member, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() =>
                  router.push(`/admin/team-detail/${member.id}` as any)
                }
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm flex-row items-start justify-between"
              >
                {/* Left Side: Avatar and Info */}
                <View className="flex-row flex-1">
                  {/* Avatar with Status Dot */}
                  <View className="mr-4 relative">
                    {member.avatar ? (
                      <Image
                        source={{ uri: member.avatar }}
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 items-center justify-center">
                        <Ionicons
                          name="person"
                          size={28}
                          color="#f97316"
                        />
                      </View>
                    )}
                  </View>

                  {/* Info Block */}
                  <View className="flex-1 justify-center">
                    <View className="flex-row items-center mb-1.5">
                      <Text className="text-slate-900 font-bold text-[15px] mr-2">
                        {member.name}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${member.roleBg}`}
                      >
                        <Text
                          className={`text-[9px] font-bold ${member.roleColor}`}
                        >
                          {member.role}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-1.5">
                      <Ionicons
                        name="briefcase-outline"
                        size={12}
                        color="#94a3b8"
                      />
                      <Text className="text-slate-500 text-xs ml-1">
                        {member.team}
                      </Text>
                    </View>

                    <View className="flex-row items-center flex-wrap">
                      <View className="flex-row items-center mr-3 mb-1">
                        <Ionicons
                          name="mail-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-[10px] ml-1">
                          {member.email}
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-[10px] ml-1">
                          {member.phone}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Side: Status Badge & Menu */}
                <View className="justify-between items-end h-[60px]">
                  <View className={`px-2 py-1 rounded-md ${member.statusBg}`}>
                    <Text
                      className={`text-[9px] font-bold ${member.statusColor}`}
                    >
                      {member.status}
                    </Text>
                  </View>
                  <TouchableOpacity className="mt-auto">
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}
