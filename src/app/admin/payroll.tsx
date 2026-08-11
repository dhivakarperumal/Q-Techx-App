import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExpensesTab from "../../components/payroll/ExpensesTab";

const tabs = ["Expenses", "Tab 2", "Tab 3", "Tab 4"];

const payslips = [
  { month: "July 2025", gross: "₹1,20,000", net: "₹98,500", status: "Paid", statusColor: "#16a34a", statusBg: "#f0fdf4" },
  { month: "June 2025", gross: "₹1,20,000", net: "₹98,500", status: "Paid", statusColor: "#16a34a", statusBg: "#f0fdf4" },
  { month: "May 2025", gross: "₹1,15,000", net: "₹94,200", status: "Paid", statusColor: "#16a34a", statusBg: "#f0fdf4" },
];

const summary = [
  { label: "Basic Salary", value: "₹70,000", icon: "wallet-outline" as const },
  { label: "HRA",          value: "₹20,000", icon: "home-outline" as const },
  { label: "Allowances",   value: "₹30,000", icon: "gift-outline" as const },
  { label: "Deductions",   value: "₹21,500", icon: "remove-circle-outline" as const },
];

function PlaceholderTab({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <Text style={{ fontSize: 16, color: "#64748b" }}>{title} Content Coming Soon</Text>
    </View>
  );
}

export default function AdminPayrollScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Expenses");

  const renderTabContent = () => {
    switch (activeTab) {
      case "Expenses":
        return <ExpensesTab />;
      case "Tab 2":
        return <PlaceholderTab title="Tab 2" />;
      case "Tab 3":
        return <PlaceholderTab title="Tab 3" />;
      case "Tab 4":
        return <PlaceholderTab title="Tab 4" />;
      default:
        return <ExpensesTab />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      {/* ── Back Header ── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: "#fff",
        borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: "#f1f5f9",
            alignItems: "center", justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Payroll</Text>
      </View>

      {/* ── Tabs Header ── */}
      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingVertical: 16,
                  marginRight: 24,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? "#f97316" : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? "700" : "600",
                  color: isActive ? "#f97316" : "#64748b",
                }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}
