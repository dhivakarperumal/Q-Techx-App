import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import ClientFormModal from "../../components/ClientFormModal";
import { FAB } from "../../components/FAB";
import { TopHeader } from "../../components/TopHeader";
import { LinearGradient } from "expo-linear-gradient";

type Client = Record<string, any>;

const statusColor: Record<string, string> = {
  Active: "#16a34a",
  Lead: "#0284c7",
  Prospect: "#7c3aed",
  Inactive: "#dc2626",
  Converted: "#d97706",
  Closed: "#64748b",
};
const statusBg: Record<string, string> = {
  Active: "#dcfce7",
  Lead: "#dbeafe",
  Prospect: "#ede9fe",
  Inactive: "#fee2e2",
  Converted: "#fef3c7",
  Closed: "#f1f5f9",
};
const avatarPalette = ["#f97316", "#0ea5e9", "#a855f7", "#10b981", "#e11d48", "#f59e0b"];
const getAvatarColor = (name: string) =>
  avatarPalette[(name?.charCodeAt(0) || 0) % avatarPalette.length];

const dateLabel = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
};

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [followUpDropdownOpen, setFollowUpDropdownOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"All Clients" | "Follow-Up / Pending">(
    "All Clients"
  );

  const SERVICE_TYPES = ["Website", "Mobile App", "Web App", "Software", "Other"];
  const FOLLOW_UP_STATUSES = ["Pending", "Follow Up", "Completed", "Rescheduled", "Cancelled"];

  const loadClients = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const query = new URLSearchParams({ page: "1", limit: "100" });
        if (search) query.set("search", search);
        if (serviceFilter) query.set("service_type", serviceFilter);
        if (followUpFilter) query.set("follow_up_status", followUpFilter);
        const response = await api.get(`/clients?${query.toString()}`);
        setClients(response.data?.data || response.data?.clients || []);
      } catch (error: any) {
        Alert.alert(
          "Unable to load clients",
          error?.message || "Please check your connection."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, serviceFilter, followUpFilter]
  );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const displayedClients = clients.filter((client) => {
    if (activeTab === "All Clients") return true;
    return (
      client.follow_up_status !== "Completed" &&
      client.follow_up_status !== "Cancelled"
    );
  });

  const activeCount = clients.filter((c) => c.client_status === "Active").length;
  const inactiveCount = clients.filter((c) => c.client_status === "Inactive").length;
  const leadCount = clients.filter((c) => c.client_status === "Lead").length;
  const pendingCount = clients.filter(
    (c) => c.follow_up_status !== "Completed" && c.follow_up_status !== "Cancelled"
  ).length;

  return (
    <View className="flex-1 bg-[#f8fafc]">
      <TopHeader />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadClients(true)}
            tintColor="#f97316"
          />
        }
      >
        {/* ── CLIENT STATS SECTION ── */}
        <View className="mt-5 mb-2 flex-row flex-wrap justify-between">
          {/* Total Clients */}
          <View className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm border-t-4 border-orange-500">
            <LinearGradient
              colors={["#ffffff", "#fff7ed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 py-4"
            >
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name="people" size={20} color="#f97316" />
                </View>

                <View className="ml-2 flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                    numberOfLines={2}
                  >
                    Total Clients
                  </Text>
                </View>
              </View>

              <View className="flex-row items-baseline justify-between">
                <Text className="text-[22px] font-black text-black">
                  {clients.length}
                </Text>

                <Text className="text-[10px] font-bold text-orange-500">
                  All Clients
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Active Clients */}
          <View className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm border-t-4 border-orange-500">
            <LinearGradient
              colors={["#ffffff", "#fff7ed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 py-4"
            >
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name="person-add" size={20} color="#f97316" />
                </View>

                <View className="ml-2 flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                    numberOfLines={2}
                  >
                    Active
                  </Text>
                </View>
              </View>

              <View className="flex-row items-baseline justify-between">
                <Text className="text-[22px] font-black text-black">
                  {activeCount}
                </Text>

                <Text className="text-[10px] font-bold text-orange-500">
                  Active Clients
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Leads */}
          <View className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm border-t-4 border-orange-500">
            <LinearGradient
              colors={["#ffffff", "#fff7ed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 py-4"
            >
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name="trending-up" size={20} color="#f97316" />
                </View>

                <View className="ml-2 flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                    numberOfLines={2}
                  >
                    Leads
                  </Text>
                </View>
              </View>

              <View className="flex-row items-baseline justify-between">
                <Text className="text-[22px] font-black text-black">
                  {leadCount}
                </Text>

                <Text className="text-[10px] font-bold text-orange-500">
                  Open Leads
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Pending */}
          <View className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white shadow-sm border-t-4 border-orange-500">
            <LinearGradient
              colors={["#ffffff", "#fff7ed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 py-4"
            >
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name="time" size={20} color="#f97316" />
                </View>

                <View className="ml-2 flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                    numberOfLines={2}
                  >
                    Pending
                  </Text>
                </View>
              </View>

              <View className="flex-row items-baseline justify-between">
                <Text className="text-[22px] font-black text-black">
                  {pendingCount}
                </Text>

                <Text className="text-[10px] font-bold text-orange-500">
                  Follow-up Pending
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>


        {/* ── Search ── */}
        <View className="mt-3 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search clients..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-2 py-5 rounded text-sm text-slate-900"
          />
        </View>

        {/* ── Filters ── */}
        <View className="mt-3 flex-row gap-3">
          <Pressable
            onPress={() => {
              setServiceDropdownOpen(true);
              setFollowUpDropdownOpen(false);
            }}
            className="flex-1 h-12 rounded-2xl border border-slate-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-xs font-medium text-slate-700">
              {serviceFilter || "All Services"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>

          <Pressable
            onPress={() => {
              setFollowUpDropdownOpen(true);
              setServiceDropdownOpen(false);
            }}
            className="flex-1 h-12 rounded-2xl border border-slate-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-xs font-medium text-slate-700">
              {followUpFilter || "All Follow-up"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
        </View>

        <Modal
          visible={serviceDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setServiceDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setServiceDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Service Type
              </Text>
              {["", ...SERVICE_TYPES].map((value) => (
                <Pressable
                  key={value || "all"}
                  onPress={() => {
                    setServiceFilter(value);
                    setServiceDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${serviceFilter === value ? "font-bold text-orange-500" : "text-slate-700"}`}>
                    {value || "All Services"}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={followUpDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFollowUpDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setFollowUpDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Follow-up Status
              </Text>
              {["", ...FOLLOW_UP_STATUSES].map((value) => (
                <Pressable
                  key={value || "all"}
                  onPress={() => {
                    setFollowUpFilter(value);
                    setFollowUpDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${followUpFilter === value ? "font-bold text-orange-500" : "text-slate-700"}`}>
                    {value || "All Follow-up"}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── CLIENT LIST ── */}
        <View className="mb-4 mt-6 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Client Directory ({displayedClients.length})
          </Text>
        </View>

        <View className="">
          {loading ? (
            <Text className="text-center text-slate-500 mt-4">
              Loading clients...
            </Text>
          ) : displayedClients.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons
                name="people-outline"
                size={36}
                color="#cbd5e1"
              />
              <Text className="mt-3 font-bold text-slate-500">
                No clients found
              </Text>
            </View>
          ) : (
            displayedClients.map((client, index) => {
              const initials = (client.client_name || "?")
                .split(" ")
                .map((w: string) => w[0] ?? "")
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const avatarColor = getAvatarColor(
                client.client_name || ""
              );

              return (
                <Pressable
                  key={client.uuid || index}
                  onPress={() =>
                    router.push(
                      `/admin/client-detail/${client.uuid}`
                    )
                  }
                  className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm flex-row items-start justify-between"
                >
                  {/* ── LEFT SIDE: AVATAR + INFO ── */}
                  <View className="flex-row flex-1">
                    {/* Avatar */}
                    {/* Avatar / Client Icon */}
                    <View className="mr-4 relative h-14 w-14 rounded-full items-center justify-center bg-orange-50 border border-orange-100">
                      <Ionicons
                        name="person"
                        size={25}
                        color="#f97316"
                      />
                    </View>

                    {/* Info Block */}
                    <View className="flex-1 justify-center">
                      {/* Name + Service */}
                      <View className="flex-row items-center mb-1.5 flex-wrap">
                        <Text
                          className="text-slate-900 font-bold text-[15px] mr-2"
                          numberOfLines={1}
                        >
                          {client.client_name || "Unnamed client"}
                        </Text>

                        {client.service_type ? (
                          <View className="px-2 py-0.5 rounded-full bg-orange-50">
                            <Text className="text-[9px] font-bold text-orange-600">
                              {client.service_type}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Company */}
                      <View className="flex-row items-center mb-1.5">
                        <Ionicons
                          name="business-outline"
                          size={12}
                          color="#94a3b8"
                        />

                        <Text
                          className="text-slate-500 text-xs ml-1"
                          numberOfLines={1}
                        >
                          {client.company_name || "No company details"}
                        </Text>
                      </View>

                      {/* Email + Phone */}
                      {/* <View className="flex-row items-center flex-wrap">
                        {client.email ? (
                          <View className="flex-row items-center mr-3 mb-1">
                            <Ionicons
                              name="mail-outline"
                              size={12}
                              color="#94a3b8"
                            />

                            <Text
                              className="text-slate-500 text-[10px] ml-1"
                              numberOfLines={1}
                            >
                              {client.email}
                            </Text>
                          </View>
                        ) : null}

                        {client.phone_number ? (
                          <View className="flex-row items-center mb-1">
                            <Ionicons
                              name="call-outline"
                              size={12}
                              color="#94a3b8"
                            />

                            <Text
                              className="text-slate-500 text-[10px] ml-1"
                              numberOfLines={1}
                            >
                              {client.phone_number}
                            </Text>
                          </View>
                        ) : null}
                      </View> */}

                      {/* Follow-up Status */}
                      {client.follow_up_status ? (
                        <View className="flex-row items-center mt-1">
                          <View className="px-2 py-0.5 rounded-full bg-slate-100">
                            <Text className="text-[9px] font-bold text-slate-600">
                              {client.follow_up_status}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* ── RIGHT SIDE: STATUS + ARROW ── */}
                  <View className="justify-between items-end h-[60px]">
                    <View
                      className="px-2 py-1 rounded-md"
                      style={{
                        backgroundColor:
                          statusBg[client.client_status] || "#f1f5f9",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          color:
                            statusColor[client.client_status] || "#64748b",
                        }}
                      >
                        {client.client_status || "-"}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#94a3b8"
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <AdminBottomBar />
      <FAB
        onPress={() => setFormVisible(true)}
      />
      <ClientFormModal
        visible={formVisible}
        client={null}
        onClose={() => setFormVisible(false)}
        onSaved={() => {
          setFormVisible(false);
          loadClients(true);
        }}
      />
    </View>
  );
}
