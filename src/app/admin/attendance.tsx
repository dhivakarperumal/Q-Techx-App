import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FAB } from "../../components/FAB";

type Employee = { employee_id: string | number; employee_code?: string; first_name?: string; last_name?: string };
type AttendanceRow = { employee_id?: string | number; employee_name?: string; employee_code?: string; today_status?: string; check_in_time?: string; check_out_time?: string; break_start_time?: string; break_end_time?: string; working_hours?: string; late_entry?: string; early_exit?: string; overtime?: string; present_days?: number; absent_days?: number; late_days?: number };
const filters = ["Today", "Yesterday", "This Week", "This Month", "Custom Date"];
const statuses = ["Present", "Absent", "Half Day", "Leave"];
const todayKey = () => new Date().toISOString().slice(0, 10);
const employeeName = (employee?: Employee) => `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() || employee?.employee_code || "Employee";
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };

function Stat({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; color: string }) {
  return (
    <View
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
            <Ionicons name={icon} size={20} color="#f97316" />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={2}>
              {label}
            </Text>
          </View>
        </View>
        <View className="mt-1 flex-col">
          <Text className="text-[22px] font-black text-black" numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function Field({ label, value, onChange, placeholder = "", keyboardType = "default" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric" }) {
  return <View className="mb-3"><Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#94a3b8" keyboardType={keyboardType} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900" /></View>;
}

function MarkAttendanceModal({ visible, employees, onClose, onSaved }: { visible: boolean; employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ employee_id: "", date: todayKey(), check_in_time: "", check_out_time: "", break_start_time: "", break_end_time: "", attendance_status: "Present", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { if (visible) setForm((current) => ({ ...current, date: todayKey() })); }, [visible]);
  useEffect(() => { let cancelled = false; if (!form.employee_id || !form.date) return; api.get(`/attendance/by-employee?employee_id=${form.employee_id}&date=${form.date}`).then((response) => { if (!cancelled && response.data?.attendance) setForm((current) => ({ ...current, ...response.data.attendance, date: form.date })); }).catch(() => { if (!cancelled) setForm((current) => ({ ...current, check_in_time: "", check_out_time: "", break_start_time: "", break_end_time: "", attendance_status: "Present", location: "", notes: "" })); }); return () => { cancelled = true; }; }, [form.employee_id, form.date]);
  const now = (key: string) => set(key, new Date().toTimeString().slice(0, 5));
  const save = async () => { if (!form.employee_id) return Alert.alert("Required field", "Please select an employee."); setSaving(true); try { await api.post("/attendance", form); Alert.alert("Saved", "Attendance recorded successfully."); onSaved(); onClose(); } catch (error: any) { Alert.alert("Unable to save attendance", error?.message || "Please try again."); } finally { setSaving(false); } };
  return <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}><View className="flex-1 bg-black/50 justify-end"><View className="bg-white rounded-t-3xl h-[85%] shadow-2xl overflow-hidden"><View className="bg-black pt-4 px-6 pb-6"><View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" /><View className="flex-row justify-between items-center"><View><Text className="text-orange-500 text-lg font-bold">Mark Attendance</Text><Text className="mt-1 text-xs text-white">Create or update an employee record.</Text></View><Pressable onPress={onClose} className="bg-orange-100 p-2 rounded-full"><Ionicons name="close" size={20} color="#f97316" /></Pressable></View></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-3 text-xs font-bold text-slate-500">Employee</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">{employees.map((employee) => <Pressable key={String(employee.employee_id)} onPress={() => set("employee_id", String(employee.employee_id))} className={`mr-2 rounded-full border px-3 py-2 ${form.employee_id === String(employee.employee_id) ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${form.employee_id === String(employee.employee_id) ? "text-orange-600" : "text-slate-500"}`}>{employeeName(employee)}</Text></Pressable>)}</ScrollView><Field label="Date (YYYY-MM-DD)" value={form.date} onChange={(value) => set("date", value)} /><Text className="mb-2 text-xs font-bold text-slate-500">Attendance Status</Text><View className="mb-3 flex-row flex-wrap gap-2">{statuses.map((status) => <Pressable key={status} onPress={() => set("attendance_status", status)} className={`rounded-full border px-3 py-2 ${form.attendance_status === status ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${form.attendance_status === status ? "text-orange-600" : "text-slate-500"}`}>{status}</Text></Pressable>)}</View>{[["check_in_time", "Check-in Time", "Check In"], ["check_out_time", "Check-out Time", "Check Out"], ["break_start_time", "Break Start Time", "Start Break"], ["break_end_time", "Break End Time", "End Break"]].map(([key, label, action]) => <View key={key} className="mb-1 flex-row items-end gap-2"><View className="flex-1"><Field label={label} value={form[key as keyof typeof form]} onChange={(value) => set(key, value)} /></View><Pressable onPress={() => now(key)} className="mb-3 rounded-xl bg-slate-900 px-3 py-3"><Text className="text-[10px] font-bold text-white">{action}</Text></Pressable></View>)}<Field label="Location" value={form.location} onChange={(value) => set("location", value)} /><Field label="Notes" value={form.notes} onChange={(value) => set("notes", value)} /><Pressable disabled={saving} onPress={save} className="mt-2 items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"><Text className="font-bold text-white">{saving ? "Saving..." : "Save / Update"}</Text></Pressable></View></ScrollView></View></View></Modal>;
}

export default function AdminAttendanceScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]); const [rows, setRows] = useState<AttendanceRow[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [filter, setFilter] = useState("Today"); const [customDate, setCustomDate] = useState(todayKey()); const [startDate, setStartDate] = useState(todayKey()); const [endDate, setEndDate] = useState(todayKey()); const [modalVisible, setModalVisible] = useState(false);
  const resolveDates = useCallback(() => { const now = new Date(); if (filter === "Today") return [todayKey(), todayKey()]; if (filter === "Yesterday") { const date = new Date(now); date.setDate(date.getDate() - 1); const value = date.toISOString().slice(0, 10); return [value, value]; } if (filter === "This Week") { const start = new Date(now); start.setDate(now.getDate() - now.getDay()); const end = new Date(start); end.setDate(start.getDate() + 6); return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]; } if (filter === "This Month") return [new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)]; return [customDate, customDate]; }, [filter, customDate]);
  useEffect(() => { const [start, end] = resolveDates(); setStartDate(start); setEndDate(end); }, [resolveDates]);
  const loadData = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); try { const [employeeResponse, summaryResponse] = await Promise.all([api.get("/employees?limit=200"), api.get(`/attendance/summary?startDate=${startDate}&endDate=${endDate}`)]); const employeeData = employeeResponse.data?.data || employeeResponse.data?.employees || []; setEmployees(employeeData); setRows(summaryResponse.data?.data || []); } catch (error: any) { Alert.alert("Unable to load attendance", error?.message || "Please try again."); } finally { setLoading(false); setRefreshing(false); } }, [startDate, endDate]);
  useEffect(() => { if (startDate && endDate) loadData(); }, [startDate, endDate, loadData]);
  const present = rows.filter((row) => row.today_status === "Present").length; const absent = rows.filter((row) => row.today_status === "Absent").length; const leave = rows.filter((row) => ["Leave", "On Leave"].includes(row.today_status || "")).length; const late = rows.filter((row) => row.late_entry && !["No", "0h 0m", "--"].includes(row.late_entry)).length; const singleDay = startDate === endDate;
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
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
            backgroundColor: "#f1f5f9",
            alignItems: "center", justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Attendance</Text>
      </View>
<ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#f97316" />}><View className="flex-row items-start justify-between mb-4"><View className="flex-1 pr-3"><Text className="text-3xl font-black text-slate-900">Attendance</Text><Text className="mt-1 text-sm text-slate-500">Overview of attendance and company metrics.</Text></View></View><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1 mb-5">{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} className={`mr-2 rounded-full border px-4 py-2.5 shadow-sm ${filter === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-sm font-bold ${filter === item ? "text-orange-600" : "text-slate-600"}`}>{item}</Text></Pressable>)}</ScrollView>{filter === "Custom Date" && <TextInput value={customDate} onChangeText={setCustomDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm" />}<View className="mb-6 flex-row flex-wrap justify-between pt-2"><Stat icon="people" label="Employees" value={employees.length} color="#f97316" /><Stat icon="person-add" label="Present" value={present} color="#f97316" /><Stat icon="person-remove" label="Absent" value={absent} color="#f97316" /><Stat icon="time" label="Late" value={late} color="#f97316" /></View><View className="mb-10"><View className="mb-4 flex-row items-center justify-between px-1"><View><Text className="text-lg font-black text-slate-900">{filter === "Today" ? "Today's" : filter} Timesheet</Text><Text className="mt-1 text-xs text-slate-500">{startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} - ${formatDate(endDate)}`}</Text></View><Text className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{singleDay ? "Live" : "Summary"}</Text></View>{loading ? <View className="items-center py-10 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}><ActivityIndicator color="#f97316" /><Text className="mt-2 text-sm text-slate-400">Loading attendance...</Text></View> : rows.length ? rows.map((row, index) => <View key={`${row.employee_id}-${index}`} className="mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm" style={{ shadowColor: "#f97316", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}><View className="flex-1"><View className="flex-row items-center justify-between"><View className="flex-1"><Text className="font-bold text-slate-900">{row.employee_name || "Employee"}</Text><Text className="mt-0.5 text-xs text-slate-500">{row.employee_code || ""}</Text></View><Text className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${row.today_status === "Present" ? "bg-orange-50 text-orange-600" : row.today_status === "On Leave" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{row.today_status || "Unknown"}</Text></View>{singleDay ? <View className="mt-3 flex-row flex-wrap gap-y-2"><Text className="w-1/2 text-xs font-semibold text-slate-600">In: <Text className="font-bold text-slate-900">{row.check_in_time || "--"}</Text></Text><Text className="w-1/2 text-xs font-semibold text-slate-600">Out: <Text className="font-bold text-slate-900">{row.check_out_time || "--"}</Text></Text><Text className="w-1/2 text-xs font-semibold text-slate-600">Hours: <Text className="font-bold text-slate-900">{row.working_hours || "--"}</Text></Text><Text className="w-1/2 text-xs font-semibold text-slate-600">Late: <Text className="font-bold text-orange-600">{row.late_entry || "--"}</Text></Text></View> : <View className="mt-3 flex-row gap-4"><Text className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Present: {row.present_days || 0}</Text><Text className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded">Absent: {row.absent_days || 0}</Text><Text className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Late: {row.late_days || 0}</Text></View>}</View></View>) : <View className="items-center py-10 bg-white rounded-2xl shadow-sm" style={{ shadowColor: "#cbd5e1", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}><Text className="text-sm text-slate-400">No attendance data available.</Text></View>}</View><View className="mt-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><Text className="mb-4 text-lg font-black text-slate-900">Attendance Overview</Text><View className="h-4 flex-row overflow-hidden rounded-full bg-slate-100"><View className="bg-orange-500" style={{ flex: present || 0.01 }} /><View className="bg-slate-300" style={{ flex: absent || 0.01 }} /><View className="bg-orange-300" style={{ flex: leave || 0.01 }} /></View><View className="mt-4 flex-row justify-between"><Text className="text-xs font-bold text-orange-600">Present {present}</Text><Text className="text-xs font-bold text-slate-500">Absent {absent}</Text><Text className="text-xs font-bold text-orange-400">Leave {leave}</Text></View></View></ScrollView><MarkAttendanceModal visible={modalVisible} employees={employees} onClose={() => setModalVisible(false)} onSaved={() => loadData(true)} /><FAB onPress={() => setModalVisible(true)} style={{ bottom: 32 }} /></SafeAreaView>;
}
