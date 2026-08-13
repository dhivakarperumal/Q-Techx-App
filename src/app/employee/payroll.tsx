import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

type SalaryRecord = {
  id: number | string;
  employee_id?: string | number;
  first_name?: string;
  last_name?: string;
  salary_month: number;
  salary_year: number;
  basic_salary?: string | number;
  present_days?: string | number;
  leave_days?: string | number;
  leave_deduction?: string | number;
  incentive_percentage?: string | number;
  incentive_amount?: string | number;
  additional_deduction?: string | number;
  total_salary?: string | number;
  created_at?: string;
};

const employeeReferences = (user: Record<string, unknown> | null) => [
  user?.employee_id,
  user?.employeeId,
  user?.user_id,
  user?.userId,
  user?.id,
  user?._id,
  user?.uuid,
].filter(Boolean).map(String);

const amount = (value?: string | number) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const numberValue = (value?: string | number) => Number(value || 0);
const monthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString(undefined, { month: "long" });
const monthYear = (record: SalaryRecord) => `${monthName(Number(record.salary_month))} ${record.salary_year}`;

function SummaryCard({ label, value, icon, sub, subColor }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"]; sub?: string; subColor?: string }) {
  return (
    <View
      className="w-[48%] mb-3 overflow-hidden rounded-2xl bg-white border border-orange-100"
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
        style={{ paddingHorizontal: 12, paddingVertical: 14 }}
      >
        <View className="flex-col items-start mb-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-black mb-2">
            <Ionicons name={icon} size={16} color="#f97316" />
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <View className="flex-col items-start">
          <Text className="text-xl font-black text-black">
            {value}
          </Text>
          {sub && (
            <Text className={`text-[9px] font-bold ${subColor || "text-gray-400"}`}>
              {sub}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

function DetailRow({ label, value, color = "#0f172a" }: { label: string; value: string; color?: string }) {
  return <View className="flex-row items-center justify-between py-2"><Text className="flex-1 text-sm text-slate-500">{label}</Text><Text className="text-sm font-bold" style={{ color }}>{value}</Text></View>;
}

function PayslipModal({ record, onClose }: { record: SalaryRecord | null; onClose: () => void }) {
  if (!record) return null;
  const deductions = numberValue(record.leave_deduction) + numberValue(record.additional_deduction);
  const employeeName = [record.first_name, record.last_name].filter(Boolean).join(" ") || "Employee";

  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <View><Text className="text-lg font-black text-slate-900">Payslip</Text><Text className="mt-0.5 text-xs text-slate-500">{monthYear(record)}</Text></View>
        <Pressable onPress={onClose} accessibilityLabel="Close payslip" className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Ionicons name="close" size={22} color="#475569" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View
          className="overflow-hidden rounded-2xl border border-orange-100 bg-white"
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
            style={{
              paddingHorizontal: 14,
              paddingVertical: 16,
            }}
          >
            {/* Icon + Title */}
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-black">
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#f97316"
                  />
                </View>

                <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">
                  Salary Payslip
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  Payslip
                </Text>

                <Text className="mt-1 text-xs font-bold text-gray-500">
                  {monthYear(record)}
                </Text>
              </View>
            </View>

            {/* Employee */}
            <Text className="text-sm font-bold text-gray-600">
              {employeeName}
            </Text>

            {/* Net Pay */}
            <View className="mt-4 border-t border-orange-100 pt-4">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Net Pay
              </Text>

              <Text className="mt-1 text-3xl font-black text-black">
                {amount(record.total_salary)}
              </Text>

              <Text className="mt-1 text-[9px] font-bold text-orange-500">
                Credited{" "}
                {record.created_at
                  ? new Date(record.created_at).toLocaleDateString()
                  : "-"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Employee attendance</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4"><DetailRow label="Present Days" value={String(record.present_days ?? 0)} /><DetailRow label="Leave Days" value={String(record.leave_days ?? 0)} /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Earnings</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4"><DetailRow label="Basic Salary" value={amount(record.basic_salary)} /><DetailRow label={`Incentive (${record.incentive_percentage ?? 0}%)`} value={`+ ${amount(record.incentive_amount)}`} color="#f97316" /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Deductions</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4"><DetailRow label={`Leave Deduction (${record.leave_days ?? 0} days)`} value={`- ${amount(record.leave_deduction)}`} color="#dc2626" /><DetailRow label="Additional Deduction" value={`- ${amount(record.additional_deduction)}`} color="#dc2626" /><View className="my-2 border-t border-slate-100" /><DetailRow label="Total Deductions" value={amount(deductions)} color="#dc2626" /></View>
      </ScrollView>
    </View>
  </Modal>;
}

export default function PayrollScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryRecord | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    const references = employeeReferences(user);
    if (!references.length) {
      setError("Employee ID not found in your profile.");
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError("");
      const response = await api.get("/salary/history");
      const records: SalaryRecord[] = response.data?.data || [];
      setHistory(records.filter((record) => references.includes(String(record.employee_id))));
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to load salary details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()), [history]);
  const latest = sortedHistory[0];
  const totalDeductions = latest ? numberValue(latest.leave_deduction) + numberValue(latest.additional_deduction) : 0;
  const employeeName = latest ? [latest.first_name, latest.last_name].filter(Boolean).join(" ") : "";

  return <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: "#fff",
      borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
    }}>
      <Pressable
        onPress={() => router.back()}
        style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: "#f8fafc",
          alignItems: "center", justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="arrow-back" size={20} color="#0f172a" />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Payroll</Text>
    </View>
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#f97316" />}>
      {/* <Text className="text-3xl font-black text-slate-950">PayRole</Text> */}
      <Text className="mt-2 text-base text-slate-500">Your salary slips and payment breakdown.</Text>
      {loading ? <View className="items-center py-24"><ActivityIndicator size="large" color="#f97316" /><Text className="mt-3 text-sm text-slate-500">Loading your payroll...</Text></View> : error ? <View className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5"><Text className="font-semibold text-rose-700">{error}</Text><Pressable onPress={() => fetchHistory()} className="mt-4 self-start rounded-xl bg-rose-600 px-4 py-2"><Text className="font-bold text-white">Try again</Text></Pressable></View> : sortedHistory.length === 0 ? <View className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6"><Ionicons name="cash-outline" size={32} color="#94a3b8" style={{ alignSelf: "center" }} /><Text className="mt-3 text-center font-semibold text-slate-600">No payroll records found</Text><Text className="mt-1 text-center text-sm text-slate-400">Your salary details will appear here after payroll is processed.</Text></View> : <>
        <View
          className="mt-5 overflow-hidden rounded-2xl border border-orange-100 bg-white"
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
            style={{
              paddingHorizontal: 14,
              paddingVertical: 16,
            }}
          >
            {/* Icon + Label */}
            <View className="mb-3 flex-col items-start">
              <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-black">
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color="#f97316"
                />
              </View>

              <Text
                className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                numberOfLines={1}
              >
                Latest Salary
                {employeeName ? ` · ${employeeName}` : ""}
              </Text>
            </View>

            {/* Month + Salary */}
            <View className="flex-col items-start">
              <Text className="mb-1 text-[9px] font-bold text-gray-400">
                {monthYear(latest)}
              </Text>

              <Text className="text-2xl font-black text-black">
                {amount(latest.total_salary)}
              </Text>

              <Text className="mt-1 text-[9px] font-bold text-orange-500">
                Net pay after deductions
              </Text>
            </View>
          </LinearGradient>
        </View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Latest breakdown</Text>
        <View className="flex-row flex-wrap justify-between">
          <SummaryCard label="Basic Salary" value={amount(latest.basic_salary)} icon="wallet-outline" />
          <SummaryCard label="Present Days" value={String(latest.present_days ?? 0)} icon="calendar-outline" />
          <SummaryCard label="Deductions" value={amount(totalDeductions)} icon="remove-circle-outline" sub="Total" subColor="text-red-500" />
          <SummaryCard label="Incentive" value={amount(latest.incentive_amount)} icon="gift-outline" />
        </View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Latest salary details</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4"><DetailRow label="Basic Salary" value={amount(latest.basic_salary)} /><DetailRow label={`Leave Deduction (${latest.leave_days ?? 0} days)`} value={`- ${amount(latest.leave_deduction)}`} color="#dc2626" /><DetailRow label="Additional Deduction" value={`- ${amount(latest.additional_deduction)}`} color="#dc2626" /><DetailRow label={`Incentive (${latest.incentive_percentage ?? 0}%)`} value={`+ ${amount(latest.incentive_amount)}`} color="#f97316" /><View className="my-2 border-t border-slate-100" /><DetailRow label="Net Pay" value={amount(latest.total_salary)} color="#f97316" /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Payslip history</Text>
        <View className="gap-3">{sortedHistory.map((record) => <Pressable key={record.id} onPress={() => setSelectedPayslip(record)} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 active:bg-orange-50"><View className="h-11 w-11 items-center justify-center rounded-xl bg-orange-50"><Ionicons name="document-text-outline" size={22} color="#f97316" /></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{monthYear(record)}</Text><Text className="mt-1 text-xs text-slate-500">Basic {amount(record.basic_salary)} · Present {record.present_days ?? 0} days</Text></View><View className="items-end"><Text className="font-black text-slate-900">{amount(record.total_salary)}</Text><Text className="mt-1 text-xs font-bold text-orange-600">Paid</Text></View></Pressable>)}</View>
      </>}
    </ScrollView>
    <PayslipModal record={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
  </SafeAreaView>;
}
