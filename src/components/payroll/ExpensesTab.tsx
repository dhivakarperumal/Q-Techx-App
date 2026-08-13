import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, RefreshControl, Pressable } from "react-native";
import { Receipt, DollarSign, Filter, PlusCircle, X, ChevronDown, Check } from "lucide-react-native";
import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api";
import { FAB } from "../FAB";

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
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [expenseTypeDropdownOpen, setExpenseTypeDropdownOpen] = useState(false);
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);

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
    const matchesSearch = !searchQuery || (exp.expense_type?.toLowerCase().includes(searchQuery.toLowerCase()) || exp.paid_to?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

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
  
  const thisMonthSpent = filteredSpendEntries.filter(exp => {
    const d = new Date(exp.date_of_payment);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);
  
  const totalTransactions = filteredSpendEntries.length;

  const dynamicStats = [
    {
      label: "Available Fund",
      value: `₹ ${fund.toFixed(2)}`,
      sub: "Update Fund",
      icon: "wallet",
      subColor: "text-green-500",
      onPress: () => setShowFundForm(true)
    },
    {
      label: "Total Spent",
      value: `₹ ${totalSpent.toFixed(2)}`,
      sub: "All Time",
      icon: "cash",
      subColor: "text-red-500",
    },
    {
      label: "This Month",
      value: `₹ ${thisMonthSpent.toFixed(2)}`,
      sub: "Current Month",
      icon: "calendar",
      subColor: "text-orange-500",
    },
    {
      label: "Transactions",
      value: String(totalTransactions),
      sub: "Expense Count",
      icon: "receipt",
      subColor: "text-violet-500",
    },
  ];

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
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>
      {/* ── STATS SECTION ── */}
      <View className="mb-6 flex-row flex-wrap justify-between">
        {dynamicStats.map((stat, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={stat.onPress}
            activeOpacity={stat.onPress ? 0.7 : 1}
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
              <View className="flex-row items-baseline justify-between">
                <Text className="text-[22px] font-black text-black">
                  {stat.value}
                </Text>
                <Text className={`text-[10px] font-bold ${stat.subColor || "text-gray-400"}`}>
                  {stat.sub}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {showFundForm && (
        <View className="bg-emerald-50 p-3 rounded-xl mb-4 border border-emerald-100 flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900"
            placeholder="Amount"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={fundAmount}
            onChangeText={setFundAmount}
          />
          <TouchableOpacity onPress={handleUpdateFund} className="bg-emerald-500 px-4 py-2.5 rounded-lg justify-center">
            <Text className="text-white text-xs font-bold">Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFundForm(false)} className="bg-slate-200 px-3 py-2.5 rounded-lg justify-center">
            <Text className="text-slate-600 text-xs font-bold">X</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SEARCH & FILTER ── */}
      <View className="mb-6">
        {/* Search */}
        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search expenses..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm font-medium text-slate-800 h-10"
          />
        </View>

        {/* Date Pills */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[ {l: "All Time", v: "all"}, {l: "Today", v: "today"}, {l: "This Month", v: "this_month"}].map(pre => (
            <TouchableOpacity
              key={pre.v}
              onPress={() => setFilters({...filters, datePreset: pre.v})}
              className={`px-4 py-2 rounded-full border ${filters.datePreset === pre.v ? 'bg-orange-100 border-orange-200' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-xs font-semibold ${filters.datePreset === pre.v ? 'text-orange-700' : 'text-slate-600'}`}>{pre.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dropdown Filters */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => {
                setExpenseTypeDropdownOpen(true);
                setPaymentMethodDropdownOpen(false);
              }}
              className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
            >
              <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                {filters.expenseType || "All Expense Types"}
              </Text>
              <Ionicons name="chevron-down" size={15} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => {
                setPaymentMethodDropdownOpen(true);
                setExpenseTypeDropdownOpen(false);
              }}
              className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
            >
              <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                {filters.paymentMethod || "All Methods"}
              </Text>
              <Ionicons name="chevron-down" size={15} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
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
      <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-20">
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

      <Modal visible={expenseTypeDropdownOpen} transparent animationType="fade" onRequestClose={() => setExpenseTypeDropdownOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setExpenseTypeDropdownOpen(false)}>
          <Pressable className="bg-white rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
            <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">Select Expense Type</Text>
            <ScrollView style={{maxHeight: 400}}>
              <TouchableOpacity
                onPress={() => { setFilters({...filters, expenseType: ""}); setExpenseTypeDropdownOpen(false); }}
                className="px-5 py-4 border-b border-slate-100"
              >
                <Text className={`text-sm ${!filters.expenseType ? "font-bold text-orange-500" : "text-slate-700"}`}>All Expense Types</Text>
              </TouchableOpacity>
              {expenseFilterTypeOptions.map((et) => (
                <TouchableOpacity
                  key={et}
                  onPress={() => { setFilters({...filters, expenseType: et}); setExpenseTypeDropdownOpen(false); }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text className={`text-sm ${filters.expenseType === et ? "font-bold text-orange-500" : "text-slate-700"}`}>{et}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={paymentMethodDropdownOpen} transparent animationType="fade" onRequestClose={() => setPaymentMethodDropdownOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setPaymentMethodDropdownOpen(false)}>
          <Pressable className="bg-white rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
            <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">Select Payment Method</Text>
            <TouchableOpacity
              onPress={() => { setFilters({...filters, paymentMethod: ""}); setPaymentMethodDropdownOpen(false); }}
              className="px-5 py-4 border-b border-slate-100"
            >
              <Text className={`text-sm ${!filters.paymentMethod ? "font-bold text-orange-500" : "text-slate-700"}`}>All Methods</Text>
            </TouchableOpacity>
            {paymentMethodOptions.map((pm) => (
              <TouchableOpacity
                key={pm}
                onPress={() => { setFilters({...filters, paymentMethod: pm}); setPaymentMethodDropdownOpen(false); }}
                className="px-5 py-4 border-b border-slate-100"
              >
                <Text className={`text-sm ${filters.paymentMethod === pm ? "font-bold text-orange-500" : "text-slate-700"}`}>{pm}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={showExpenseForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] shadow-2xl overflow-hidden">
            <View className="bg-black pt-4 px-6 pb-6">
              <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-orange-500 text-lg font-bold">Record New Expense</Text>
                  <Text className="text-white text-xs mt-1">Add a new expense record</Text>
                </View>
                <TouchableOpacity onPress={() => setShowExpenseForm(false)} className="bg-orange-100 p-2 rounded-full">
                  <X size={20} color="#f97316" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}>
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
      <FAB onPress={() => setShowExpenseForm(true)} style={{ bottom: 32 }} />
    </View>
  );
}
