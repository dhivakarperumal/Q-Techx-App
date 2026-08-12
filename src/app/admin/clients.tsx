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
        {/* ── Stat Cards ── */}
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 overflow-hidden rounded-3xl bg-white border-t-4 border-orange-500 shadow-sm">
            <View className="px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Total Clients</Text>
                  <Text className="mt-2 text-3xl font-black text-slate-900">{clients.length}</Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons name="people" size={22} color="#64748b" />
                </View>
              </View>
            </View>
          </View>
          <View className="flex-1 overflow-hidden rounded-3xl bg-white border-t-4 border-emerald-500 shadow-sm">
            <View className="px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Active</Text>
                  <Text className="mt-2 text-3xl font-black text-emerald-600">{activeCount}</Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 overflow-hidden rounded-3xl bg-white border-t-4 border-rose-500 shadow-sm">
            <View className="px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Inactive</Text>
                  <Text className="mt-2 text-3xl font-black text-rose-600">{inactiveCount}</Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
                  <Ionicons name="close-circle" size={24} color="#e11d48" />
                </View>
              </View>
            </View>
          </View>
          <View className="flex-1 overflow-hidden rounded-3xl bg-white border-t-4 border-amber-500 shadow-sm">
            <View className="px-5 py-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">Pending</Text>
                  <Text className="mt-2 text-3xl font-black text-amber-500">{pendingCount}</Text>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                  <Ionicons name="time" size={24} color="#f59e0b" />
                </View>
              </View>
            </View>
          </View>
        </View>

        

        {/* ── Search ── */}
        <View className="mt-5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
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
        <View className="mt-4 flex-row gap-3">
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

        {/* ── Client List ── */}
        <Text className="mb-3 mt-6 text-lg font-black text-slate-900">
          Client Directory
        </Text>

        {loading ? (
          <View className="items-center py-12">
            <Text className="text-sm text-slate-500">Loading clients...</Text>
          </View>
        ) : displayedClients.length ? (
          displayedClients.map((client, index) => {
            const initials = (client.client_name || "?")
              .split(" ")
              .map((w: string) => w[0] ?? "")
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const avatarColor = getAvatarColor(client.client_name || "");
            return (
              <Pressable
                key={client.uuid || index}
                onPress={() =>
                  router.push(`/admin/client-detail/${client.uuid}`)
                }
                className="mb-3 flex-row items-start rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm"
              >
                <View className="mr-4">
                  <View className="h-14 w-14 rounded-3xl items-center justify-center" style={{ backgroundColor: avatarColor }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
                      {initials}
                    </Text>
                  </View>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-bold text-slate-900">
                        {client.client_name || "Unnamed client"}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        {client.company_name || client.service_type || "No company details"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="rounded-full border px-3 py-1" style={{ backgroundColor: statusBg[client.client_status] || "#f1f5f9" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor[client.client_status] || "#64748b" }}>
                          {client.client_status || "-"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginTop: 10 }} />
                    </View>
                  </View>
                  <View className="mt-3">
                    <Text className="text-[11px] text-slate-500">
                      Added {dateLabel(client.created_at)}
                    </Text>
                    {client.follow_up_status ? (
                      <Text className="mt-1 text-[11px] font-bold text-slate-700">
                        {client.follow_up_status}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View className="items-center rounded-3xl bg-white p-8">
            <Ionicons name="people-outline" size={36} color="#cbd5e1" />
            <Text className="mt-3 font-bold text-slate-500">No clients found</Text>
          </View>
        )}
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
