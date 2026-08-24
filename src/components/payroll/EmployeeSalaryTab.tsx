import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { Edit, Eye, Receipt, Search, Trash2, User, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../api";
import { activeEmployeesOnly } from "../../auth/employeeUtils";
import { FAB } from "../FAB";

export default function EmployeeSalaryTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  
  // Pay form states
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  
  const [editableDetails, setEditableDetails] = useState({
    leave_deduction: "0",
    incentive_percentage: "0",
    incentive_amount: "0",
    additional_deduction: "0"
  });

  const [totalSalary, setTotalSalary] = useState(0);

  useEffect(() => {
    fetchEmployees();
    fetchHistory();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchEmployees();
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/employees?limit=200");
      if (data.data) {
        setEmployees(activeEmployeesOnly(data.data));
      } else if (data.employees) {
        setEmployees(activeEmployeesOnly(data.employees));
      }
    } catch (error) {
      console.warn("Failed to load employees");
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/salary/history");
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.warn("Failed to load salary history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSalaryDetails = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) return;
    
    setFetchingDetails(true);
    try {
      const { data } = await api.get(`/salary/details?employee_id=${selectedEmployee}&month=${selectedMonth}&year=${selectedYear}`);
      if (data.success) {
        if (data.data.alreadyPaid && !editId) {
          Alert.alert("Already Paid", "Salary has already been paid to this employee for the selected month.");
          setSalaryDetails(null);
        } else {
          setSalaryDetails(data.data);
          calculateTotal(data.data, editableDetails);
        }
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to fetch salary details");
      setSalaryDetails(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleEditableChange = (field, value) => {
    const updated = { ...editableDetails, [field]: value };
    setEditableDetails(updated);
    if (salaryDetails) {
      calculateTotal(salaryDetails, updated);
    }
  };

  const calculateTotal = (details, edits) => {
    let basic = parseFloat(details.basic_salary) || 0;
    
    let leaveDeduct = parseFloat(edits.leave_deduction) || 0;
    let addDeduct = parseFloat(edits.additional_deduction) || 0;
    let incPercent = parseFloat(edits.incentive_percentage) || 0;
    let incAmount = parseFloat(edits.incentive_amount) || 0;
    
    let totalIncentive = incAmount + (basic * incPercent / 100);
    let totalDeduction = leaveDeduct + addDeduct;
    
    let finalSalary = basic + totalIncentive - totalDeduction;
    setTotalSalary(finalSalary > 0 ? finalSalary : 0);
  };

  const handlePaySalary = async () => {
    if (!salaryDetails) return;
    
    setLoading(true);
    try {
      const payload = {
        employee_id: selectedEmployee,
        month: selectedMonth,
        year: selectedYear,
        basic_salary: salaryDetails.basic_salary,
        present_days: salaryDetails.present_days,
        leave_days: salaryDetails.leave_days,
        leave_deduction: parseFloat(editableDetails.leave_deduction) || 0,
        incentive_percentage: parseFloat(editableDetails.incentive_percentage) || 0,
        incentive_amount: parseFloat(editableDetails.incentive_amount) || 0,
        additional_deduction: parseFloat(editableDetails.additional_deduction) || 0,
        total_salary: totalSalary
      };
      
      let response;
      if (editId) {
        response = await api.put(`/salary/pay/${editId}`, payload);
      } else {
        response = await api.post("/salary/pay", payload);
      }

      if (response.data.success) {
        Alert.alert("Success", `Salary ${editId ? 'updated' : 'paid'} successfully`);
        resetForm();
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || `Failed to ${editId ? 'update' : 'pay'} salary`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditId(record.id);
    setSelectedMonth(record.salary_month);
    setSelectedYear(record.salary_year);
    setSelectedEmployee(record.employee_id);
    setEditableDetails({
      leave_deduction: record.leave_deduction?.toString() || "0",
      incentive_percentage: record.incentive_percentage?.toString() || "0",
      incentive_amount: record.incentive_amount?.toString() || "0",
      additional_deduction: record.additional_deduction?.toString() || "0"
    });
    setSalaryDetails({
      basic_salary: record.basic_salary,
      present_days: record.present_days,
      leave_days: record.leave_days
    });
    setTotalSalary(parseFloat(record.total_salary) || 0);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this salary record? This will restore company funds.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const { data } = await api.delete(`/salary/pay/${id}`);
          if (data.success) {
            Alert.alert("Deleted", "Salary record deleted successfully");
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
    setSalaryDetails(null);
    setSelectedEmployee("");
    setEditableDetails({
      leave_deduction: "0",
      incentive_percentage: "0",
      incentive_amount: "0",
      additional_deduction: "0"
    });
  };

  const filteredHistory = history.filter(record => {
    const matchesSearch = !searchQuery || (
      record.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      record.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesMonth = !monthFilter || record.salary_month === monthFilter;
    return matchesSearch && matchesMonth;
  });

  const totalEmployees = employees.length;
  const totalPaid = filteredHistory.reduce((acc, curr) => acc + parseFloat(curr.total_salary || 0), 0);
  const paidCount = filteredHistory.length;
  const avgPaid = paidCount > 0 ? totalPaid / paidCount : 0;

  const dynamicStats = [
    {
      label: "Total Employees",
      value: String(totalEmployees),
      sub: "All Active",
      icon: "people",
      subColor: "text-blue-500",
    },
    {
      label: "Total Salary Paid",
      value: `₹ ${totalPaid.toFixed(2)}`,
      sub: monthFilter ? `Month: ${monthFilter}` : "All Time",
      icon: "cash",
      subColor: "text-green-500",
    },
    {
      label: "Salaries Processed",
      value: String(paidCount),
      sub: "Records Found",
      icon: "document-text",
      subColor: "text-orange-500",
    },
    {
      label: "Average Salary",
      value: `₹ ${avgPaid.toFixed(2)}`,
      sub: "Per Employee",
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

          {/* Month Dropdown Filter */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setMonthDropdownOpen(true)}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                  {monthFilter ? `Month: ${MONTHS.find(m => m.v === monthFilter)?.l || monthFilter}` : "All Months"}
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

      <View className="mb-20">
        <View className="flex-row items-center gap-2 mb-4 px-1">
          <Receipt size={18} color="#f97316" />
          <Text className="font-semibold text-slate-700">Salary History</Text>
        </View>
        
        {historyLoading ? (
          <View className="items-center justify-center py-10 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : filteredHistory.length === 0 ? (
          <View className="items-center justify-center py-10 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <Text className="text-slate-400">No salary records found</Text>
          </View>
        ) : (
          <View>
            {filteredHistory.map((record, index) => (
              <View key={record.id || index} className="flex-row items-center justify-between p-4 mb-3 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#f97316", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
                <View className="flex-1 mr-3 flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center bg-orange-50">
                    <User size={18} color="#f97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900" numberOfLines={1}>{record.first_name} {record.last_name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">{record.employee_code} • {MONTHS.find(m => m.v === record.salary_month)?.l || record.salary_month} {record.salary_year}</Text>
                    <View className="flex-row items-center gap-2 mt-1.5">
                      <Text className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Base: ₹{parseFloat(record.basic_salary || 0).toFixed(2)}
                      </Text>
                      <Text className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
                        Ded: ₹{(parseFloat(record.leave_deduction || 0) + parseFloat(record.additional_deduction || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end gap-2">
                  <Text className="font-black text-orange-600 text-base">₹{parseFloat(record.total_salary || 0).toFixed(2)}</Text>
                  <View className="flex-row gap-1">
                    <TouchableOpacity onPress={() => setViewRecord(record)} className="bg-slate-100 p-1.5 rounded-md">
                      <Eye size={12} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEdit(record)} className="bg-orange-50 p-1.5 rounded-md">
                      <Edit size={12} color="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(record.id)} className="bg-orange-50 p-1.5 rounded-md">
                      <Trash2 size={12} color="#f97316" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pay/Edit Salary Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[90%] shadow-2xl overflow-hidden">
            <View className="bg-black pt-4 px-6 pb-6">
              <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-orange-500 text-lg font-bold">{editId ? 'Edit Payment' : 'Process Salary Payment'}</Text>
                  <Text className="text-white text-xs mt-1">Manage employee salary details</Text>
                </View>
                <TouchableOpacity onPress={resetForm} className="bg-orange-100 p-2 rounded-full">
                  <X size={20} color="#f97316" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Month</Text>
                  <TouchableOpacity disabled={Boolean(editId)} onPress={() => setShowMonthPicker(true)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-row items-center justify-between">
                    <Text className="text-slate-900">{selectedMonth}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#f97316" />
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Year</Text>
                  <TouchableOpacity disabled={Boolean(editId)} onPress={() => setShowMonthPicker(true)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-row items-center justify-between">
                    <Text className="text-slate-900">{selectedYear}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#f97316" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Select Employee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  {employees.map(emp => (
                    <TouchableOpacity
                      key={emp.employee_id}
                      onPress={() => !editId && setSelectedEmployee(emp.employee_id)}
                      className={`mr-2 px-4 py-2 rounded-xl border ${selectedEmployee === emp.employee_id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'} ${editId && selectedEmployee !== emp.employee_id ? 'opacity-50' : ''}`}
                      disabled={editId !== null}
                    >
                      <Text className={selectedEmployee === emp.employee_id ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
                        {emp.first_name} {emp.last_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {!editId && (
                <TouchableOpacity
                  onPress={fetchSalaryDetails}
                  className="bg-slate-900 py-3 rounded-xl items-center flex-row justify-center gap-2"
                  disabled={fetchingDetails || !selectedEmployee}
                >
                  {fetchingDetails ? <ActivityIndicator size="small" color="#fff" /> : <Search size={16} color="#fff" />}
                  <Text className="text-white font-semibold">Fetch Details</Text>
                </TouchableOpacity>
              )}

              {salaryDetails && (
                <View className="mt-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
                  <Text className="font-bold text-slate-800 text-base mb-4 border-b border-slate-200 pb-2">Salary Breakdown</Text>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500">Basic Salary:</Text>
                    <Text className="font-semibold text-slate-800">₹{parseFloat(salaryDetails.basic_salary || 0).toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-4">
                    <Text className="text-slate-500">Attendance:</Text>
                    <Text className="font-semibold text-slate-800">{salaryDetails.present_days} Present, {salaryDetails.leave_days} Absent</Text>
                  </View>

                  <View className="gap-3">
                    <View>
                      <Text className="text-xs font-semibold text-rose-500 mb-1">Leave Deduction (₹)</Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-sm"
                        value={editableDetails.leave_deduction}
                        onChangeText={(val) => handleEditableChange("leave_deduction", val)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View>
                      <Text className="text-xs font-semibold text-rose-500 mb-1">Additional Deduction (₹)</Text>
                      <TextInput
                        className="bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-sm"
                        value={editableDetails.additional_deduction}
                        onChangeText={(val) => handleEditableChange("additional_deduction", val)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-emerald-600 mb-1">Incentive (%)</Text>
                        <TextInput
                          className="bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-sm"
                          value={editableDetails.incentive_percentage}
                          onChangeText={(val) => handleEditableChange("incentive_percentage", val)}
                          keyboardType="numeric"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-emerald-600 mb-1">Incentive (₹)</Text>
                        <TextInput
                          className="bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-sm"
                          value={editableDetails.incentive_amount}
                          onChangeText={(val) => handleEditableChange("incentive_amount", val)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  <View className="mt-6 pt-4 border-t border-slate-200 flex-row justify-between items-center">
                    <Text className="text-slate-900 font-bold text-lg">Net Salary</Text>
                    <Text className="text-emerald-600 font-bold text-2xl">₹{totalSalary.toFixed(2)}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handlePaySalary}
                    className="bg-emerald-600 py-3.5 rounded-xl items-center mt-6 shadow-sm flex-row justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
                    <Text className="text-white font-bold text-base">{editId ? 'Update Payment' : 'Process Payment'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        {showMonthPicker && <DateTimePicker value={new Date(Number(selectedYear), Number(selectedMonth) - 1, 1)} mode="date" display="default" onChange={(event, date) => { setShowMonthPicker(false); if (event.type === "set" && date) { setSelectedMonth(String(date.getMonth() + 1).padStart(2, "0")); setSelectedYear(String(date.getFullYear())); } }} />}
      </Modal>

      {/* View Details Modal */}
      {viewRecord && (
        <Modal visible={true} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white rounded-2xl w-full p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-slate-900 text-lg font-bold">Salary Details</Text>
                <TouchableOpacity onPress={() => setViewRecord(null)}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View className="gap-4">
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Employee</Text>
                  <Text className="font-bold text-slate-900">{viewRecord.first_name} {viewRecord.last_name}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Month/Year</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.salary_month}/{viewRecord.salary_year}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Basic Salary</Text>
                  <Text className="font-semibold text-slate-900">₹{parseFloat(viewRecord.basic_salary || 0).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Attendance</Text>
                  <Text className="font-semibold text-slate-900">{viewRecord.present_days} P / {viewRecord.leave_days} A</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Leave Deduction</Text>
                  <Text className="font-semibold text-rose-600">- ₹{parseFloat(viewRecord.leave_deduction || 0).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Additional Deduction</Text>
                  <Text className="font-semibold text-rose-600">- ₹{parseFloat(viewRecord.additional_deduction || 0).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between border-b border-slate-100 pb-2">
                  <Text className="text-slate-500">Incentive ({viewRecord.incentive_percentage || 0}%)</Text>
                  <Text className="font-semibold text-emerald-600">+ ₹{parseFloat(viewRecord.incentive_amount || 0).toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between pt-2">
                  <Text className="text-slate-900 font-bold text-lg">Net Salary Paid</Text>
                  <Text className="font-bold text-emerald-600 text-xl">₹{parseFloat(viewRecord.total_salary || 0).toFixed(2)}</Text>
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
