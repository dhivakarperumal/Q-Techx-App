import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

const OFFICE_LAT = 12.479818640954804;
const OFFICE_LNG = 78.57369573005468;
const ALLOWED_RADIUS_METERS = 500;

type AttendanceRecord = {
  id?: number | string;
  date?: string;
  attendance_date?: string;
  attendance_status?: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  working_hours?: string;
  late_entry?: string;
  early_exit?: string;
  overtime?: string;
  location?: string | null;
};

const getEmployeeReference = (user: Record<string, unknown> | null) => {
  if (!user) return null;
  const values = [
    user.employee_id,
    user.employeeId,
    user.user_id,
    user.userId,
    user.uuid,
    user.id,
    user._id,
  ].filter(Boolean).map(String);
  return values.find((value) => value.length > 20) || values[0] || null;
};

const getLocalDateKey = (value: string | Date = new Date()) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371e3;
  const firstLatitude = (lat1 * Math.PI) / 180;
  const secondLatitude = (lat2 * Math.PI) / 180;
  const latitudeDelta = ((lat2 - lat1) * Math.PI) / 180;
  const longitudeDelta = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getTimeMinutes = (value?: string | null) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 3600)).padStart(2, "0")}h ${String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0")}m ${String(safeSeconds % 60).padStart(2, "0")}s`;
};

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [approvedLeaveToday, setApprovedLeaveToday] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [now, setNow] = useState(new Date());

  const todayKey = getLocalDateKey();
  const employeeId = getEmployeeReference(user);

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    if (!employeeId) {
      setError("Could not identify your employee profile.");
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const currentDate = new Date();
      const [attendanceResponse, leaveResponse, eventsResponse] = await Promise.all([
        api.get(`/attendance/${employeeId}?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`),
        api.get("/employee-leaves/my-leaves"),
        api.get("/events"),
      ]);
      const records: AttendanceRecord[] = attendanceResponse.data?.data || [];
      setHistory([...records].sort((a, b) => new Date(b.date || b.attendance_date || 0).getTime() - new Date(a.date || a.attendance_date || 0).getTime()));
      setTodayRecord(records.find((record) => getLocalDateKey(record.date || record.attendance_date) === todayKey) || null);

      const leaves: { status?: string; from_date?: string; to_date?: string }[] = Array.isArray(leaveResponse.data?.data) ? leaveResponse.data.data : [];
      setApprovedLeaveToday(leaves.some((leave) => leave.status === "Approved" && getLocalDateKey(leave.from_date) <= todayKey && getLocalDateKey(leave.to_date || leave.from_date) >= todayKey));
      const events: { eventType?: string; startDate?: string; endDate?: string }[] = Array.isArray(eventsResponse.data) ? eventsResponse.data : eventsResponse.data?.data || [];
      setTodayHoliday(events.some((event) => String(event.eventType).toLowerCase() === "holiday" && getLocalDateKey(event.startDate) <= todayKey && getLocalDateKey(event.endDate || event.startDate) >= todayKey));
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load your attendance.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employeeId, todayKey]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDuration = useMemo(() => {
    if (!todayRecord?.check_in_time) return "00h 00m 00s";
    const startMinutes = getTimeMinutes(todayRecord.check_in_time);
    if (startMinutes === null) return "00h 00m 00s";
    const endMinutes = todayRecord.check_out_time ? getTimeMinutes(todayRecord.check_out_time) : now.getHours() * 60 + now.getMinutes();
    if (endMinutes === null) return "00h 00m 00s";
    let seconds = Math.max(0, endMinutes - startMinutes) * 60;
    const breakStart = getTimeMinutes(todayRecord.break_start_time);
    const breakEnd = getTimeMinutes(todayRecord.break_end_time) ?? (todayRecord.break_start_time && !todayRecord.check_out_time ? now.getHours() * 60 + now.getMinutes() : null);
    if (breakStart !== null && breakEnd !== null) seconds -= Math.max(0, breakEnd - breakStart) * 60;
    return formatDuration(seconds);
  }, [now, todayRecord]);

  const status = !todayRecord ? "Offline" : todayRecord.check_out_time ? todayRecord.attendance_status || "Present" : todayRecord.break_start_time && !todayRecord.break_end_time ? "On Break" : "Working";
  const presentDays = history.filter((record) => record.attendance_status === "Present").length;
  const canClockIn = !todayRecord?.check_in_time && !todayHoliday && !approvedLeaveToday && distance !== null && distance <= ALLOWED_RADIUS_METERS;

  const handleLocation = async () => {
    try {
      setLocationLoading(true);
      setError("");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Location permission is required to verify your office location.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const currentDistance = getDistanceInMeters(current.coords.latitude, current.coords.longitude, OFFICE_LAT, OFFICE_LNG);
      setDistance(currentDistance);
      setLocationText(`Latitude: ${current.coords.latitude.toFixed(6)}\nLongitude: ${current.coords.longitude.toFixed(6)}`);
      if (currentDistance > ALLOWED_RADIUS_METERS) setError(`You are ${Math.round(currentDistance)}m away. You must be within ${ALLOWED_RADIUS_METERS}m of the office.`);
    } catch {
      setError("Unable to fetch your location. Please enable location services and try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const executeAction = async (endpoint: string) => {
    if (!employeeId) return;
    if (endpoint === "/attendance/clock-in") {
      if (todayHoliday) return setError("Attendance cannot be marked on a holiday.");
      if (approvedLeaveToday) return setError("Attendance cannot be marked while approved leave exists for today.");
      if (!canClockIn) return setError(`You must verify your location within ${ALLOWED_RADIUS_METERS}m of the office before clocking in.`);
    }
    try {
      setActionLoading(true);
      setError("");
      const response = await api({ method: endpoint === "/attendance/clock-in" ? "post" : "put", url: endpoint, data: { employee_id: employeeId, location: locationText } });
      setSuccessMessage(response.data?.message || "Attendance updated successfully.");
      await fetchAttendance(true);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (requestError: any) {
      setError(requestError?.message || "Could not update attendance.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Attendance" subtitle="Your time and presence" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAttendance(true)} tintColor="#2563eb" />}>
        <View className="flex-row items-start justify-between"><View><Text className="text-3xl font-bold text-slate-950">Attendance</Text><Text className="mt-2 text-base text-slate-500">Mark your shift and review attendance history.</Text></View><Pressable onPress={() => fetchAttendance(true)} accessibilityLabel="Refresh attendance"><Ionicons name="refresh-outline" size={22} color="#64748b" /></Pressable></View>
        {successMessage ? <View className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><Text className="text-sm font-semibold text-emerald-700">{successMessage}</Text></View> : null}
        {error ? <View className="mt-4 flex-row rounded-2xl border border-rose-200 bg-rose-50 p-4"><Ionicons name="alert-circle-outline" size={18} color="#e11d48" /><Text className="ml-2 flex-1 text-sm text-rose-700">{error}</Text></View> : null}
        {todayHoliday ? <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><Text className="text-sm font-semibold text-amber-800">Today is a holiday. Attendance is blocked.</Text></View> : null}
        {approvedLeaveToday ? <View className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"><Text className="text-sm font-semibold text-orange-800">Approved leave exists for today. Attendance is blocked.</Text></View> : null}

        <View className="mt-6 rounded-3xl bg-slate-900 p-5"><View className="flex-row items-center justify-between"><View><Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Live status</Text><Text className="mt-2 text-2xl font-black text-white">{status}</Text></View><View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20"><Ionicons name="time-outline" size={26} color="#60a5fa" /></View></View><Text className="mt-5 text-center text-4xl font-black tracking-wider text-white">{liveDuration}</Text><Text className="mt-2 text-center text-xs text-slate-400">Working duration today</Text><View className="mt-5 flex-row gap-3">{!todayRecord?.check_in_time ? <Pressable onPress={() => executeAction("/attendance/clock-in")} disabled={actionLoading || !canClockIn} className="flex-1 items-center rounded-2xl bg-emerald-500 py-3 disabled:opacity-40"><Text className="font-bold text-white">{actionLoading ? "Updating..." : "Clock In"}</Text></Pressable> : !todayRecord.check_out_time ? <><Pressable onPress={() => executeAction(todayRecord.break_start_time && !todayRecord.break_end_time ? "/attendance/break-end" : "/attendance/break-start")} disabled={actionLoading || Boolean(todayRecord.break_end_time)} className="flex-1 items-center rounded-2xl bg-orange-500 py-3 disabled:opacity-50"><Text className="font-bold text-white">{todayRecord.break_start_time && !todayRecord.break_end_time ? "End Break" : todayRecord.break_end_time ? "Break Done" : "Start Break"}</Text></Pressable><Pressable onPress={() => executeAction("/attendance/clock-out")} disabled={actionLoading || Boolean(todayRecord.break_start_time && !todayRecord.break_end_time)} className="flex-1 items-center rounded-2xl bg-rose-500 py-3 disabled:opacity-40"><Text className="font-bold text-white">Clock Out</Text></Pressable></> : <View className="flex-1 items-center rounded-2xl bg-white/10 py-3"><Text className="font-bold text-slate-300">Shift Completed</Text></View>}</View></View>

        {!todayRecord?.check_in_time && <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><Text className="text-base font-bold text-slate-900">Office verification</Text><Text className="mt-1 text-sm text-slate-500">You must be within {ALLOWED_RADIUS_METERS}m of the office to clock in.</Text><Pressable onPress={handleLocation} disabled={locationLoading || todayHoliday || approvedLeaveToday} className="mt-4 flex-row items-center justify-center rounded-xl border border-blue-200 bg-blue-50 py-3 disabled:opacity-50">{locationLoading ? <ActivityIndicator color="#2563eb" /> : <><Ionicons name="location-outline" size={18} color="#2563eb" /><Text className="ml-2 font-bold text-blue-700">{distance === null ? "Verify my location" : `${Math.round(distance)}m from office`}</Text></>}</Pressable>{locationText ? <Text className="mt-3 text-xs text-slate-500">{locationText}</Text> : null}</View>}

        {/* ── STATS SECTION ── */}
        <View className="mt-6 mb-6 flex-row flex-wrap justify-between">
          {[
            { label: "Total Records", value: String(history.length), sub: "All Logs", icon: "document-text", color: "#f97316", bg: "#fff7ed", subColor: "text-orange-500" },
            { label: "Present", value: String(presentDays), sub: "On Time", icon: "checkmark-circle", color: "#f97316", bg: "#fff7ed", subColor: "text-emerald-500" },
            { label: "Absent/Leave", value: String(Math.max(history.length - presentDays, 0)), sub: "Missed", icon: "close-circle", color: "#f97316", bg: "#fff7ed", subColor: "text-red-500" },
          ].map((stat, idx) => (
            <View
              key={idx}
              className={`mb-3 ${idx === 2 ? "w-full" : "w-[48%]"} overflow-hidden rounded-2xl bg-white border border-orange-100`}
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
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
            </View>
          ))}
        </View>
        <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-slate-400">This month</Text>
        {loading ? <ActivityIndicator color="#2563eb" /> : history.length === 0 ? <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8"><Ionicons name="calendar-outline" size={28} color="#94a3b8" /><Text className="mt-3 text-sm text-slate-500">No attendance records found.</Text></View> : <View className="gap-3">{history.map((record, index) => <View key={record.id || index} className="rounded-2xl border border-slate-200 bg-white p-4"><View className="flex-row items-start justify-between"><View className="flex-1"><Text className="text-base font-bold text-slate-900">{formatDate(record.date || record.attendance_date)}</Text><Text className="mt-1 text-sm text-slate-500">{record.check_in_time || "--"} - {record.check_out_time || (getLocalDateKey(record.date || record.attendance_date) === todayKey ? "In progress" : "--")}</Text></View><Text className={`text-sm font-bold ${record.attendance_status === "Present" ? "text-emerald-600" : "text-rose-600"}`}>{record.attendance_status || "-"}</Text></View><View className="mt-3 flex-row justify-between border-t border-slate-100 pt-3"><Text className="text-xs text-slate-500">Working: {record.working_hours || (getLocalDateKey(record.date || record.attendance_date) === todayKey ? liveDuration : "--")}</Text><Text className="text-xs text-slate-500">Late: {record.late_entry || "No"}</Text></View></View>)}</View>}
      </ScrollView>
      <BottomHome />
    </View>
  );
}
