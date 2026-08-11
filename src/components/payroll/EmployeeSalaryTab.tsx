import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { DollarSign, Search, CheckCircle, Plus, Receipt, User, Calendar, X, Edit, Trash2 } from "lucide-react-native";
import api from "../../api";

export default function EmployeeSalaryTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  
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
        if (data.data.alreadyPaid) {
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
    
    // Convert edits to floats
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
      
      const { data } = await api.post("/salary/pay", payload);
      if (data.success) {
        Alert.alert("Success", "Salary paid successfully");
        setShowForm(false);
        setSalaryDetails(null);
        setSelectedEmployee("");
        setEditableDetails({
          leave_deduction: "0",
          incentive_percentage: "0",
          incentive_amount: "0",
          additional_deduction: "0"
        });
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to pay salary");
    }
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

  return (
    <ScrollView className="flex-1 bg-[#F9FAFB] p-4">
      {/* Header section */}
      <View className="flex-row justify-between items-center mb-6 mt-2">
        <View>
          <Text className="text-xl font-bold text-slate-900">Employee Salary</Text>
          <Text className="text-sm text-slate-500">Manage and distribute salaries</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="flex-row items-center gap-2 bg-emerald-600 px-4 py-2.5 rounded-xl shadow-sm"
        >
          <Plus size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">Pay Salary</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
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
                      Basic: ₹{parseFloat(record.basic_salary).toFixed(2)}
                    </Text>
                    <Text className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded">
                      Ded: ₹{(parseFloat(record.leave_deduction) + parseFloat(record.additional_deduction)).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View className="items-end gap-2">
                  <Text className="font-bold text-emerald-600 text-base">₹{parseFloat(record.total_salary).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(record.id)} className="bg-rose-100 p-1.5 rounded-lg mt-1">
                    <Trash2 size={14} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pay Salary Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-5/6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-900 text-lg font-bold">Process Salary</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setSalaryDetails(null); }}>
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
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Select Employee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  {employees.map(emp => (
                    <TouchableOpacity
                      key={emp.employee_id}
                      onPress={() => setSelectedEmployee(emp.employee_id)}
                      className={`mr-2 px-4 py-2 rounded-xl border ${selectedEmployee === emp.employee_id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={selectedEmployee === emp.employee_id ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
                        {emp.first_name} {emp.last_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={fetchSalaryDetails}
                className="bg-slate-900 py-3 rounded-xl items-center flex-row justify-center gap-2"
                disabled={fetchingDetails || !selectedEmployee}
              >
                {fetchingDetails ? <ActivityIndicator size="small" color="#fff" /> : <Search size={16} color="#fff" />}
                <Text className="text-white font-semibold">Fetch Details</Text>
              </TouchableOpacity>

              {salaryDetails && (
                <View className="mt-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
                  <Text className="font-bold text-slate-800 text-base mb-4 border-b border-slate-200 pb-2">Salary Breakdown</Text>
                  
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500">Basic Salary:</Text>
                    <Text className="font-semibold text-slate-800">₹{parseFloat(salaryDetails.basic_salary).toFixed(2)}</Text>
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
                    className="bg-emerald-600 py-3.5 rounded-xl items-center mt-6 shadow-sm"
                  >
                    <Text className="text-white font-bold text-base">Process Payment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
