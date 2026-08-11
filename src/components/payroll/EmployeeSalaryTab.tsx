import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { DollarSign, Search, CheckCircle, Plus, Receipt, User, Calendar, X, Edit, Trash2, Eye } from "lucide-react-native";
import api from "../../api";

export default function EmployeeSalaryTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  
  // Pay form states
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState("");
  
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

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get("/employees?limit=200");
      if (data.data) {
        setEmployees(data.data);
      } else if (data.employees) {
        setEmployees(data.employees);
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

  return (
    <ScrollView className="flex-1 bg-[#F9FAFB] p-4">
      <View className="flex-row justify-between items-center mb-6 mt-2">
        <View>
          <Text className="text-xl font-bold text-slate-900">Employee Salary</Text>
          <Text className="text-sm text-slate-500">Manage and distribute salaries</Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setShowForm(true); }}
          className="flex-row items-center gap-2 bg-emerald-600 px-4 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">Pay Salary</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-10">
        <View className="p-4 border-b border-slate-100 bg-slate-50 flex-row items-center gap-2">
          <Receipt size={18} color="#64748b" />
          <Text className="font-semibold text-slate-700">Salary History</Text>
        </View>
        
        {historyLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : history.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-slate-400">No salary records found</Text>
          </View>
        ) : (
          <View>
            {history.map((record, index) => (
              <View key={record.id || index} className="p-4 border-b border-slate-100 flex-row items-center justify-between">
                <View>
                  <Text className="font-bold text-slate-900">{record.first_name} {record.last_name}</Text>
                  <Text className="text-xs text-slate-500">{record.employee_code} • {record.salary_month}/{record.salary_year}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Basic: ₹{parseFloat(record.basic_salary || 0).toFixed(2)}
                    </Text>
                    <Text className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded">
                      Ded: ₹{(parseFloat(record.leave_deduction || 0) + parseFloat(record.additional_deduction || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View className="items-end gap-2">
                  <Text className="font-bold text-emerald-600 text-base">₹{parseFloat(record.total_salary || 0).toFixed(2)}</Text>
                  <View className="flex-row gap-2 mt-1">
                    <TouchableOpacity onPress={() => setViewRecord(record)} className="bg-slate-100 p-1.5 rounded-lg">
                      <Eye size={14} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEdit(record)} className="bg-blue-50 p-1.5 rounded-lg">
                      <Edit size={14} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(record.id)} className="bg-rose-50 p-1.5 rounded-lg">
                      <Trash2 size={14} color="#f43f5e" />
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
          <View className="bg-white rounded-t-3xl p-6 h-[90%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-900 text-lg font-bold">{editId ? 'Edit Salary' : 'Process Salary'}</Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
              
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Month</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                    value={selectedMonth}
                    onChangeText={setSelectedMonth}
                    keyboardType="numeric"
                    placeholder="MM"
                    editable={!editId}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Year</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                    value={selectedYear}
                    onChangeText={setSelectedYear}
                    keyboardType="numeric"
                    placeholder="YYYY"
                    editable={!editId}
                  />
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
  );
}
