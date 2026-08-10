import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

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

function SummaryCard({ label, value, icon, color, background }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; background: string }) {
  return <View className="w-[47.5%] rounded-2xl border border-slate-200 bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: background }}><Ionicons name={icon} size={20} color={color} /></View><Text className="mt-3 text-lg font-black text-slate-900">{value}</Text><Text className="mt-1 text-xs text-slate-500">{label}</Text></View>;
}

function DetailRow({ label, value, color = "#0f172a" }: { label: string; value: string; color?: string }) {
  return <View className="flex-row items-center justify-between py-2"><Text className="flex-1 text-sm text-slate-500">{label}</Text><Text className="text-sm font-bold" style={{ color }}>{value}</Text></View>;
}

export default function PayrollScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  return <View className="flex-1 bg-slate-50">
    <TopHeader title="PayRole" subtitle="Salary & payroll details" />
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#2563eb" />}>
      <Text className="text-3xl font-black text-slate-950">PayRole</Text>
      <Text className="mt-2 text-base text-slate-500">Your salary slips and payment breakdown.</Text>
      {loading ? <View className="items-center py-24"><ActivityIndicator size="large" color="#16a34a" /><Text className="mt-3 text-sm text-slate-500">Loading your payroll...</Text></View> : error ? <View className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5"><Text className="font-semibold text-rose-700">{error}</Text><Pressable onPress={() => fetchHistory()} className="mt-4 self-start rounded-xl bg-rose-600 px-4 py-2"><Text className="font-bold text-white">Try again</Text></Pressable></View> : sortedHistory.length === 0 ? <View className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6"><Ionicons name="cash-outline" size={32} color="#94a3b8" style={{ alignSelf: "center" }} /><Text className="mt-3 text-center font-semibold text-slate-600">No payroll records found</Text><Text className="mt-1 text-center text-sm text-slate-400">Your salary details will appear here after payroll is processed.</Text></View> : <>
        <View className="mt-5 rounded-3xl bg-emerald-600 p-5" style={{ shadowColor: "#16a34a", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
          <Text className="text-sm font-semibold text-emerald-100">Latest salary {employeeName ? `· ${employeeName}` : ""}</Text>
          <Text className="mt-2 text-sm font-semibold text-emerald-100">{monthYear(latest)}</Text>
          <Text className="mt-1 text-4xl font-black text-white">{amount(latest.total_salary)}</Text>
          <Text className="mt-1 text-xs text-emerald-100">Net pay after deductions</Text>
        </View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Latest breakdown</Text>
        <View className="flex-row flex-wrap justify-between gap-y-3"><SummaryCard label="Basic Salary" value={amount(latest.basic_salary)} icon="wallet-outline" color="#2563eb" background="#eff6ff" /><SummaryCard label="Present Days" value={String(latest.present_days ?? 0)} icon="calendar-outline" color="#16a34a" background="#f0fdf4" /><SummaryCard label="Deductions" value={amount(totalDeductions)} icon="remove-circle-outline" color="#dc2626" background="#fef2f2" /><SummaryCard label="Incentive" value={amount(latest.incentive_amount)} icon="gift-outline" color="#7c3aed" background="#f5f3ff" /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Latest salary details</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4"><DetailRow label="Basic Salary" value={amount(latest.basic_salary)} /><DetailRow label={`Leave Deduction (${latest.leave_days ?? 0} days)`} value={`- ${amount(latest.leave_deduction)}`} color="#dc2626" /><DetailRow label="Additional Deduction" value={`- ${amount(latest.additional_deduction)}`} color="#dc2626" /><DetailRow label={`Incentive (${latest.incentive_percentage ?? 0}%)`} value={`+ ${amount(latest.incentive_amount)}`} color="#16a34a" /><View className="my-2 border-t border-slate-100" /><DetailRow label="Net Pay" value={amount(latest.total_salary)} color="#059669" /></View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">Payslip history</Text>
        <View className="gap-3">{sortedHistory.map((record) => <View key={record.id} className="flex-row items-center rounded-2xl border border-slate-200 bg-white p-4"><View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><Ionicons name="document-text-outline" size={22} color="#16a34a" /></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{monthYear(record)}</Text><Text className="mt-1 text-xs text-slate-500">Basic {amount(record.basic_salary)} · Present {record.present_days ?? 0} days</Text></View><View className="items-end"><Text className="font-black text-slate-900">{amount(record.total_salary)}</Text><Text className="mt-1 text-xs font-bold text-emerald-600">Paid</Text></View></View>)}</View>
      </>}
    </ScrollView>
    <BottomHome />
  </View>;
}
