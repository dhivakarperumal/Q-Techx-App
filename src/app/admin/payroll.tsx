import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function AdminPayrollScreen() {
  const router = useRouter();

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
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>PayRole</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Current Month Banner */}
        <View style={{
          borderRadius: 22, backgroundColor: "#16a34a", padding: 22,
          shadowColor: "#16a34a", shadowOpacity: 0.3, shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 }, elevation: 6,
        }}>
          <Text style={{ color: "#bbf7d0", fontSize: 13, fontWeight: "600" }}>
            Current Month — July 2025
          </Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 6 }}>
            ₹98,500
          </Text>
          <Text style={{ color: "#bbf7d0", fontSize: 13, marginTop: 2 }}>
            Net Pay after deductions
          </Text>
        </View>

        {/* Breakdown */}
        <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
          Breakdown
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {summary.map((item) => (
            <View key={item.label} style={{
              width: "47.5%", borderRadius: 16, backgroundColor: "#fff",
              borderWidth: 1, borderColor: "#e2e8f0", padding: 14,
            }}>
              <Ionicons name={item.icon} size={20} color="#16a34a" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginTop: 8 }}>{item.value}</Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Payslip History */}
        <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
          Payslip History
        </Text>
        <View style={{ gap: 10 }}>
          {payslips.map((slip) => (
            <View key={slip.month} style={{
              flexDirection: "row", alignItems: "center", borderRadius: 16,
              backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 14,
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="document-text-outline" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{slip.month}</Text>
                <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Gross: {slip.gross}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", textAlign: "right" }}>{slip.net}</Text>
                <View style={{ marginTop: 4, backgroundColor: slip.statusBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: slip.statusColor }}>{slip.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
