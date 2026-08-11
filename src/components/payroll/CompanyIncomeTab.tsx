import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { DollarSign, Plus, X, Search, History, Edit, Trash2, Briefcase, Eye } from "lucide-react-native";
import api from "../../api";

export default function CompanyIncomeTab() {
  const [interns, setInterns] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  
  const [formData, setFormData] = useState({
    income_type: "",
    intern_id: "",
    intern_name: "",
    income_reason: "",
    amount: "",
    payment_type: "Bank Transfer",
    date_of_payment: new Date().toISOString().split("T")[0],
    paid_to: "Q-Techx Solutions",
    invoice_number: ""
  });

  useEffect(() => {
    fetchInterns();
    fetchHistory();
  }, []);

  const fetchInterns = async () => {
    try {
      const { data } = await api.get("/trainee-intern?limit=500&page=1");
      if (data.data && Array.isArray(data.data)) {
        setInterns(data.data);
      } else if (data.data?.rows) {
        setInterns(data.data.rows);
      } else if (Array.isArray(data)) {
        setInterns(data);
      }
    } catch (error) {
      console.warn("Failed to load interns");
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/incomes");
      if (data.success) {
        setHistory(data.incomes || []);
      }
    } catch (error) {
      console.warn("Failed to load income history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const { data } = await api.get("/incomes/next-invoice");
      if (data.success) {
        setNextInvoiceNumber(data.nextInvoiceNumber || "");
      }
    } catch (error) {
      console.warn("Failed to fetch invoice number");
    }
  };

  const openForm = () => {
    resetForm();
    fetchNextInvoiceNumber();
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      income_type: "",
      intern_id: "",
      intern_name: "",
      income_reason: "",
      amount: "",
      payment_type: "Bank Transfer",
      date_of_payment: new Date().toISOString().split("T")[0],
      paid_to: "Q-Techx Solutions",
      invoice_number: ""
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.income_type) { Alert.alert("Error", "Please select income type"); return; }
    if (formData.income_type === 'Internship Payment' && !formData.intern_id) { Alert.alert("Error", "Please select an intern"); return; }
    if (formData.income_type === 'Other' && !formData.income_reason) { Alert.alert("Error", "Please enter income reason"); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { Alert.alert("Error", "Valid amount is required"); return; }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      let response;
      if (editId) {
        response = await api.put(`/incomes/${editId}`, payload);
      } else {
        response = await api.post("/incomes", payload);
      }

      if (response.data.success) {
        Alert.alert("Success", `Income ${editId ? 'updated' : 'recorded'} successfully`);
        resetForm();
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || `Failed to ${editId ? 'update' : 'record'} income`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditId(record.income_id);
    setFormData({
      income_type: record.income_type,
      intern_id: record.intern_id || "",
      intern_name: record.intern_name || "",
      income_reason: record.income_reason || "",
      amount: record.amount?.toString() || "",
      payment_type: record.payment_type || "Bank Transfer",
      date_of_payment: record.date_of_payment ? new Date(record.date_of_payment).toISOString().split("T")[0] : "",
      paid_to: record.paid_to || "Q-Techx Solutions",
      invoice_number: record.invoice_number || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this income record? This will adjust company funds.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const { data } = await api.delete(`/incomes/${id}`);
          if (data.success) {
            Alert.alert("Deleted", "Income record deleted successfully");
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
          <Text className="text-xl font-bold text-slate-900">Company Income</Text>
          <Text className="text-sm text-slate-500">Record and track company incomes</Text>
        </View>
        <TouchableOpacity
          onPress={openForm}
          className="flex-row items-center gap-2 bg-[#f97316] px-4 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">New Income</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-10">
        <View className="p-4 border-b border-slate-100 bg-slate-50 flex-row items-center gap-2">
          <History size={18} color="#64748b" />
          <Text className="font-semibold text-slate-700">Income History</Text>
        </View>
        
        {historyLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : history.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-slate-400">No income records found</Text>
          </View>
        ) : (
          <View>
            {history.map((record, index) => (
              <View key={record.income_id || index} className="p-4 border-b border-slate-100 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-bold text-slate-900">{record.income_type}</Text>
                    {record.invoice_number && (
                      <Text className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{record.invoice_number}</Text>
                    )}
                  </View>
                  <Text className="text-xs text-slate-500">{record.intern_name || record.income_reason || '—'}</Text>
                  <Text className="text-[10px] text-slate-400 mt-1">
                    {new Date(record.date_of_payment).toLocaleDateString()} • {record.payment_type}
                  </Text>
                </View>
                <View className="items-end gap-2">
                  <Text className="font-bold text-emerald-600 text-base">₹{parseFloat(record.amount).toFixed(2)}</Text>
                  <View className="flex-row gap-2 mt-1">
                    <TouchableOpacity onPress={() => setViewRecord(record)} className="bg-slate-100 p-1.5 rounded-lg">
                      <Eye size={14} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEdit(record)} className="bg-blue-50 p-1.5 rounded-lg">
                      <Edit size={14} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(record.income_id)} className="bg-rose-50 p-1.5 rounded-lg">
                      <Trash2 size={14} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Record/Edit Income Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[85%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-900 text-lg font-bold">{editId ? 'Edit Income' : 'Record Income'}</Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Invoice Number</Text>
                <TextInput
                  className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-500 font-mono"
                  value={formData.invoice_number || nextInvoiceNumber || "Auto-generated"}
                  editable={false}
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Income Type</Text>
                <View className="flex-row gap-2">
                  {['Internship Payment', 'Other'].map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFormData({ ...formData, income_type: type, intern_id: "", intern_name: "", income_reason: "" })}
                      className={`flex-1 py-3 rounded-xl border items-center ${formData.income_type === type ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={formData.income_type === type ? 'text-orange-700 font-semibold text-sm' : 'text-slate-600 text-sm'}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.income_type === 'Internship Payment' && (
                <View>
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Select Intern</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    {interns.map(intern => {
                      const id = intern.uuid || String(intern.id);
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => setFormData({ ...formData, intern_id: id, intern_name: intern.full_name })}
                          className={`mr-2 px-4 py-2 rounded-xl border ${formData.intern_id === id ? 'bg-orange-50 border-orange-500' : 'bg-white border-slate-200'}`}
                        >
                          <Text className={formData.intern_id === id ? 'text-orange-700 font-semibold' : 'text-slate-700'}>
                            {intern.full_name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}

              {formData.income_type === 'Other' && (
                <View>
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Income Reason</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                    value={formData.income_reason}
                    onChangeText={(val) => setFormData({ ...formData, income_reason: val })}
                    placeholder="e.g. Server Reimbursement"
                  />
                </View>
              )}

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Amount Received (₹)</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  value={formData.amount}
                  onChangeText={(val) => setFormData({ ...formData, amount: val })}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Payment Mode</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['Bank Transfer', 'UPI', 'Cash', 'Cheque'].map(mode => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setFormData({ ...formData, payment_type: mode })}
                      className={`mr-2 px-4 py-2 rounded-lg border ${formData.payment_type === mode ? 'bg-orange-100 border-orange-300' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={formData.payment_type === mode ? 'text-orange-700 font-semibold text-sm' : 'text-slate-600 text-sm'}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Date</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  value={formData.date_of_payment}
                  onChangeText={(val) => setFormData({ ...formData, date_of_payment: val })}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Received By</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                  value={formData.paid_to}
                  onChangeText={(val) => setFormData({ ...formData, paid_to: val })}
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                className="bg-[#f97316] py-3.5 rounded-xl items-center mt-6 shadow-sm flex-row justify-center gap-2"
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Briefcase size={18} color="#fff" />}
                <Text className="text-white font-bold text-base">{editId ? 'Update Income' : 'Record Income'}</Text>
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
                <Text className="text-slate-900 text-lg font-bold">Income Details</Text>
                <TouchableOpacity onPress={() => setViewRecord(null)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View className="gap-4">
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Invoice Number</Text>
                  <Text className="font-bold text-slate-900 font-mono">{viewRecord.invoice_number || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Income Type</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.income_type}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">{viewRecord.income_type === 'Other' ? 'Reason' : 'Intern'}</Text>
                  <Text className="font-semibold text-slate-900 flex-1 text-right ml-4" numberOfLines={2}>
                    {viewRecord.income_type === 'Other' ? viewRecord.income_reason : viewRecord.intern_name}
                  </Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Date</Text>
                  <Text className="font-semibold text-slate-900">{new Date(viewRecord.date_of_payment).toLocaleDateString()}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Payment Mode</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.payment_type}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Received By</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.paid_to}</Text>
                </View>
                <View className="flex-row justify-between pt-2">
                  <Text className="text-slate-900 font-bold text-lg">Amount Received</Text>
                  <Text className="font-bold text-emerald-600 text-xl">₹{parseFloat(viewRecord.amount || 0).toFixed(2)}</Text>
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
  );
}
