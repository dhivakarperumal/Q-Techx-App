import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, RefreshControl, Pressable } from "react-native";
import { DollarSign, X, History, Edit, Trash2, Eye } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api";
import { FAB } from "../FAB";

export default function ProjectPaymentTab() {
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  // Form states
  const [selectedProject, setSelectedProject] = useState("");
  const [projectSummary, setProjectSummary] = useState(null);
  const [fetchingSummary, setFetchingSummary] = useState(false);
  
  const [formData, setFormData] = useState({
    amount_paid: "",
    payment_mode: "Bank Transfer",
    reason_for_payment: "",
    date_of_payment: new Date().toISOString().split("T")[0],
    time_of_payment: new Date().toLocaleTimeString("en-IN", { hour12: false }).substring(0, 5),
  });

  useEffect(() => {
    fetchProjects();
    fetchHistory();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects?limit=1000&page=1");
      if (data.data) {
        setProjects(data.data.rows || data.data);
      } else if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.warn("Failed to load projects");
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/project-payments");
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.warn("Failed to load project payments history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchProjectSummary = async (projectId) => {
    if (!projectId) return;
    setFetchingSummary(true);
    try {
      const { data } = await api.get(`/project-payments/${projectId}/summary`);
      if (data.success) {
        setProjectSummary(data.data);
      }
    } catch (error) {
      console.warn("Failed to load project summary");
      setProjectSummary(null);
    } finally {
      setFetchingSummary(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    if (editId) return; // Disallow changing project in edit mode
    setSelectedProject(projectId);
    fetchProjectSummary(projectId);
  };

  const handleSave = async () => {
    if (!selectedProject) {
      Alert.alert("Error", "Please select a project");
      return;
    }
    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }

    const proj = projects.find(p => p.id === selectedProject || p.uuid === selectedProject);

    setLoading(true);
    try {
      const payload = {
        project_id: selectedProject,
        client_name: proj ? proj.client_name : "",
        amount_paid: parseFloat(formData.amount_paid),
        payment_mode: formData.payment_mode,
        reason_for_payment: formData.reason_for_payment,
        date_of_payment: formData.date_of_payment,
        time_of_payment: formData.time_of_payment,
      };

      let response;
      if (editId) {
        response = await api.put(`/project-payments/${editId}`, payload);
      } else {
        response = await api.post("/project-payments", payload);
      }
      
      if (response.data.success) {
        Alert.alert("Success", `Project payment ${editId ? 'updated' : 'recorded'} successfully`);
        resetForm();
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || `Failed to ${editId ? 'update' : 'record'} payment`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    const id = record.uuid || record.id;
    setEditId(id);
    setSelectedProject(record.project_id);
    setFormData({
      amount_paid: record.amount_paid?.toString() || "",
      payment_mode: record.payment_mode || "Bank Transfer",
      reason_for_payment: record.reason_for_payment || "",
      date_of_payment: record.date_of_payment ? new Date(record.date_of_payment).toISOString().split("T")[0] : "",
      time_of_payment: record.time_of_payment || "",
    });
    setProjectSummary(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this payment record? This will adjust company funds.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const { data } = await api.delete(`/project-payments/${id}`);
          if (data.success) {
            Alert.alert("Deleted", "Project payment deleted successfully");
            fetchHistory();
          }
        } catch (error) {
          Alert.alert("Error", "Failed to delete record");
        }
      }}
    ]);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setSelectedProject("");
    setProjectSummary(null);
    setFormData({
      amount_paid: "",
      payment_mode: "Bank Transfer",
      reason_for_payment: "",
      date_of_payment: new Date().toISOString().split("T")[0],
      time_of_payment: new Date().toLocaleTimeString("en-IN", { hour12: false }).substring(0, 5),
    });
  };

  const filteredHistory = history.filter(record => {
    const matchesSearch = !searchQuery || (
      record.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      record.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const dateStr = record.date_of_payment ? new Date(record.date_of_payment).toISOString().substring(5,7) : "";
    const matchesMonth = !monthFilter || dateStr === monthFilter;
    const matchesProject = !projectFilter || record.project_id === projectFilter || record.project_name === projectFilter;
    return matchesSearch && matchesMonth && matchesProject;
  });

  const totalProjects = projects.length;
  const totalPaid = filteredHistory.reduce((acc, curr) => acc + parseFloat(curr.amount_paid || 0), 0);
  const paidCount = filteredHistory.length;
  const avgPaid = paidCount > 0 ? totalPaid / paidCount : 0;

  const dynamicStats = [
    {
      label: "Total Projects",
      value: String(totalProjects),
      sub: "Active Projects",
      icon: "briefcase",
      subColor: "text-blue-500",
    },
    {
      label: "Total Received",
      value: `₹ ${totalPaid.toFixed(2)}`,
      sub: monthFilter ? `Month: ${monthFilter}` : "All Time",
      icon: "wallet",
      subColor: "text-green-500",
    },
    {
      label: "Transactions",
      value: String(paidCount),
      sub: "Payments",
      icon: "receipt",
      subColor: "text-orange-500",
    },
    {
      label: "Avg Payment",
      value: `₹ ${avgPaid.toFixed(2)}`,
      sub: "Per Tx",
      icon: "pie-chart",
      subColor: "text-violet-500",
    },
  ];

  const MONTHS = [
    { v: "01", l: "January" }, { v: "02", l: "February" }, { v: "03", l: "March" },
    { v: "04", l: "April" }, { v: "05", l: "May" }, { v: "06", l: "June" },
    { v: "07", l: "July" }, { v: "08", l: "August" }, { v: "09", l: "September" },
    { v: "10", l: "October" }, { v: "11", l: "November" }, { v: "12", l: "December" }
  ];

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-[#F9FAFB] p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row flex-wrap justify-between pt-2">
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
                <View className="mt-1 flex-col">
                  <Text className="text-[22px] font-black text-black" numberOfLines={1} adjustsFontSizeToFit>
                    {stat.value}
                  </Text>
                  <Text className={`text-[10px] font-bold mt-0.5 ${stat.subColor || "text-gray-400"}`}>
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── SEARCH & FILTER ── */}
        <View className="mb-6">
          {/* Search */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search history..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm font-medium text-slate-800 h-10"
            />
          </View>

          {/* Dropdown Filters */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setMonthDropdownOpen(true);
                  setProjectDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                  {monthFilter ? `Month: ${MONTHS.find(m => m.v === monthFilter)?.l || monthFilter}` : "All Months"}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setProjectDropdownOpen(true);
                  setMonthDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                  {projectFilter || "All Projects"}
                </Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Modal visible={monthDropdownOpen} transparent animationType="fade" onRequestClose={() => setMonthDropdownOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setMonthDropdownOpen(false)}>
            <Pressable className="bg-white rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">Select Month</Text>
              <ScrollView style={{maxHeight: 400}}>
                <TouchableOpacity
                  onPress={() => { setMonthFilter(""); setMonthDropdownOpen(false); }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${!monthFilter ? "font-bold text-orange-500" : "text-slate-700"}`}>All Months</Text>
                </TouchableOpacity>
                {MONTHS.map((m) => (
                  <TouchableOpacity
                    key={m.v}
                    onPress={() => { setMonthFilter(m.v); setMonthDropdownOpen(false); }}
                    className="px-5 py-4 border-b border-slate-100"
                  >
                    <Text className={`text-sm ${monthFilter === m.v ? "font-bold text-orange-500" : "text-slate-700"}`}>{m.l}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={projectDropdownOpen} transparent animationType="fade" onRequestClose={() => setProjectDropdownOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setProjectDropdownOpen(false)}>
            <Pressable className="bg-white rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">Select Project</Text>
              <ScrollView style={{maxHeight: 400}}>
                <TouchableOpacity
                  onPress={() => { setProjectFilter(""); setProjectDropdownOpen(false); }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${!projectFilter ? "font-bold text-orange-500" : "text-slate-700"}`}>All Projects</Text>
                </TouchableOpacity>
                {projects.map((p) => {
                  const pName = p.project_name || p.project_code;
                  return (
                  <TouchableOpacity
                    key={p.uuid || p.id}
                    onPress={() => { setProjectFilter(pName); setProjectDropdownOpen(false); }}
                    className="px-5 py-4 border-b border-slate-100"
                  >
                    <Text className={`text-sm ${projectFilter === pName ? "font-bold text-orange-500" : "text-slate-700"}`}>{pName}</Text>
                  </TouchableOpacity>
                )})}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

      {/* History List */}
      <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-10">
        <View className="p-4 border-b border-slate-100 bg-slate-50 flex-row items-center gap-2">
          <History size={18} color="#64748b" />
          <Text className="font-semibold text-slate-700">Payment History</Text>
        </View>
        
        {historyLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : filteredHistory.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-slate-400">No payment records found</Text>
          </View>
        ) : (
          <View>
            {filteredHistory.map((record, index) => {
              const id = record.uuid || record.id;
              return (
                <View key={id || index} className="flex-row items-center justify-between p-4 mb-3 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                  <View className="flex-1 mr-3 flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50">
                      <Ionicons name="briefcase" size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900" numberOfLines={1}>{record.project_name || 'Project'}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">{record.client_name || 'N/A'}</Text>
                      <Text className="text-[10px] text-slate-400 mt-1">
                        {new Date(record.date_of_payment).toLocaleDateString()} • {record.payment_mode}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end gap-2">
                    <Text className="font-black text-emerald-600 text-base">₹{parseFloat(record.amount_paid).toFixed(2)}</Text>
                    <View className="flex-row gap-1">
                      <TouchableOpacity onPress={() => setViewRecord(record)} className="bg-slate-100 p-1.5 rounded-md">
                        <Eye size={12} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleEdit(record)} className="bg-blue-50 p-1.5 rounded-md">
                        <Edit size={12} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(id)} className="bg-rose-50 p-1.5 rounded-md">
                        <Trash2 size={12} color="#f43f5e" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Record/Edit Payment Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] shadow-2xl overflow-hidden">
            <View className="bg-black pt-4 px-6 pb-6">
              <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-orange-500 text-lg font-bold">{editId ? 'Edit Payment' : 'Record Payment'}</Text>
                  <Text className="text-white text-xs mt-1">Add a project payment record</Text>
                </View>
                <TouchableOpacity onPress={resetForm} className="bg-orange-100 p-2 rounded-full">
                  <X size={20} color="#f97316" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Select Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  {projects.map(proj => {
                    const pid = proj.uuid || proj.id;
                    return (
                      <TouchableOpacity
                        key={pid}
                        onPress={() => handleProjectSelect(pid)}
                        disabled={editId !== null}
                        className={`mr-2 px-4 py-3 rounded-xl border max-w-[200px] ${selectedProject === pid ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-200'} ${editId && selectedProject !== pid ? 'opacity-50' : ''}`}
                      >
                        <Text className={selectedProject === pid ? 'text-orange-700 font-semibold' : 'text-slate-700'} numberOfLines={1}>
                          {proj.project_name || proj.project_code}
                        </Text>
                        <Text className={`text-[10px] mt-1 ${selectedProject === pid ? 'text-orange-500' : 'text-slate-400'}`} numberOfLines={1}>
                          {proj.client_name || 'N/A'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {fetchingSummary ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : projectSummary ? (
                <View className="flex-row gap-4 mb-2">
                  <View className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <Text className="text-[10px] text-emerald-600 font-semibold uppercase mb-1">Paid So Far</Text>
                    <Text className="font-bold text-emerald-700">₹{parseFloat(projectSummary.total_paid || 0).toFixed(2)}</Text>
                  </View>
                  <View className="flex-1 bg-orange-50 border border-orange-100 p-3 rounded-xl">
                    <Text className="text-[10px] text-orange-600 font-semibold uppercase mb-1">Balance</Text>
                    <Text className="font-bold text-orange-700">₹{parseFloat(projectSummary.balance || 0).toFixed(2)}</Text>
                  </View>
                </View>
              ) : null}

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Amount Paid (₹)</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  value={formData.amount_paid}
                  onChangeText={(val) => setFormData({ ...formData, amount_paid: val })}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Payment Mode</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['Bank Transfer', 'UPI', 'Cash', 'Cheque'].map(mode => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setFormData({ ...formData, payment_mode: mode })}
                      className={`px-4 py-2 rounded-lg border ${formData.payment_mode === mode ? 'bg-orange-100 border-orange-300' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={formData.payment_mode === mode ? 'text-orange-700 font-semibold text-sm' : 'text-slate-600 text-sm'}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Reason for Payment</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  value={formData.reason_for_payment}
                  onChangeText={(val) => setFormData({ ...formData, reason_for_payment: val })}
                  placeholder="e.g. Milestone 1"
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Date</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                    value={formData.date_of_payment}
                    onChangeText={(val) => setFormData({ ...formData, date_of_payment: val })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Time</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                    value={formData.time_of_payment}
                    onChangeText={(val) => setFormData({ ...formData, time_of_payment: val })}
                    placeholder="HH:MM"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                className="bg-[#f97316] py-3.5 rounded-xl items-center mt-6 shadow-sm flex-row justify-center gap-2"
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <DollarSign size={18} color="#fff" />}
                <Text className="text-white font-bold text-base">{editId ? 'Update Payment' : 'Record Payment'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Details Modal */}
      {viewRecord && (
        <Modal visible={true} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white rounded-2xl w-full p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-slate-900 text-lg font-bold">Payment Details</Text>
                <TouchableOpacity onPress={() => setViewRecord(null)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View className="gap-4">
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Project</Text>
                  <Text className="font-bold text-slate-900 flex-1 text-right ml-4" numberOfLines={2}>{viewRecord.project_name}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Client</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.client_name || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Date & Time</Text>
                  <Text className="font-semibold text-slate-900">{new Date(viewRecord.date_of_payment).toLocaleDateString()} {viewRecord.time_of_payment}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Mode</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.payment_mode}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Reason</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.reason_for_payment || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between pt-2">
                  <Text className="text-slate-900 font-bold text-lg">Amount Paid</Text>
                  <Text className="font-bold text-emerald-600 text-xl">₹{parseFloat(viewRecord.amount_paid || 0).toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setViewRecord(null)}
                className="bg-slate-100 py-3 rounded-xl items-center mt-6"
              >
                <Text className="text-slate-700 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
    {/* FAB */}
    {/* FAB */}
    <FAB onPress={() => { resetForm(); setShowForm(true); }} style={{ bottom: 32 }} />
  </View>
  );
}
