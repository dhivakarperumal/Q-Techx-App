import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

const payslips = [
  {
    month: "July 2025",
    gross: "₹52,000",
    net: "₹44,800",
    status: "Paid",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
  },
  {
    month: "June 2025",
    gross: "₹52,000",
    net: "₹44,800",
    status: "Paid",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
  },
  {
    month: "May 2025",
    gross: "₹50,000",
    net: "₹43,200",
    status: "Paid",
    statusColor: "#16a34a",
    statusBg: "#f0fdf4",
  },
];

const summary = [
  { label: "Basic Salary", value: "₹32,000", icon: "wallet-outline" as const },
  { label: "HRA", value: "₹8,000", icon: "home-outline" as const },
  { label: "Allowances", value: "₹12,000", icon: "gift-outline" as const },
  { label: "Deductions", value: "₹7,200", icon: "remove-circle-outline" as const },
];

export default function PayrollScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <TopHeader title="PayRole" subtitle="Salary & payroll details" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>
          PayRole
        </Text>
        <Text style={{ marginTop: 6, fontSize: 15, color: "#64748b" }}>
          Your salary slips and payment breakdown.
        </Text>

        {/* Current Month Card */}
        <View
          style={{
            marginTop: 20,
            borderRadius: 20,
            backgroundColor: "#16a34a",
            padding: 20,
            shadowColor: "#16a34a",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ color: "#bbf7d0", fontSize: 13, fontWeight: "600" }}>
            Current Month — July 2025
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 34,
              fontWeight: "800",
              marginTop: 6,
            }}
          >
            ₹44,800
          </Text>
          <Text style={{ color: "#bbf7d0", fontSize: 13, marginTop: 2 }}>
            Net Pay after deductions
          </Text>
        </View>

        {/* Breakdown */}
        <Text
          style={{
            marginTop: 24,
            marginBottom: 12,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Breakdown
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {summary.map((item) => (
            <View
              key={item.label}
              style={{
                width: "47.5%",
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                padding: 14,
              }}
            >
              <Ionicons name={item.icon} size={20} color="#16a34a" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#0f172a",
                  marginTop: 8,
                }}
              >
                {item.value}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Payslip History */}
        <Text
          style={{
            marginTop: 24,
            marginBottom: 12,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Payslip History
        </Text>
        <View style={{ gap: 10 }}>
          {payslips.map((slip) => (
            <View
              key={slip.month}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#f0fdf4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="document-text-outline" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}
                >
                  {slip.month}
                </Text>
                <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  Gross: {slip.gross}
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#0f172a",
                    textAlign: "right",
                  }}
                >
                  {slip.net}
                </Text>
                <View
                  style={{
                    marginTop: 4,
                    backgroundColor: slip.statusBg,
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: slip.statusColor,
                    }}
                  >
                    {slip.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomHome />
    </View>
  );
}
