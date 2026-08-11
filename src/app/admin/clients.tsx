import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
  const [formVisible, setFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"All Clients" | "Follow-Up / Pending">(
    "All Clients"
  );

  const loadClients = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const query = new URLSearchParams({ page: "1", limit: "100" });
        if (search) query.set("search", search);
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
    [search]
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
          <View className="flex-1 rounded-3xl bg-white p-5 shadow-sm min-h-[100px] justify-center">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-slate-400">TOTAL</Text>
                <Text className="mt-1 text-3xl font-black text-slate-900">{clients.length}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="people" size={22} color="#64748b" />
              </View>
            </View>
          </View>
          <View className="flex-1 rounded-3xl bg-white p-5 shadow-sm min-h-[100px] justify-center">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-slate-400">ACTIVE</Text>
                <Text className="mt-1 text-3xl font-black text-emerald-600">{activeCount}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-3xl bg-white p-5 shadow-sm min-h-[100px] justify-center">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-slate-400">INACTIVE</Text>
                <Text className="mt-1 text-3xl font-black text-rose-600">{inactiveCount}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-rose-100">
                <Ionicons name="close-circle" size={24} color="#e11d48" />
              </View>
            </View>
          </View>
          <View className="flex-1 rounded-3xl bg-white p-5 shadow-sm min-h-[100px] justify-center">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-slate-400">PENDING</Text>
                <Text className="mt-1 text-3xl font-black text-amber-500">{pendingCount}</Text>
              </View>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name="time" size={24} color="#f59e0b" />
              </View>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View className="mt-6 flex-row rounded-xl bg-slate-200 p-1">
          <Pressable
            onPress={() => setActiveTab("All Clients")}
            className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === "All Clients" ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`text-sm font-bold ${activeTab === "All Clients" ? "text-slate-900" : "text-slate-500"}`}>
              All Clients ({clients.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("Follow-Up / Pending")}
            className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === "Follow-Up / Pending" ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`text-sm font-bold ${activeTab === "Follow-Up / Pending" ? "text-slate-900" : "text-slate-500"}`}>
              Pending ({pendingCount})
            </Text>
          </Pressable>
        </View>

        {/* ── Search ── */}
        <View className="mt-5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search clients..."
            placeholderTextColor="#94a3b8"
            className="flex-1 px-2 py-3 text-sm text-slate-900"
          />
        </View>

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
                className="mb-3 flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: avatarColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
                    {initials}
                  </Text>
                </View>

                {/* Info */}
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-slate-900">
                    {client.client_name || "Unnamed client"}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {client.company_name || client.service_type || "No company details"}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-slate-400">
                    Added {dateLabel(client.created_at)}
                    {client.follow_up_status ? ` · ${client.follow_up_status}` : ""}
                  </Text>
                </View>

                {/* Status badge + chevron */}
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: statusBg[client.client_status] || "#f1f5f9",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: statusColor[client.client_status] || "#64748b",
                      }}
                    >
                      {client.client_status || "-"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
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
