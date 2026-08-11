import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Platform } from "react-native";
import { Receipt, DollarSign, PlusCircle, X, Download } from "lucide-react-native";
import api from "../../api";

export default function ExpensesTab() {
  const [fund, setFund] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [showFundForm, setShowFundForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
          expense_type: "",
          date_of_payment: "",
          amount: "",
          payment_type: "",
          paid_to: "",
          description: "",
          invoice_number: "",
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

  const filteredSpendEntries = expenses.filter((exp) => !isCreditEntry(exp));
  const totalSpent = filteredSpendEntries.reduce((acc, exp) => acc + parseFloat(exp.amount || 0), 0);

  return (
    <View className="flex-1 bg-[#111318] p-4">
      {/* ── Stats Overview ── */}
      <View className="flex-row justify-between mb-4 gap-2">
        {/* Available Fund Stat */}
        <View className="flex-1 bg-white/5 border border-emerald-500/20 rounded-2xl p-4 overflow-hidden relative">
          <View className="flex-row items-center gap-3 mb-2 z-10">
            <View className="w-10 h-10 rounded-xl bg-emerald-500/15 items-center justify-center">
              <DollarSign size={18} color="#34d399" />
            </View>
            <View>
              <Text className="text-white/50 text-[10px] uppercase font-semibold">Available Fund</Text>
              <Text className="text-xl font-bold text-emerald-400 mt-1">₹ {fund.toFixed(2)}</Text>
            </View>
          </View>
          
          <View className="mt-4 z-10">
            {!showFundForm ? (
              <TouchableOpacity
                onPress={() => setShowFundForm(true)}
                className="bg-emerald-500/10 px-3 py-2 rounded-lg self-start"
              >
                <Text className="text-xs font-semibold text-emerald-400">Update Fund</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-white"
                  placeholder="Amount"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                  value={fundAmount}
                  onChangeText={setFundAmount}
                />
                <TouchableOpacity onPress={handleUpdateFund} className="bg-emerald-500 px-3 py-1.5 rounded-lg justify-center">
                  <Text className="text-white text-xs font-semibold">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFundForm(false)} className="bg-white/10 px-3 py-1.5 rounded-lg justify-center">
                  <Text className="text-white/60 text-xs">X</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Total Spent Stat */}
        <View className="flex-1 bg-white/5 border border-rose-500/20 rounded-2xl p-4 overflow-hidden relative">
          <View className="flex-row items-center gap-3 z-10">
            <View className="w-10 h-10 rounded-xl bg-rose-500/15 items-center justify-center">
              <Receipt size={18} color="#fb7185" />
            </View>
            <View>
              <Text className="text-white/50 text-[10px] uppercase font-semibold">Total Spent</Text>
              <Text className="text-xl font-bold text-rose-400 mt-1">₹ {totalSpent.toFixed(2)}</Text>
            </View>
          </View>
          <Text className="text-[10px] text-white/30 mt-4 z-10">{expenses.length} transactions.</Text>
        </View>
      </View>

      {/* Add Expense Button */}
      <TouchableOpacity
        onPress={() => setShowExpenseForm(true)}
        className="flex-row items-center justify-center gap-2 bg-[#f97316] py-3 rounded-xl mb-4"
      >
        <PlusCircle size={18} color="#fff" />
        <Text className="text-white text-sm font-semibold">Add Expense</Text>
      </TouchableOpacity>

      {/* Expenses List */}
      <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : expenses.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6 py-10">
            <Receipt size={40} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/40 text-sm mt-3">No expenses recorded</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 10 }}>
            {expenses.map((exp, i) => {
              const isCredit = isCreditEntry(exp);
              return (
                <View key={exp.expense_id || i} className="flex-row items-center justify-between p-3 border-b border-white/5">
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-semibold text-sm">{exp.expense_type}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5">Paid to: {exp.paid_to}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5">
                      {new Date(exp.date_of_payment).toLocaleDateString()} • {exp.payment_type}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCredit ? '+' : '-'} ₹ {parseFloat(exp.amount).toFixed(2)}
                    </Text>
                    <Text className="text-[9px] text-white/30 mt-1">{isCredit ? 'Added' : 'Spent'}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Add Expense Modal */}
      <Modal visible={showExpenseForm} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/80 justify-center p-4">
          <View className="bg-[#111318] border border-white/10 rounded-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Record New Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseForm(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View>
                <Text className="text-white/50 text-xs mb-1">Expense Type</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="e.g. Office Rent"
                  placeholderTextColor="#666"
                  value={expenseData.expense_type}
                  onChangeText={(text) => setExpenseData({ ...expenseData, expense_type: text })}
                />
              </View>
              
              <View>
                <Text className="text-white/50 text-xs mb-1">Paid To</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="e.g. Amazon"
                  placeholderTextColor="#666"
                  value={expenseData.paid_to}
                  onChangeText={(text) => setExpenseData({ ...expenseData, paid_to: text })}
                />
              </View>

              <View>
                <Text className="text-white/50 text-xs mb-1">Date</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  value={expenseData.date_of_payment}
                  onChangeText={(text) => setExpenseData({ ...expenseData, date_of_payment: text })}
                />
              </View>

              <View>
                <Text className="text-white/50 text-xs mb-1">Amount (₹)</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={expenseData.amount}
                  onChangeText={(text) => setExpenseData({ ...expenseData, amount: text })}
                />
              </View>
              
              <View>
                <Text className="text-white/50 text-xs mb-1">Description</Text>
                <TextInput
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                  placeholder="Notes..."
                  placeholderTextColor="#666"
                  multiline
                  value={expenseData.description}
                  onChangeText={(text) => setExpenseData({ ...expenseData, description: text })}
                />
              </View>

              <TouchableOpacity
                onPress={handleAddExpense}
                className="bg-[#f97316] py-3 rounded-xl items-center mt-2"
              >
                <Text className="text-white font-bold">Submit Expense</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
