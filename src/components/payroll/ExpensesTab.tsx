import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Receipt, DollarSign, PlusCircle, X, Filter } from "lucide-react-native";
import { PieChart } from "react-native-gifted-charts";
import api from "../../api";

const expenseFilterTypeOptions = [
  "Salary", "Project Payment", "Income", "Office Rent", "Electricity Bill",
  "Water Bill", "Internet Bill", "Phone Bill", "Office Maintenance",
  "Office Supplies", "Stationery", "Snacks & Tea", "Travel Expense",
  "Fuel Expense", "Software Subscription", "Cloud Hosting", "Domain & SSL",
  "Marketing", "Advertising", "Courier & Shipping", "Furniture",
  "Computer & Accessories", "Employee Welfare", "Training", "Taxes",
  "Insurance", "Miscellaneous", "Other",
];

const paymentMethodOptions = ["Cash", "Bank Transfer", "Credit Card", "UPI", "Cheque"];

export default function ExpensesTab() {
  const [fund, setFund] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [showFundForm, setShowFundForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    expenseType: "",
    paymentMethod: "",
    datePreset: "all",
  });

  // Form states
  const [fundAmount, setFundAmount] = useState("");
  const [expenseData, setExpenseData] = useState({
    expense_type: "",
    date_of_payment: "",
    amount: "",
    payment_type: "",
    paid_to: "",
    description: "",
    invoice_number: "",
  });

  const fetchFund = async () => {
    try {
      const { data } = await api.get("/fund");
      if (data.success) {
        setFund(parseFloat(data.available_fund));
      }
    } catch (error) {
      console.error("Error fetching fund", error);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/expenses");
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Error fetching expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFund();
    fetchExpenses();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchFund();
    await fetchExpenses();
    setRefreshing(false);
  }, []);

  const handleUpdateFund = async () => {
    try {
      const { data } = await api.post("/fund", { available_fund: parseFloat(fundAmount) });
      if (data.success) {
        Alert.alert("Success", "Fund updated successfully");
        setFund(parseFloat(data.available_fund));
        setShowFundForm(false);
        setFundAmount("");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Error updating fund");
    }
  };

  const handleAddExpense = async () => {
    if (!expenseData.expense_type || !expenseData.amount || !expenseData.date_of_payment || !expenseData.paid_to) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }
    try {
      const payload = {
        expense_type: expenseData.expense_type,
        date_of_payment: expenseData.date_of_payment,
        amount: expenseData.amount,
        payment_type: expenseData.payment_type || "Bank Transfer",
        paid_to: expenseData.paid_to,
        description: expenseData.description,
        invoice_number: expenseData.invoice_number,
      };

      const { data } = await api.post("/expenses", payload);
      if (data.success) {
        Alert.alert("Success", "Expense added successfully");
        setShowExpenseForm(false);
        setExpenseData({
          expense_type: "", date_of_payment: "", amount: "", payment_type: "",
          paid_to: "", description: "", invoice_number: "",
        });
        fetchFund();
        fetchExpenses();
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Error adding expense");
    }
  };

  const isCreditEntry = (entry) => {
    const type = String(entry?.expense_type || "").trim().toLowerCase();
    return type === "income" || type === "project payment";
  };

  const filteredExpenses = expenses.filter((exp) => {
    const expenseDate = exp.date_of_payment ? new Date(exp.date_of_payment) : null;
    if (filters.expenseType && exp.expense_type !== filters.expenseType) return false;
    if (filters.paymentMethod && exp.payment_type !== filters.paymentMethod) return false;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    if (filters.datePreset === "today") {
      return Boolean(expenseDate && expenseDate >= startOfToday && expenseDate <= endOfToday);
    } else if (filters.datePreset === "this_month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return Boolean(expenseDate && expenseDate >= monthStart && expenseDate <= monthEnd);
    }
    return true;
  });

  const filteredSpendEntries = filteredExpenses.filter((exp) => !isCreditEntry(exp));
  const totalSpent = filteredSpendEntries.reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);
  
  const categoryBreakdown = Object.entries(
    filteredSpendEntries.reduce((acc, exp) => {
      const key = exp.expense_type || "Miscellaneous";
      acc[key] = (acc[key] || 0) + parseFloat(exp.amount || 0);
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const pieColors = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
  const pieData = categoryBreakdown.map((item, index) => ({
    value: item.value,
    color: pieColors[index % pieColors.length],
    text: `${((item.value / totalSpent) * 100).toFixed(0)}%`,
  }));

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-[#F9FAFB] p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
      {/* ── Stats Overview ── */}
      <View className="flex-row justify-between mb-4 gap-2">
        <View className="flex-1 bg-white border border-emerald-100 rounded-2xl p-4 overflow-hidden relative shadow-sm">
          <View className="flex-row items-center gap-3 mb-2 z-10">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
              <DollarSign size={18} color="#10b981" />
            </View>
            <View>
              <Text className="text-slate-500 text-[10px] uppercase font-semibold">Available Fund</Text>
              <Text className="text-xl font-bold text-emerald-600 mt-1">₹ {fund.toFixed(2)}</Text>
            </View>
          </View>
          
          <View className="mt-4 z-10">
            {!showFundForm ? (
              <TouchableOpacity
                onPress={() => setShowFundForm(true)}
                className="bg-emerald-50 px-3 py-2 rounded-lg self-start"
              >
                <Text className="text-xs font-semibold text-emerald-600">Update Fund</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-900"
                  placeholder="Amount"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={fundAmount}
                  onChangeText={setFundAmount}
                />
                <TouchableOpacity onPress={handleUpdateFund} className="bg-emerald-500 px-3 py-1.5 rounded-lg justify-center">
                  <Text className="text-white text-xs font-semibold">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFundForm(false)} className="bg-slate-100 px-3 py-1.5 rounded-lg justify-center">
                  <Text className="text-slate-600 text-xs">X</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View className="flex-1 bg-white border border-rose-100 rounded-2xl p-4 overflow-hidden relative shadow-sm">
          <View className="flex-row items-center gap-3 z-10">
            <View className="w-10 h-10 rounded-xl bg-rose-50 items-center justify-center">
              <Receipt size={18} color="#f43f5e" />
            </View>
            <View>
              <Text className="text-slate-500 text-[10px] uppercase font-semibold">Total Spent</Text>
              <Text className="text-xl font-bold text-rose-600 mt-1">₹ {totalSpent.toFixed(2)}</Text>
            </View>
          </View>
          <Text className="text-[10px] text-slate-400 mt-4 z-10">{filteredExpenses.length} transactions.</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          className="flex-row items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-xl shadow-sm"
        >
          <Filter size={18} color="#64748b" />
          <Text className="text-slate-700 text-sm font-semibold">Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Pie Chart Section */}
      <View className="bg-white border border-slate-100 rounded-2xl p-5 mb-4 shadow-sm flex-row items-center">
        <View className="flex-1 items-center">
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              innerRadius={30}
              radius={60}
              textColor="black"
              textSize={10}
              showText
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-slate-400 text-xs">No Data</Text>
            </View>
          )}
        </View>
        <View className="flex-1 ml-4 gap-2">
          {categoryBreakdown.slice(0, 5).map((item, index) => (
            <View key={item.name} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                <Text className="text-slate-600 text-[10px] w-20" numberOfLines={1}>{item.name}</Text>
              </View>
              <Text className="text-slate-800 text-[10px] font-bold">₹{item.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expenses List */}
      <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-10">
        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View className="items-center justify-center p-6 py-10">
            <Receipt size={40} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm mt-3">No expenses matched</Text>
          </View>
        ) : (
          <View className="p-2">
            {filteredExpenses.map((exp, i) => {
              const isCredit = isCreditEntry(exp);
              return (
                <View key={exp.expense_id || i} className="flex-row items-center justify-between p-3 border-b border-slate-100">
                  <View className="flex-1 mr-3">
                    <Text className="text-slate-900 font-semibold text-sm">{exp.expense_type}</Text>
                    <Text className="text-slate-500 text-[10px] mt-0.5">Paid to: {exp.paid_to}</Text>
                    <Text className="text-slate-500 text-[10px] mt-0.5">
                      {new Date(exp.date_of_payment).toLocaleDateString()} • {exp.payment_type}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCredit ? '+' : '-'} ₹ {parseFloat(exp.amount).toFixed(2)}
                    </Text>
                    <Text className="text-[9px] text-slate-400 mt-1">{isCredit ? 'Added' : 'Spent'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-3/4 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-900 text-lg font-bold">Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Date Range</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {[ {l: "All", v: "all"}, {l: "Today", v: "today"}, {l: "This Month", v: "this_month"}].map(pre => (
                  <TouchableOpacity
                    key={pre.v}
                    onPress={() => setFilters({...filters, datePreset: pre.v})}
                    className={`px-4 py-2 rounded-full border ${filters.datePreset === pre.v ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${filters.datePreset === pre.v ? 'text-orange-700' : 'text-slate-600'}`}>{pre.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Payment Method</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                <TouchableOpacity
                  onPress={() => setFilters({...filters, paymentMethod: ""})}
                  className={`px-3 py-1.5 rounded-lg border ${filters.paymentMethod === "" ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <Text className={`text-[11px] font-semibold ${filters.paymentMethod === "" ? 'text-orange-700' : 'text-slate-600'}`}>All</Text>
                </TouchableOpacity>
                {paymentMethodOptions.map(pm => (
                  <TouchableOpacity
                    key={pm}
                    onPress={() => setFilters({...filters, paymentMethod: pm})}
                    className={`px-3 py-1.5 rounded-lg border ${filters.paymentMethod === pm ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-[11px] font-semibold ${filters.paymentMethod === pm ? 'text-orange-700' : 'text-slate-600'}`}>{pm}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Expense Type</Text>
              <View className="flex-row flex-wrap gap-2 mb-8">
                <TouchableOpacity
                  onPress={() => setFilters({...filters, expenseType: ""})}
                  className={`px-3 py-1.5 rounded-lg border ${filters.expenseType === "" ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <Text className={`text-[11px] font-semibold ${filters.expenseType === "" ? 'text-orange-700' : 'text-slate-600'}`}>All</Text>
                </TouchableOpacity>
                {expenseFilterTypeOptions.map(et => (
                  <TouchableOpacity
                    key={et}
                    onPress={() => setFilters({...filters, expenseType: et})}
                    className={`px-3 py-1.5 rounded-lg border ${filters.expenseType === et ? 'bg-orange-100 border-orange-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`text-[11px] font-semibold ${filters.expenseType === et ? 'text-orange-700' : 'text-slate-600'}`}>{et}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View className="flex-row gap-3 pt-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setFilters({ expenseType: "", paymentMethod: "", datePreset: "all" })}
                className="flex-1 py-3 rounded-xl items-center border border-slate-200 bg-slate-50"
              >
                <Text className="text-slate-700 font-bold">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="flex-1 py-3 rounded-xl items-center bg-[#f97316]"
              >
                <Text className="text-white font-bold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showExpenseForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-5/6 shadow-2xl overflow-hidden">
            <View className="flex-row justify-between items-center p-6 bg-slate-900">
              <Text className="text-white text-lg font-bold">Record New Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseForm(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, padding: 24, paddingBottom: 40 }}>
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Expense Type</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="e.g. Office Rent"
                  placeholderTextColor="#94a3b8"
                  value={expenseData.expense_type}
                  onChangeText={(text) => setExpenseData({ ...expenseData, expense_type: text })}
                />
              </View>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Paid To</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="e.g. Amazon"
                  placeholderTextColor="#94a3b8"
                  value={expenseData.paid_to}
                  onChangeText={(text) => setExpenseData({ ...expenseData, paid_to: text })}
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Date</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={expenseData.date_of_payment}
                  onChangeText={(text) => setExpenseData({ ...expenseData, date_of_payment: text })}
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Amount (₹)</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={expenseData.amount}
                  onChangeText={(text) => setExpenseData({ ...expenseData, amount: text })}
                />
              </View>

              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Payment Type</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="e.g. Bank Transfer"
                  placeholderTextColor="#94a3b8"
                  value={expenseData.payment_type}
                  onChangeText={(text) => setExpenseData({ ...expenseData, payment_type: text })}
                />
              </View>
              
              <View>
                <Text className="text-slate-500 text-xs font-bold uppercase mb-1">Description</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="Notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={expenseData.description}
                  onChangeText={(text) => setExpenseData({ ...expenseData, description: text })}
                />
              </View>

              <TouchableOpacity
                onPress={handleAddExpense}
                className="bg-[#f97316] py-3.5 rounded-xl items-center mt-4 shadow-sm"
              >
                <Text className="text-white font-bold text-sm">Submit Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowExpenseForm(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#f97316] rounded-full items-center justify-center shadow-lg"
      >
        <PlusCircle size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
