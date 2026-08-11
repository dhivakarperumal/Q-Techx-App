import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { FolderKanban, DollarSign, Plus, X, Search, History, Edit, Trash2 } from "lucide-react-native";
import api from "../../api";

export default function ProjectPaymentTab() {
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

      const { data } = await api.post("/project-payments", payload);
      if (data.success) {
        Alert.alert("Success", "Project payment recorded successfully");
        setShowForm(false);
        setSelectedProject("");
        setProjectSummary(null);
        setFormData({
          amount_paid: "",
          payment_mode: "Bank Transfer",
          reason_for_payment: "",
          date_of_payment: new Date().toISOString().split("T")[0],
          time_of_payment: new Date().toLocaleTimeString("en-IN", { hour12: false }).substring(0, 5),
        });
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
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

  return (
    <ScrollView className="flex-1 bg-[#F9FAFB] p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6 mt-2">
        <View>
          <Text className="text-xl font-bold text-slate-900">Project Payments</Text>
          <Text className="text-sm text-slate-500">Track client payments for projects</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="flex-row items-center gap-2 bg-[#f97316] px-4 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">Record Payment</Text>
        </TouchableOpacity>
      </View>

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
        ) : history.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-slate-400">No payment records found</Text>
          </View>
        ) : (
          <View>
            {history.map((record, index) => (
              <View key={record.uuid || record.id || index} className="p-4 border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="font-bold text-slate-900" numberOfLines={1}>{record.project_name || 'Project'}</Text>
                  <Text className="text-xs text-slate-500 mt-1">{record.client_name || 'N/A'} • {record.payment_mode}</Text>
                  <Text className="text-[10px] text-slate-400 mt-1">
                    {new Date(record.date_of_payment).toLocaleDateString()} {record.time_of_payment}
                  </Text>
                </View>
                <View className="items-end gap-2">
                  <Text className="font-bold text-emerald-600 text-base">₹{parseFloat(record.amount_paid).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(record.uuid || record.id)} className="bg-rose-100 p-1.5 rounded-lg mt-1">
                    <Trash2 size={14} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Record Payment Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[85%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-900 text-lg font-bold">Record Payment</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Select Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  {projects.map(proj => {
                    const pid = proj.uuid || proj.id;
                    return (
                      <TouchableOpacity
                        key={pid}
                        onPress={() => handleProjectSelect(pid)}
                        className={`mr-2 px-4 py-3 rounded-xl border max-w-[200px] ${selectedProject === pid ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-200'}`}
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
                <Text className="text-white font-bold text-base">Record Payment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
