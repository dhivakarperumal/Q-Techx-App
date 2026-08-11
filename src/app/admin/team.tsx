import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api, { API_BASE_URL } from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { TopHeader } from "../../components/TopHeader";

const FILTER_OPTIONS = [
  { label: "All Members", icon: "people" },
  { label: "Development", icon: "code-slash" },
  { label: "Design", icon: "color-palette" },
  { label: "Marketing", icon: "megaphone" },
];

export default function TeamScreen() {
  const router = useRouter();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Members");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get("/employees");

        // Handle both possible response shapes: { data: [...] } or just [...]
        const usersArray = Array.isArray(data)
          ? data
          : data?.data || data?.users || [];

        const mappedTeam = usersArray.map((emp: any) => {
          // Resolve profile photo URL (e.g., /uploads/... -> http://192.168.1.4:5000/uploads/...)
          const baseUrl = API_BASE_URL.replace(/\/api$/, "");
          const avatarUrl = emp.profile_photo
            ? emp.profile_photo.startsWith("http")
              ? emp.profile_photo
              : `${baseUrl}${emp.profile_photo}`
            : "https://i.pravatar.cc/100";

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
            team: emp.department || emp.team || emp.employee_code || "General",
            email: emp.email || "N/A",
            phone: emp.phone || emp.mobile || "N/A",
            status: emp.status || "Active",
            statusColor:
              emp.status === "Inactive" ? "text-red-600" : "text-green-600",
            statusBg:
              emp.status === "Inactive" ? "bg-red-100" : "bg-green-100",
            avatar: avatarUrl,
            onlineDot:
              emp.status === "Inactive" ? "bg-slate-300" : "bg-orange-500",
          };
        });
        setTeam(mappedTeam);
      } catch (error) {
        console.error("Failed to fetch team members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  // Calculate stats dynamically based on the fetched team data
  const total = team.length;
  const activeCount = team.filter((m) => m.status === "Active").length;
  const leaveCount = team.filter(
    (m) => m.status === "On Leave" || m.status === "Leave",
  ).length;
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
      label: "On Leave",
      value: String(leaveCount),
      sub: getPercent(leaveCount),
      icon: "person",
      color: "#f97316",
      bg: "#fff7ed",
      subColor: "text-yellow-500",
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
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "All Members" ||
      member.team.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        {/* ── STATS SECTION ── */}
        <View className="px-5 mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View key={idx} className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm border-t-4 border-orange-500">
              <LinearGradient
                colors={["#ffffff", "#fff7ed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-4 py-4"
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
        <View className="px-5 mb-4 flex-row items-center gap-3">
          <View className="flex-1 bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search team members..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
          </View>
          {/* <TouchableOpacity className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm">
            <Ionicons name="filter" size={16} color="#64748b" />
            <Text className="text-slate-700 font-bold text-sm ml-2 mr-1">
              Filter
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </TouchableOpacity> */}
        </View>

        {/* ── FILTER PILLS ── */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5 flex-row items-center"
          >
            {FILTER_OPTIONS.map((filter, idx) => {
              const isActive = activeFilter === filter.label;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveFilter(filter.label)}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
                    isActive
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={14}
                    color={isActive ? "#f97316" : "#94a3b8"}
                    className="mr-2"
                  />
                  <Text
                    className={`text-xs font-bold ${isActive ? "text-orange-600 ml-1.5" : "text-slate-600 ml-1.5"}`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* More Dropdown Pill */}
            <TouchableOpacity className="flex-row items-center px-4 py-2 rounded-full border border-slate-200 bg-white ml-2">
              <Text className="text-slate-600 text-xs font-bold mr-1.5">
                More
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="px-5 mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Team Members ({filteredTeam.length})
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-slate-500 text-xs font-medium mr-1">
              Sort by: Recent
            </Text>
            <Ionicons name="chevron-down" size={14} color="#94a3b8" />
          </TouchableOpacity>
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
                    <Image
                      source={{ uri: member.avatar }}
                      className="w-14 h-14 rounded-full bg-slate-200"
                    />
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
