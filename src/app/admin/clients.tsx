import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import ClientFormModal from "../../components/ClientFormModal";
import { TopHeader } from "../../components/TopHeader";

type Client = Record<string, any>;
const statuses = ["", "Lead", "Prospect", "Active", "Inactive", "Converted", "Closed"];
const followStatuses = ["", "Pending", "Follow Up", "Completed", "Rescheduled", "Cancelled"];
const statusColor: Record<string, string> = { Active: "#16a34a", Lead: "#0284c7", Prospect: "#7c3aed", Inactive: "#dc2626", Converted: "#d97706", Closed: "#64748b" };
const dateLabel = (value?: string) => { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };

function ClientDetail({ client, onClose, onEdit, onDelete, onChanged }: { client: Client; onClose: () => void; onEdit: () => void; onDelete: () => void; onChanged: () => void }) {
  const [history, setHistory] = useState<any[]>(client.history || []);
  const [discussion, setDiscussion] = useState("");
  const [newStatus, setNewStatus] = useState(client.client_status || "Lead");
  const [newFollowStatus, setNewFollowStatus] = useState(client.follow_up_status || "Pending");
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get(`/clients/${client.uuid}`).then((response) => { setHistory(response.data?.data?.history || []); }).catch(() => undefined); }, [client.uuid]);
  const saveHistory = async () => { if (!discussion.trim() && newStatus === client.client_status && newFollowStatus === client.follow_up_status) return Alert.alert("Nothing to save", "Change a status or enter a discussion summary."); setSaving(true); try { await api.post(`/clients/${client.uuid}/history`, { new_status: newStatus, follow_up_status: newFollowStatus, discussion_summary: discussion }); setDiscussion(""); const response = await api.get(`/clients/${client.uuid}`); setHistory(response.data?.data?.history || []); onChanged(); Alert.alert("Saved", "Follow-up history updated."); } catch (error: any) { Alert.alert("Unable to update", error?.message || "Please try again."); } finally { setSaving(false); } };
  return <Modal visible animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 pb-4 pt-5"><View className="flex-1 pr-3"><Text className="text-xl font-black text-slate-900">{client.client_name}</Text><Text className="mt-1 text-xs text-slate-500">{client.company_name || "Client profile"}</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#94a3b8" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><View className="mb-4 flex-row items-center justify-between"><Text className="text-base font-black text-slate-900">Client Details</Text><Text className="font-bold" style={{ color: statusColor[client.client_status] || "#64748b" }}>{client.client_status || "-"}</Text></View>{[["Email", client.email], ["Phone", client.phone_number], ["Contact Person", client.contact_person], ["Business Name", client.business_name], ["Business Type", client.business_type], ["Service Type", client.service_type], ["Requirement", client.requirement], ["Notes / Summary", client.notes_summary], ["Follow-up Date", client.follow_up_date ? `${dateLabel(client.follow_up_date)} ${client.follow_up_time || ""}` : "-"], ["Next Follow-up", client.next_follow_up_date ? `${dateLabel(client.next_follow_up_date)} ${client.next_follow_up_time || ""}` : "-"], ["Follow-up Status", client.follow_up_status], ["Reminder", client.reminder ? "Enabled" : "Disabled"]].map(([label, value]) => value ? <View key={label} className="border-b border-slate-100 py-3"><Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</Text><Text className="mt-1 text-sm text-slate-700">{String(value)}</Text></View> : null)}</View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-4 text-base font-black text-slate-900">Update Status & Log Follow-up</Text><Text className="mb-2 text-xs font-bold text-slate-500">Client Status</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">{statuses.slice(1).map((status) => <Pressable key={status} onPress={() => setNewStatus(status)} className={`mr-2 rounded-full border px-3 py-2 ${newStatus === status ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${newStatus === status ? "text-orange-600" : "text-slate-500"}`}>{status}</Text></Pressable>)}</ScrollView><Text className="mb-2 text-xs font-bold text-slate-500">Follow-up Status</Text><View className="mb-3 flex-row flex-wrap gap-2">{followStatuses.slice(1).map((status) => <Pressable key={status} onPress={() => setNewFollowStatus(status)} className={`rounded-full border px-3 py-2 ${newFollowStatus === status ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${newFollowStatus === status ? "text-orange-600" : "text-slate-500"}`}>{status}</Text></Pressable>)}</View><TextInput value={discussion} onChangeText={setDiscussion} placeholder="What was discussed?" placeholderTextColor="#94a3b8" multiline className="mb-3 min-h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900" textAlignVertical="top" /><Pressable disabled={saving} onPress={saveHistory} className="items-center rounded-xl bg-orange-500 py-3"><Text className="font-bold text-white">{saving ? "Saving..." : "Save Update"}</Text></Pressable></View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-3 text-base font-black text-slate-900">Timeline & History</Text>{history.length ? history.map((item, index) => <View key={item.id || index} className="border-l-2 border-orange-300 pb-4 pl-3"><Text className="font-bold text-slate-800">{item.event_type}</Text><Text className="mt-1 text-xs text-slate-400">{dateLabel(item.created_at)}</Text>{item.discussion_summary ? <Text className="mt-1 text-sm text-slate-600">{item.discussion_summary}</Text> : null}</View>) : <Text className="text-sm text-slate-400">No history available.</Text>}</View><View className="mt-4 flex-row gap-3"><Pressable onPress={onEdit} className="flex-1 items-center rounded-xl border border-orange-500 py-3"><Text className="font-bold text-orange-600">Edit Client</Text></Pressable><Pressable onPress={onDelete} className="flex-1 items-center rounded-xl bg-rose-600 py-3"><Text className="font-bold text-white">Delete Client</Text></Pressable></View></ScrollView></View></Modal>;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 
  const [search, setSearch] = useState(""); 
  const [status, setStatus] = useState(""); 
  const [followStatus, setFollowStatus] = useState(""); 
  const [formVisible, setFormVisible] = useState(false); 
  const [editing, setEditing] = useState<Client | null>(null); 
  const [selected, setSelected] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<"All Clients" | "Follow-Up / Pending">("All Clients");

  const loadClients = useCallback(async (refresh = false) => { 
    if (refresh) setRefreshing(true); else setLoading(true); 
    try { 
      const query = new URLSearchParams({ page: "1", limit: "100" }); 
      if (search) query.set("search", search); 
      if (status) query.set("client_status", status); 
      if (followStatus) query.set("follow_up_status", followStatus); 
      const response = await api.get(`/clients?${query.toString()}`); 
      setClients(response.data?.data || response.data?.clients || []); 
    } catch (error: any) { 
      Alert.alert("Unable to load clients", error?.message || "Please check your connection."); 
    } finally { 
      setLoading(false); setRefreshing(false); 
    } 
  }, [search, status, followStatus]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const removeClient = (client: Client) => Alert.alert("Delete Client", `Delete ${client.client_name}? This cannot be undone.`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await api.delete(`/clients/${client.uuid}`); setSelected(null); loadClients(true); } catch (error: any) { Alert.alert("Delete failed", error?.message || "Please try again."); } } }]);
  const active = clients.filter((client) => client.client_status === "Active").length;

  const displayedClients = clients.filter(client => {
    if (activeTab === "All Clients") return true;
    return client.follow_up_status === "Pending" || client.follow_up_status === "Follow Up";
  });

  return <View className="flex-1 bg-[#f8fafc]"><TopHeader /><ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadClients(true)} tintColor="#f97316" />}><View className="flex-row items-end justify-between"><View><Text className="text-3xl font-black text-slate-900">Clients</Text><Text className="mt-1 text-sm text-slate-500">Manage client relationships, documents, and follow-ups.</Text></View><Pressable onPress={() => { setEditing(null); setFormVisible(true); }} className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-500"><Ionicons name="add" size={25} color="white" /></Pressable></View><View className="mt-5 flex-row gap-3"><View className="flex-1 rounded-2xl bg-white p-4 shadow-sm"><Text className="text-xs font-bold text-slate-400">TOTAL CLIENTS</Text><Text className="mt-1 text-2xl font-black text-slate-900">{clients.length}</Text></View><View className="flex-1 rounded-2xl bg-white p-4 shadow-sm"><Text className="text-xs font-bold text-slate-400">ACTIVE</Text><Text className="mt-1 text-2xl font-black text-emerald-600">{active}</Text></View></View>
  
  <View className="mt-6 flex-row rounded-xl bg-slate-200 p-1">
    <Pressable onPress={() => setActiveTab("All Clients")} className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === "All Clients" ? "bg-white shadow-sm" : "bg-transparent shadow-none"}`}>
      <Text className={`text-sm font-bold ${activeTab === "All Clients" ? "text-slate-900" : "text-slate-500"}`}>All Clients</Text>
    </Pressable>
    <Pressable onPress={() => setActiveTab("Follow-Up / Pending")} className={`flex-1 items-center rounded-lg py-2.5 ${activeTab === "Follow-Up / Pending" ? "bg-white shadow-sm" : "bg-transparent shadow-none"}`}>
      <Text className={`text-sm font-bold ${activeTab === "Follow-Up / Pending" ? "text-slate-900" : "text-slate-500"}`}>Follow-Up / Pending</Text>
    </Pressable>
  </View>

  <View className="mt-5 flex-row items-center rounded-xl border border-slate-200 bg-white px-3"><Ionicons name="search" size={18} color="#94a3b8" /><TextInput value={search} onChangeText={setSearch} placeholder="Search clients..." placeholderTextColor="#94a3b8" className="flex-1 px-2 py-3 text-sm text-slate-900" /></View><Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Client Status</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{statuses.map((item) => <Pressable key={item || "all"} onPress={() => setStatus(item)} className={`mr-2 rounded-full border px-3 py-2 ${status === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-xs font-bold ${status === item ? "text-orange-600" : "text-slate-500"}`}>{item || "All"}</Text></Pressable>)}</ScrollView><Text className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Follow-up Status</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{followStatuses.map((item) => <Pressable key={item || "all"} onPress={() => setFollowStatus(item)} className={`mr-2 rounded-full border px-3 py-2 ${followStatus === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-xs font-bold ${followStatus === item ? "text-orange-600" : "text-slate-500"}`}>{item || "All"}</Text></Pressable>)}</ScrollView><Text className="mb-3 mt-6 text-lg font-black text-slate-900">Client Directory</Text>
  {loading ? <View className="items-center py-12"><Text className="text-sm text-slate-500">Loading clients...</Text></View> : displayedClients.length ? displayedClients.map((client, index) => <Pressable key={client.uuid || index} onPress={() => setSelected(client)} className="mb-3 flex-row items-center rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-50"><Ionicons name="business-outline" size={23} color="#f97316" /></View><View className="ml-3 flex-1"><Text className="text-base font-bold text-slate-900">{client.client_name || "Unnamed client"}</Text><Text className="mt-1 text-xs text-slate-500">{client.company_name || client.service_type || "No company details"}</Text><Text className="mt-1 text-[11px] text-slate-400">Added {dateLabel(client.created_at)}{client.follow_up_status ? ` - ${client.follow_up_status}` : ""}</Text></View><Text className="text-xs font-bold" style={{ color: statusColor[client.client_status] || "#64748b" }}>{client.client_status || "-"}</Text></Pressable>) : <View className="items-center rounded-3xl bg-white p-8"><Ionicons name="people-outline" size={36} color="#cbd5e1" /><Text className="mt-3 font-bold text-slate-500">No clients found</Text></View>}</ScrollView><AdminBottomBar /><ClientFormModal visible={formVisible} client={editing} onClose={() => setFormVisible(false)} onSaved={() => loadClients(true)} />{selected && <ClientDetail client={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setFormVisible(true); }} onDelete={() => removeClient(selected)} onChanged={() => loadClients(true)} />}</View>;
}
