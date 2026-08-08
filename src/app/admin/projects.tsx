import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { FAB } from "../../components/FAB";
import { TopHeader } from "../../components/TopHeader";

const stats = [
  {
    label: "Total Projects",
    value: "86",
    sub: "All Projects",
    icon: "folder",
    color: "#f97316",
    bg: "bg-orange-50",
  },
  {
    label: "In Progress",
    value: "42",
    sub: "48.8%",
    icon: "briefcase",
    color: "#3b82f6",
    bg: "bg-blue-50",
  },
  {
    label: "Completed",
    value: "28",
    sub: "32.6%",
    icon: "checkmark-circle",
    color: "#10b981",
    bg: "bg-green-50",
  },
  {
    label: "On Hold",
    value: "16",
    sub: "18.6%",
    icon: "pause-circle",
    color: "#a855f7",
    bg: "bg-purple-50",
  },
];

const filters = [
  { label: "All Projects", active: true, dot: "#f97316" },
  { label: "In Progress", active: false, dot: "#3b82f6" },
  { label: "Completed", active: false, dot: "#10b981" },
  { label: "On Hold", active: false, dot: "#a855f7" },
];

const projects = [
  {
    title: "Website Redesign",
    company: "TechCorp Solutions",
    date: "May 20, 2024 – Aug 20, 2024",
    status: "In Progress",
    progress: 65,
    icon: "desktop-outline",
    iconColor: "#f97316",
    iconBg: "bg-orange-50",
    progressColor: "#10b981",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
  },
  {
    title: "E-Commerce Platform",
    company: "ShopEase Inc.",
    date: "Apr 10, 2024 – Jul 10, 2024",
    status: "In Progress",
    progress: 40,
    icon: "cart-outline",
    iconColor: "#3b82f6",
    iconBg: "bg-blue-50",
    progressColor: "#3b82f6",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
  },
  {
    title: "Mobile App Development",
    company: "HealthPlus",
    date: "Mar 15, 2024 – Jun 15, 2024",
    status: "On Hold",
    progress: 25,
    icon: "phone-portrait-outline",
    iconColor: "#10b981",
    iconBg: "bg-green-50",
    progressColor: "#a855f7",
    statusColor: "text-purple-600",
    statusBg: "bg-purple-100",
  },
  {
    title: "Digital Marketing Campaign",
    company: "BrandBoost",
    date: "Feb 01, 2024 – Apr 30, 2024",
    status: "Completed",
    progress: 100,
    icon: "megaphone-outline",
    iconColor: "#eab308",
    iconBg: "bg-yellow-50",
    progressColor: "#10b981",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
  },
  {
    title: "Admin Dashboard",
    company: "Internal Project",
    date: "Jan 10, 2024 – Mar 10, 2024",
    status: "Completed",
    progress: 100,
    icon: "grid-outline",
    iconColor: "#ef4444",
    iconBg: "bg-red-50",
    progressColor: "#10b981",
    statusColor: "text-green-600",
    statusBg: "bg-green-100",
  },
];

export default function ProjectsScreen() {
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <TopHeader />

      <ScrollView className="flex-1" contentContainerClassName="pb-32 pt-2">
        {/* ── STATS SCROLLVIEW ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 mb-6"
          className="overflow-visible"
        >
          {stats.map((stat, idx) => (
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

        {/* ── SEARCH & FILTER ── */}
        <View className="px-5 mb-4 flex-row items-center gap-3">
          <View className="flex-1 bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
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

        {/* ── FILTER PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 mb-6"
        >
          {filters.map((filter, idx) => (
            <TouchableOpacity
              key={idx}
              className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
                filter.active
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              {filter.active ? (
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
                className={`text-xs font-bold ${filter.active ? "text-orange-600 ml-1.5" : "text-slate-600"}`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── PROJECT LIST ── */}
        <View className="px-5">
          {projects.map((project, idx) => (
            <View
              key={idx}
              className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm"
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
                  </View>
                </View>

                <View className="items-end justify-between h-14 py-1">
                  <TouchableOpacity>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                  <View className={`px-2 py-1 rounded-md ${project.statusBg}`}>
                    <Text
                      className={`text-[10px] font-bold ${project.statusColor}`}
                    >
                      {project.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
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
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <AdminBottomBar />

      {/* Floating Action Button */}
      <FAB
        onPress={() =>
          Alert.alert("Create Project", "Project creation is ready to connect.")
        }
      />
    </View>
  );
}
