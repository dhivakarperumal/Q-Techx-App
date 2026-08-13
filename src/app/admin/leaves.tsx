import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";

type Leave = { id: string | number; employee_id?: string | number; user_id?: string | number; first_name?: string; last_name?: string; employee_code?: string; leave_type?: string; from_date?: string; to_date?: string; no_of_days?: number | string; day_type?: string; half_day_type?: string; reason?: string; status?: string; admin_reason?: string };
const statuses = ["All", "Pending", "Approved", "Rejected"];
const dateFilters = ["All", "Today", "Tomorrow", "This Week", "This Month", "This Year"];
const nameOf = (leave: Leave) => `${leave.first_name || ""} ${leave.last_name || ""}`.trim() || leave.employee_code || "Employee";
const dateKey = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : "";
const dateText = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const statusColor = (status?: string) => status === "Approved" ? "#059669" : status === "Rejected" ? "#e11d48" : "#f97316";

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View
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
        className="px-4 py-4"
      >
        <View className="flex-row items-center mb-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={2}>
              {label}
            </Text>
          </View>
        </View>
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[22px] font-black text-black">
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatusPill({ status }: { status?: string }) { return <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${statusColor(status)}18` }}><Text className="text-[10px] font-black uppercase" style={{ color: statusColor(status) }}>{status || "Pending"}</Text></View>; }

function DecisionModal({ leave, action, onClose, onDone }: { leave: Leave | null; action: "Approved" | "Rejected" | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async () => { if (!leave || !action) return; if (action === "Rejected" && !reason.trim()) return Alert.alert("Reason required", "Please provide a reason for rejection."); setSaving(true); try { await api.put(`/employee-leaves/${leave.id}/status`, { status: action, admin_reason: reason }); Alert.alert("Updated", `Leave ${action.toLowerCase()} successfully.`); onDone(); onClose(); } catch (error: any) { Alert.alert("Unable to update leave", error?.message || "Please try again."); } finally { setSaving(false); } };
  return <Modal visible={Boolean(leave && action)} transparent animationType="fade" onRequestClose={onClose}><View className="flex-1 items-center justify-center bg-black/60 px-5"><View className="w-full rounded-3xl bg-white p-5"><View className="flex-row items-center justify-between"><Text className="text-xl font-black text-slate-900">{action === "Approved" ? "Approve Leave" : "Reject Leave"}</Text><Pressable onPress={onClose}><Ionicons name="close-circle" size={25} color="#94a3b8" /></Pressable></View><Text className="mt-3 font-bold text-slate-700">{leave ? nameOf(leave) : ""}</Text><Text className="mt-1 text-sm text-slate-500">{leave?.leave_type} - {dateText(leave?.from_date)} to {dateText(leave?.to_date)}</Text>{action === "Rejected" && <TextInput value={reason} onChangeText={setReason} placeholder="Enter rejection reason..." placeholderTextColor="#94a3b8" multiline className="mt-4 min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900" textAlignVertical="top" />}<Pressable onPress={submit} disabled={saving} className={`mt-5 items-center rounded-xl py-3 ${action === "Approved" ? "bg-emerald-600" : "bg-rose-600"}`}><Text className="font-bold text-white">{saving ? "Processing..." : `Confirm ${action}`}</Text></Pressable></View></View></Modal>;
}

function HistoryModal({ employeeId, employeeName, leaves, onClose }: { employeeId?: string | number; employeeName: string; leaves: Leave[]; onClose: () => void }) {
  const [history, setHistory] = useState<Leave[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!employeeId) return; api.get(`/employee-leaves/employee/${employeeId}`).then((response) => setHistory(response.data?.data?.leaves || [])).catch(() => setHistory(leaves.filter((item) => String(item.employee_id || item.user_id) === String(employeeId)))).finally(() => setLoading(false)); }, [employeeId, leaves]);
  return <Modal visible animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="flex-row items-center justify-between border-b border-slate-200 bg-black px-5 pb-4 pt-5"><View><Text className="text-xl font-black text-orange-500">Leave History</Text><Text className="mt-1 text-xs text-orange-200">{employeeName}</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>{loading ? <ActivityIndicator color="#f97316" /> : history.length ? history.map((leave, index) => <View key={leave.id || index} className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><View className="flex-row items-start justify-between"><View><Text className="font-bold text-slate-800">{leave.leave_type}</Text><Text className="mt-1 text-xs text-slate-500">{dateText(leave.from_date)}{leave.from_date !== leave.to_date ? ` - ${dateText(leave.to_date)}` : ""}</Text></View><StatusPill status={leave.status} /></View><Text className="mt-3 text-sm text-slate-600">{leave.reason || "No reason provided"}</Text><Text className="mt-2 text-xs text-slate-400">{leave.no_of_days || 0} day(s){leave.admin_reason ? ` - ${leave.admin_reason}` : ""}</Text></View>) : <Text className="text-center text-sm text-slate-400">No leave history found.</Text>}</ScrollView></View></Modal>;
}

export default function AdminLeavesScreen() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selected, setSelected] = useState<Leave | null>(null);
  const [decision, setDecision] = useState<"Approved" | "Rejected" | null>(null);
  const [historyLeave, setHistoryLeave] = useState<Leave | null>(null);
  const [bulkSelected, setBulkSelected] = useState<(string | number)[]>([]);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const fetchLeaves = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await api.get("/employee-leaves/all");
      setLeaves(response.data?.data || []);
      setBulkSelected([]);
    } catch (error: any) {
      Alert.alert("Unable to load leaves", error?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filtered = useMemo(() =>
    leaves.filter((leave) => {
      const query = search.toLowerCase().trim();
      const fullName = nameOf(leave).toLowerCase();
      const matchesSearch = !query || fullName.includes(query) || String(leave.employee_code || "").toLowerCase().includes(query);
      const matchesStatus = status === "All" || leave.status === status;

      if (!matchesSearch || !matchesStatus) return false;

      if (dateFilter === "All") return true;

      const from = new Date(leave.from_date || "");
      const to = new Date(leave.to_date || leave.from_date || "");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(now);

      if (dateFilter === "Tomorrow") target.setDate(target.getDate() + 1);

      if (dateFilter === "This Week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return from <= weekEnd && to >= weekStart;
      }

      if (dateFilter === "This Month")
        return from.getMonth() === now.getMonth() && from.getFullYear() === now.getFullYear();

      if (dateFilter === "This Year") return from.getFullYear() === now.getFullYear();

      return dateKey(from.toISOString()) <= dateKey(target.toISOString()) && dateKey(to.toISOString()) >= dateKey(target.toISOString());
    }),
    [leaves, search, status, dateFilter]
  );

  const pending = leaves.filter((leave) => leave.status === "Pending");
  const approved = leaves.filter((leave) => leave.status === "Approved");
  const rejected = leaves.filter((leave) => leave.status === "Rejected");

  const toggleBulk = (id: string | number) =>
    setBulkSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const submitBulk = async (action: "Approved" | "Rejected") => {
    if (!bulkSelected.length) return Alert.alert("Select requests", "Please select at least one pending request.");
    if (action === "Rejected" && !bulkReason.trim()) return Alert.alert("Reason required", "Please provide a rejection reason.");

    setBulkSaving(true);
    try {
      await Promise.all(
        bulkSelected.map((id) =>
          api.put(`/employee-leaves/${id}/status`, { status: action, admin_reason: bulkReason })
        )
      );
      Alert.alert("Updated", `${bulkSelected.length} leave(s) processed.`);
      setBulkModal(false);
      setBulkReason("");
      fetchLeaves(true);
    } catch (error: any) {
      Alert.alert("Bulk update failed", error?.message || "Please try again.");
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#f1f5f9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Leave Management</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLeaves(true)} tintColor="#f97316" />}
      >
        {/* ── STATS SECTION ── */}
        <View className="px-0 mb-6 flex-row flex-wrap justify-between">
          <StatCard label="Total Leaves" value={leaves.length} color="#f97316" icon="document-text-outline" />
          <StatCard label="Approved" value={approved.length} color="#059669" icon="checkmark-circle-outline" />
          <StatCard label="Rejected" value={rejected.length} color="#e11d48" icon="close-circle-outline" />
          <StatCard label="Pending" value={pending.length} color="#f97316" icon="time-outline" />
        </View>

        {/* ── SEARCH & FILTER ── */}
        <View className="px-0 mb-6">
          {/* Search */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search by employee or ID..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
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
                  setDateDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700">
                  {status}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setDateDropdownOpen(true);
                  setStatusDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700">
                  {dateFilter}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Status Dropdown Modal */}
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
              {statuses.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setStatus(item);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${status === item ? "font-bold text-orange-500" : "text-slate-700"}`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Date Dropdown Modal */}
        <Modal
          visible={dateDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDateDropdownOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setDateDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Date Range
              </Text>
              {dateFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => {
                    setDateFilter(filter);
                    setDateDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${dateFilter === filter ? "font-bold text-orange-500" : "text-slate-700"}`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── LIST HEADER ── */}
        <View className="px-0 mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Leave Requests ({filtered.length})
          </Text>
        </View>

        {/* ── LEAVE LIST ── */}
        <View className="px-0">
          {loading ? (
            <Text className="text-center text-slate-500 mt-4">Loading leaves...</Text>
          ) : filtered.length === 0 ? (
            <Text className="text-center text-slate-500 mt-4">No leave requests found.</Text>
          ) : (
            filtered.map((leave, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setHistoryLeave(leave)}
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-slate-900 font-bold text-[15px]">
                        {nameOf(leave)}
                      </Text>
                      <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor(leave.status)}18` }}>
                        <Text className="text-[9px] font-bold" style={{ color: statusColor(leave.status) }}>
                          {leave.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-xs ml-1">
                        {dateText(leave.from_date)} - {dateText(leave.to_date)}
                      </Text>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="document-outline" size={12} color="#94a3b8" />
                      <Text className="text-slate-500 text-xs ml-1">
                        {leave.leave_type} • {leave.no_of_days} day(s)
                      </Text>
                    </View>

                    {leave.reason && (
                      <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
                        {leave.reason}
                      </Text>
                    )}
                  </View>

                  <View className="ml-3 justify-between h-[80px]">
                    <TouchableOpacity
                      onPress={() => {
                        setSelected(leave);
                        setDecision("Approved");
                      }}
                      className="bg-emerald-600 rounded-lg px-3 py-2"
                    >
                      <Text className="text-white text-[10px] font-bold">Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelected(leave);
                        setDecision("Rejected");
                      }}
                      className="bg-rose-600 rounded-lg px-3 py-2"
                    >
                      <Text className="text-white text-[10px] font-bold">Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <DecisionModal leave={selected} action={decision} onClose={() => { setSelected(null); setDecision(null); }} onDone={() => fetchLeaves(true)} />
      {historyLeave && <HistoryModal employeeId={historyLeave.employee_id} employeeName={nameOf(historyLeave)} leaves={leaves} onClose={() => setHistoryLeave(null)} />}

      {/* Bulk Action Modal */}
      <Modal visible={bulkModal} transparent animationType="fade" onRequestClose={() => setBulkModal(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full rounded-3xl bg-white p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-black text-slate-900">Bulk Process</Text>
              <Pressable onPress={() => setBulkModal(false)}>
                <Ionicons name="close-circle" size={25} color="#94a3b8" />
              </Pressable>
            </View>

            <Text className="text-sm text-slate-600 mb-4">Enter a reason for rejection (if applicable):</Text>

            <TextInput
              value={bulkReason}
              onChangeText={setBulkReason}
              placeholder="Rejection reason..."
              placeholderTextColor="#94a3b8"
              multiline
              className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 mb-4"
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => submitBulk("Approved")}
                disabled={bulkSaving}
                className="flex-1 items-center rounded-xl bg-emerald-600 py-3"
              >
                <Text className="font-bold text-white">{bulkSaving ? "Processing..." : "Approve All"}</Text>
              </Pressable>
              <Pressable
                onPress={() => submitBulk("Rejected")}
                disabled={bulkSaving}
                className="flex-1 items-center rounded-xl bg-rose-600 py-3"
              >
                <Text className="font-bold text-white">{bulkSaving ? "Processing..." : "Reject All"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Bar */}
      <AdminBottomBar />
    </View>
  );
}
