import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api";
import { FAB } from "../../components/FAB";

type Employee = {
  employee_id: string | number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  designation?: string;
};

type AttendanceRow = {
  employee_id?: string | number;
  employee_name?: string;
  employee_code?: string;
  today_status?: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  working_hours?: string;
  late_entry?: string;
  early_exit?: string;
  overtime?: string;
  present_days?: number;
  absent_days?: number;
  late_days?: number;
  location?: string;
  notes?: string;
};

type TimeFieldKey = "check_in_time" | "check_out_time" | "break_start_time" | "break_end_time";

const filters = ["Today", "Yesterday", "This Week", "This Month", "Custom Date"];
const statuses = ["Present", "Absent", "Half Day", "Leave"];

const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const employeeName = (employee?: Employee) =>
  `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
  employee?.employee_code ||
  "Employee";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "Select Date";
  const parts = value.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return value;
};

const format12HourTime = (timeStr?: string | null) => {
  if (!timeStr || !timeStr.trim() || timeStr === "--") return null;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (Number.isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const timeStringToDate = (timeStr?: string | null): Date => {
  const d = new Date();
  if (!timeStr || !timeStr.trim()) return d;
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
  }
  return d;
};

const dateStringToDate = (dateStr?: string | null): Date => {
  if (!dateStr || !dateStr.trim()) return new Date();
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
};

const calculateMetricsPreview = (
  checkIn?: string,
  checkOut?: string,
  breakStart?: string,
  breakEnd?: string
) => {
  const toMinutes = (t?: string) => {
    if (!t || !t.trim()) return null;
    const parts = t.trim().split(":").map(Number);
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  };

  const inM = toMinutes(checkIn);
  const outM = toMinutes(checkOut);
  const bsM = toMinutes(breakStart);
  const beM = toMinutes(breakEnd);

  let breakMinutes = 0;
  if (bsM !== null && beM !== null && beM > bsM) {
    breakMinutes = beM - bsM;
  }

  let grossMinutes = 0;
  if (inM !== null && outM !== null && outM >= inM) {
    grossMinutes = outM - inM;
  }

  const netMinutes = Math.max(0, grossMinutes - breakMinutes);

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h}h ${mins}m`;
  };

  return {
    gross: grossMinutes > 0 ? formatMin(grossMinutes) : "--",
    breakTime: breakMinutes > 0 ? formatMin(breakMinutes) : "--",
    net: grossMinutes > 0 ? formatMin(netMinutes) : "--",
    isLate: inM !== null && inM > 9 * 60 + 45, // after 9:45 AM
  };
};

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
}) {
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
            <Text
              className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        </View>
        <View className="mt-1 flex-col">
          <Text
            className="text-[22px] font-black text-black"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function TimePickerTile({
  label,
  value,
  icon,
  accentColor = "#f97316",
  bgColor = "bg-orange-50",
  borderColor = "border-orange-200",
  onPress,
  onNow,
  onClear,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  bgColor?: string;
  borderColor?: string;
  onPress: () => void;
  onNow: () => void;
  onClear: () => void;
}) {
  const formattedTime = format12HourTime(value);

  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View
            className={`h-7 w-7 items-center justify-center rounded-lg ${bgColor} mr-2`}
          >
            <Ionicons name={icon} size={15} color={accentColor} />
          </View>
          <Text className="text-xs font-bold text-slate-700">{label}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            onPress={onNow}
            activeOpacity={0.7}
            className="rounded-lg bg-slate-900 px-2.5 py-1"
          >
            <Text className="text-[10px] font-bold text-white">Now</Text>
          </TouchableOpacity>
          {value ? (
            <TouchableOpacity
              onPress={onClear}
              activeOpacity={0.7}
              className="rounded-lg bg-rose-50 px-2 py-1 border border-rose-200"
            >
              <Ionicons name="close" size={12} color="#e11d48" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`flex-row items-center justify-between rounded-xl border ${
          value ? `${borderColor} ${bgColor}` : "border-slate-200 bg-slate-50"
        } px-3.5 py-3`}
      >
        <View className="flex-row items-center">
          <Ionicons
            name={value ? "time" : "time-outline"}
            size={18}
            color={value ? accentColor : "#94a3b8"}
          />
          <Text
            className={`ml-2 text-sm font-black ${
              value ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {formattedTime || "Tap to select time"}
          </Text>
        </View>
        {value ? (
          <View className="rounded-md bg-white px-2 py-0.5 border border-slate-200">
            <Text className="text-[10px] font-extrabold text-slate-600">{value}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        )}
      </TouchableOpacity>
    </View>
  );
}

function MarkAttendanceModal({
  visible,
  employees,
  initialEmployeeId,
  initialDate,
  onClose,
  onSaved,
}: {
  visible: boolean;
  employees: Employee[];
  initialEmployeeId?: string;
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: "",
    date: getTodayKey(),
    check_in_time: "",
    check_out_time: "",
    break_start_time: "",
    break_end_time: "",
    attendance_status: "Present",
    location: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");

  // Active Picker State
  const [activePicker, setActivePicker] = useState<
    "date" | TimeFieldKey | null
  >(null);

  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Initialize form on open
  useEffect(() => {
    if (visible) {
      const selectedEmp = initialEmployeeId || (employees[0] ? String(employees[0].employee_id) : "");
      const selectedDt = initialDate || getTodayKey();
      setForm({
        employee_id: selectedEmp,
        date: selectedDt,
        check_in_time: "",
        check_out_time: "",
        break_start_time: "",
        break_end_time: "",
        attendance_status: "Present",
        location: "",
        notes: "",
      });
      setSearchEmployee("");
      setActivePicker(null);
    }
  }, [visible, initialEmployeeId, initialDate, employees]);

  // Fetch record when employee or date changes
  useEffect(() => {
    let cancelled = false;
    if (!visible || !form.employee_id || !form.date) return;

    setFetchingRecord(true);
    api
      .get(`/attendance/by-employee?employee_id=${form.employee_id}&date=${form.date}`)
      .then((response) => {
        if (!cancelled && response.data?.attendance) {
          const rec = response.data.attendance;
          setForm((current) => ({
            ...current,
            check_in_time: rec.check_in_time || "",
            check_out_time: rec.check_out_time || "",
            break_start_time: rec.break_start_time || "",
            break_end_time: rec.break_end_time || "",
            attendance_status: rec.attendance_status || "Present",
            location: rec.location || "",
            notes: rec.notes || "",
            date: form.date,
          }));
        } else if (!cancelled) {
          setForm((current) => ({
            ...current,
            check_in_time: "",
            check_out_time: "",
            break_start_time: "",
            break_end_time: "",
            attendance_status: "Present",
            location: "",
            notes: "",
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setForm((current) => ({
            ...current,
            check_in_time: "",
            check_out_time: "",
            break_start_time: "",
            break_end_time: "",
            attendance_status: "Present",
            location: "",
            notes: "",
          }));
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingRecord(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, form.employee_id, form.date]);

  const setNowTime = (field: TimeFieldKey) => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    set(field, `${hh}:${mm}`);
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
    field?: TimeFieldKey
  ) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
    }
    if (event.type === "set" && selectedDate && field) {
      const hh = String(selectedDate.getHours()).padStart(2, "0");
      const mm = String(selectedDate.getMinutes()).padStart(2, "0");
      set(field, `${hh}:${mm}`);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
    }
    if (event.type === "set" && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      set("date", `${year}-${month}-${day}`);
    }
  };

  const metrics = useMemo(
    () =>
      calculateMetricsPreview(
        form.check_in_time,
        form.check_out_time,
        form.break_start_time,
        form.break_end_time
      ),
    [form.check_in_time, form.check_out_time, form.break_start_time, form.break_end_time]
  );

  const filteredEmployees = useMemo(() => {
    if (!searchEmployee.trim()) return employees;
    const q = searchEmployee.toLowerCase();
    return employees.filter(
      (e) =>
        employeeName(e).toLowerCase().includes(q) ||
        (e.employee_code && e.employee_code.toLowerCase().includes(q))
    );
  }, [employees, searchEmployee]);

  const save = async () => {
    if (!form.employee_id) {
      return Alert.alert("Required field", "Please select an employee.");
    }
    if (!form.date) {
      return Alert.alert("Required field", "Please select an attendance date.");
    }
    setSaving(true);
    try {
      await api.post("/attendance", form);
      Alert.alert("Saved", "Attendance recorded successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to save attendance",
        error?.response?.data?.message || error?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployeeObj = employees.find(
    (e) => String(e.employee_id) === String(form.employee_id)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-black/60 justify-end"
      >
        <View className="bg-white rounded-t-3xl h-[92%] shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-black pt-4 px-6 pb-5">
            <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-orange-500 text-xl font-black">
                  Mark Attendance
                </Text>
                <Text className="mt-0.5 text-xs text-white/80">
                  Update employee punch & break times
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="bg-orange-500/20 p-2 rounded-full border border-orange-500/30"
              >
                <Ionicons name="close" size={20} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Employee Selection */}
            <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Select Employee
                </Text>
                {selectedEmployeeObj && (
                  <Text className="text-xs font-bold text-orange-600">
                    {selectedEmployeeObj.employee_code || ""}
                  </Text>
                )}
              </View>

              {employees.length > 5 && (
                <View className="mb-3 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Ionicons name="search" size={16} color="#94a3b8" />
                  <TextInput
                    value={searchEmployee}
                    onChangeText={setSearchEmployee}
                    placeholder="Search employee..."
                    placeholderTextColor="#94a3b8"
                    className="ml-2 flex-1 text-xs font-semibold text-slate-900"
                  />
                  {searchEmployee ? (
                    <TouchableOpacity onPress={() => setSearchEmployee("")}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pb-1"
              >
                {filteredEmployees.map((employee) => {
                  const isSelected =
                    String(form.employee_id) === String(employee.employee_id);
                  return (
                    <TouchableOpacity
                      key={String(employee.employee_id)}
                      onPress={() => set("employee_id", String(employee.employee_id))}
                      activeOpacity={0.75}
                      className={`mr-2.5 flex-row items-center rounded-full border px-3.5 py-2.5 shadow-sm ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <View
                        className={`mr-2 h-6 w-6 items-center justify-center rounded-full ${
                          isSelected ? "bg-orange-500" : "bg-slate-200"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${
                            isSelected ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {(employee.first_name || employee.employee_code || "E")
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-orange-600" : "text-slate-700"
                        }`}
                      >
                        {employeeName(employee)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Date Selection */}
            <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Attendance Date
                </Text>
                <View className="flex-row gap-1.5">
                  <TouchableOpacity
                    onPress={() => set("date", getTodayKey())}
                    className={`rounded-lg px-2.5 py-1 border ${
                      form.date === getTodayKey()
                        ? "bg-orange-500 border-orange-500"
                        : "bg-slate-100 border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        form.date === getTodayKey() ? "text-white" : "text-slate-600"
                      }`}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActivePicker("date")}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={18} color="#f97316" />
                  <Text className="ml-2.5 text-sm font-bold text-slate-900">
                    {formatDisplayDate(form.date)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="mr-1 text-xs font-bold text-slate-400">
                    {form.date}
                  </Text>
                  <Ionicons name="calendar" size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Attendance Status */}
            <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <Text className="mb-2.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Attendance Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statuses.map((status) => {
                  const isSelected = form.attendance_status === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => set("attendance_status", status)}
                      activeOpacity={0.75}
                      className={`flex-1 min-w-[75px] items-center rounded-2xl border py-2.5 ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? "text-orange-600" : "text-slate-600"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Pickers Section */}
            <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Punch & Break Time Pickers
                </Text>
                {fetchingRecord && (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#f97316" />
                    <Text className="ml-1 text-[10px] font-bold text-slate-400">
                      Loading...
                    </Text>
                  </View>
                )}
              </View>

              {/* Check-in Time Picker */}
              <TimePickerTile
                label="Check-in Time"
                value={form.check_in_time}
                icon="log-in-outline"
                accentColor="#10b981"
                bgColor="bg-emerald-50"
                borderColor="border-emerald-200"
                onPress={() => setActivePicker("check_in_time")}
                onNow={() => setNowTime("check_in_time")}
                onClear={() => set("check_in_time", "")}
              />

              {/* Check-out Time Picker */}
              <TimePickerTile
                label="Check-out Time"
                value={form.check_out_time}
                icon="log-out-outline"
                accentColor="#ef4444"
                bgColor="bg-rose-50"
                borderColor="border-rose-200"
                onPress={() => setActivePicker("check_out_time")}
                onNow={() => setNowTime("check_out_time")}
                onClear={() => set("check_out_time", "")}
              />

              {/* Break Start Time Picker */}
              <TimePickerTile
                label="Break Start Time"
                value={form.break_start_time}
                icon="cafe-outline"
                accentColor="#f59e0b"
                bgColor="bg-amber-50"
                borderColor="border-amber-200"
                onPress={() => setActivePicker("break_start_time")}
                onNow={() => setNowTime("break_start_time")}
                onClear={() => set("break_start_time", "")}
              />

              {/* Break End Time Picker */}
              <TimePickerTile
                label="Break End Time"
                value={form.break_end_time}
                icon="checkmark-done-circle-outline"
                accentColor="#6366f1"
                bgColor="bg-indigo-50"
                borderColor="border-indigo-200"
                onPress={() => setActivePicker("break_end_time")}
                onNow={() => setNowTime("break_end_time")}
                onClear={() => set("break_end_time", "")}
              />

              {/* Live Hours Calculation Card */}
              <View className="mt-2 rounded-2xl bg-slate-900 p-4">
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                  Calculated Duration Preview
                </Text>
                <View className="flex-row justify-between">
                  <View className="flex-1 items-center border-r border-slate-800">
                    <Text className="text-[10px] font-bold text-slate-400">
                      Total Hours
                    </Text>
                    <Text className="mt-1 text-sm font-black text-white">
                      {metrics.gross}
                    </Text>
                  </View>
                  <View className="flex-1 items-center border-r border-slate-800">
                    <Text className="text-[10px] font-bold text-amber-400">
                      Break Time
                    </Text>
                    <Text className="mt-1 text-sm font-black text-amber-300">
                      {metrics.breakTime}
                    </Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-[10px] font-bold text-emerald-400">
                      Net Working
                    </Text>
                    <Text className="mt-1 text-sm font-black text-emerald-300">
                      {metrics.net}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Location & Notes */}
            <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <Text className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Location
              </Text>
              <TextInput
                value={form.location}
                onChangeText={(val) => set("location", val)}
                placeholder="Office, Work From Home, Client Site..."
                placeholderTextColor="#94a3b8"
                className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-900"
              />

              <Text className="mb-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Notes
              </Text>
              <TextInput
                value={form.notes}
                onChangeText={(val) => set("notes", val)}
                placeholder="Optional notes or remarks..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-900"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              disabled={saving}
              onPress={save}
              activeOpacity={0.8}
              className="items-center rounded-2xl bg-orange-500 py-4 shadow-lg shadow-orange-500/30 disabled:opacity-50"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-sm font-black text-white uppercase tracking-wider">
                  Save Attendance Record
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* DateTime Picker Modals */}
          {activePicker === "date" && (
            <DateTimePicker
              value={dateStringToDate(form.date)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
              accentColor="#f97316"
            />
          )}

          {activePicker && activePicker !== "date" && (
            <DateTimePicker
              value={timeStringToDate(form[activePicker])}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) =>
                handleTimeChange(event, date, activePicker as TimeFieldKey)
              }
              accentColor="#f97316"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AdminAttendanceScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("Today");
  const [customDate, setCustomDate] = useState(getTodayKey());
  const [startDate, setStartDate] = useState(getTodayKey());
  const [endDate, setEndDate] = useState(getTodayKey());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<string>("");
  const [selectedDateForModal, setSelectedDateForModal] = useState<string>("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const resolveDates = useCallback(() => {
    const now = new Date();
    if (filter === "Today") return [getTodayKey(), getTodayKey()];
    if (filter === "Yesterday") {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      const yYear = date.getFullYear();
      const yMonth = String(date.getMonth() + 1).padStart(2, "0");
      const yDay = String(date.getDate()).padStart(2, "0");
      const value = `${yYear}-${yMonth}-${yDay}`;
      return [value, value];
    }
    if (filter === "This Week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const formatLocal = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
      return [formatLocal(start), formatLocal(end)];
    }
    if (filter === "This Month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const formatLocal = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
      return [formatLocal(start), formatLocal(end)];
    }
    return [customDate, customDate];
  }, [filter, customDate]);

  useEffect(() => {
    const [start, end] = resolveDates();
    setStartDate(start);
    setEndDate(end);
  }, [resolveDates]);

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [employeeResponse, summaryResponse] = await Promise.all([
          api.get("/employees?limit=200"),
          api.get(
            `/attendance/summary?startDate=${startDate}&endDate=${endDate}`
          ),
        ]);
        const employeeData =
          employeeResponse.data?.data || employeeResponse.data?.employees || [];
        setEmployees(employeeData);
        setRows(summaryResponse.data?.data || []);
      } catch (error: any) {
        Alert.alert(
          "Unable to load attendance",
          error?.response?.data?.message || error?.message || "Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startDate, endDate]
  );

  useEffect(() => {
    if (startDate && endDate) loadData();
  }, [startDate, endDate, loadData]);

  const toNumber = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const normalizeStatus = (value?: string | null) => {
    const status = String(value ?? "").trim();
    if (!status) return "";
    const clean = status.replace(/\s+\d+$/, "").trim();
    const normalized = clean.toLowerCase().replace(/_/g, " ");
    if (["present", "p"].includes(normalized)) return "Present";
    if (["absent", "a", "not present", "notpresent"].includes(normalized)) return "Absent";
    if (["leave", "on leave", "annual leave", "holiday"].includes(normalized)) return "Leave";
    if (["half day", "half-day", "halfday"].includes(normalized)) return "Half Day";
    return clean || status;
  };

  const getRowCount = (
    row: AttendanceRow,
    type: "present" | "absent" | "leave" | "late"
  ) => {
    const status = normalizeStatus(row.today_status);
    if (type === "present") {
      const count = toNumber((row as any).present_days);
      if (count > 0) return count;
      if (status === "Present") return 1;
      return 0;
    }
    if (type === "absent") {
      const count = toNumber((row as any).absent_days);
      if (count > 0) return count;
      if (status === "Absent") return 1;
      return 0;
    }
    if (type === "leave") {
      const count = toNumber((row as any).leave_days);
      if (count > 0) return count;
      if (["Leave", "On Leave"].includes(status)) return 1;
      return 0;
    }
    const count = toNumber((row as any).late_days);
    if (count > 0) return count;
    if (
      row.late_entry &&
      !["No", "0h 0m", "--", ""].includes(String(row.late_entry).trim())
    )
      return 1;
    return 0;
  };

  const present = rows.reduce((total, row) => total + getRowCount(row, "present"), 0);
  const absent = rows.reduce((total, row) => total + getRowCount(row, "absent"), 0);
  const leave = rows.reduce((total, row) => total + getRowCount(row, "leave"), 0);
  const late = rows.reduce((total, row) => total + getRowCount(row, "late"), 0);
  const singleDay = startDate === endDate;

  const handleOpenEditRow = (row: AttendanceRow) => {
    setSelectedEmployeeForModal(String(row.employee_id || ""));
    setSelectedDateForModal(singleDay ? startDate : getTodayKey());
    setModalVisible(true);
  };

  const handleOpenNewAttendance = () => {
    setSelectedEmployeeForModal("");
    setSelectedDateForModal(singleDay ? startDate : getTodayKey());
    setModalVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Top Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#f1f5f9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
          Attendance
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#f97316"
          />
        }
      >
        {/* Title */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-3xl font-black text-slate-900">Attendance</Text>
            <Text className="mt-1 text-sm text-slate-500">
              Overview of employee presence & timesheets.
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-1 mb-4"
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setFilter(item)}
              activeOpacity={0.8}
              className={`mr-2 rounded-full border px-4 py-2.5 shadow-sm ${
                filter === item
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  filter === item ? "text-orange-600" : "text-slate-600"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Date Picker Trigger */}
        {filter === "Custom Date" && (
          <TouchableOpacity
            onPress={() => setShowCustomDatePicker(true)}
            activeOpacity={0.8}
            className="mb-5 flex-row items-center justify-between rounded-2xl border border-orange-300 bg-orange-50/50 px-4 py-3.5 shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={18} color="#f97316" />
              <Text className="ml-2.5 text-sm font-bold text-slate-900">
                Selected Date: {formatDisplayDate(customDate)}
              </Text>
            </View>
            <View className="rounded-lg bg-orange-500 px-2.5 py-1">
              <Text className="text-[10px] font-black text-white">Change</Text>
            </View>
          </TouchableOpacity>
        )}

        {showCustomDatePicker && (
          <DateTimePicker
            value={dateStringToDate(customDate)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") setShowCustomDatePicker(false);
              if (event.type === "set" && selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const day = String(selectedDate.getDate()).padStart(2, "0");
                setCustomDate(`${year}-${month}-${day}`);
              }
            }}
            accentColor="#f97316"
          />
        )}

        {/* Stats Grid */}
        <View className="mb-6 flex-row flex-wrap justify-between pt-2">
          <Stat icon="people" label="Employees" value={employees.length} color="#f97316" />
          <Stat icon="person-add" label="Present" value={present} color="#f97316" />
          <Stat icon="person-remove" label="Absent" value={absent} color="#f97316" />
          <Stat icon="time" label="Late Entry" value={late} color="#f97316" />
        </View>

        {/* Timesheet List Header */}
        <View className="mb-10">
          <View className="mb-4 flex-row items-center justify-between px-1">
            <View>
              <Text className="text-lg font-black text-slate-900">
                {filter === "Today" ? "Today's" : filter} Timesheet
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                {startDate === endDate
                  ? formatDate(startDate)
                  : `${formatDate(startDate)} - ${formatDate(endDate)}`}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                {singleDay ? "Live Daily" : "Range Summary"}
              </Text>
            </View>
          </View>

          {loading ? (
            <View
              className="items-center py-12 bg-white rounded-3xl shadow-sm"
              style={{
                shadowColor: "#cbd5e1",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="mt-3 text-sm font-semibold text-slate-400">
                Loading attendance records...
              </Text>
            </View>
          ) : rows.length ? (
            rows.map((row, index) => {
              const statusClean = row.today_status || "Present";
              const isPresent = statusClean.toLowerCase() === "present";
              const isLeave = statusClean.toLowerCase().includes("leave");

              return (
                <TouchableOpacity
                  key={`${row.employee_id}-${index}`}
                  onPress={() => handleOpenEditRow(row)}
                  activeOpacity={0.85}
                  className="mb-3.5 rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
                  style={{
                    shadowColor: "#f97316",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="font-extrabold text-slate-900 text-base">
                        {row.employee_name || "Employee"}
                      </Text>
                      <Text className="mt-0.5 text-xs font-bold text-slate-400">
                        {row.employee_code || "EMP"}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                          isPresent
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : isLeave
                            ? "bg-orange-50 text-orange-600 border border-orange-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        {statusClean}
                      </Text>
                      <View className="h-7 w-7 rounded-full bg-slate-100 items-center justify-center">
                        <Ionicons name="pencil" size={13} color="#64748b" />
                      </View>
                    </View>
                  </View>

                  {singleDay ? (
                    <View className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <View className="flex-row flex-wrap gap-y-2.5">
                        <View className="w-1/2 flex-row items-center">
                          <Ionicons name="log-in-outline" size={14} color="#10b981" />
                          <Text className="ml-1 text-xs font-semibold text-slate-600">
                            In:{" "}
                            <Text className="font-black text-slate-900">
                              {format12HourTime(row.check_in_time) || row.check_in_time || "--"}
                            </Text>
                          </Text>
                        </View>

                        <View className="w-1/2 flex-row items-center">
                          <Ionicons name="log-out-outline" size={14} color="#ef4444" />
                          <Text className="ml-1 text-xs font-semibold text-slate-600">
                            Out:{" "}
                            <Text className="font-black text-slate-900">
                              {format12HourTime(row.check_out_time) || row.check_out_time || "--"}
                            </Text>
                          </Text>
                        </View>

                        <View className="w-1/2 flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#f97316" />
                          <Text className="ml-1 text-xs font-semibold text-slate-600">
                            Work:{" "}
                            <Text className="font-black text-slate-900">
                              {row.working_hours || "--"}
                            </Text>
                          </Text>
                        </View>

                        <View className="w-1/2 flex-row items-center">
                          <Ionicons name="cafe-outline" size={14} color="#f59e0b" />
                          <Text className="ml-1 text-xs font-semibold text-slate-600">
                            Break:{" "}
                            <Text className="font-black text-slate-900">
                              {row.break_start_time
                                ? `${row.break_start_time.slice(0, 5)} - ${
                                    row.break_end_time
                                      ? row.break_end_time.slice(0, 5)
                                      : "..."
                                  }`
                                : "--"}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="mt-3 flex-row gap-2">
                      <Text className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Present: {row.present_days || 0}
                      </Text>
                      <Text className="text-[10px] font-black bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
                        Absent: {row.absent_days || 0}
                      </Text>
                      <Text className="text-[10px] font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                        Late: {row.late_days || 0}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View
              className="items-center py-12 bg-white rounded-3xl shadow-sm border border-dashed border-slate-200"
            >
              <Ionicons name="calendar-outline" size={36} color="#cbd5e1" />
              <Text className="mt-2 text-sm font-bold text-slate-400">
                No attendance records found for this period.
              </Text>
            </View>
          )}
        </View>

        {/* Overview Bar */}
        <View className="mt-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <Text className="mb-4 text-base font-black text-slate-900">
            Attendance Distribution
          </Text>
          <View className="h-3.5 flex-row overflow-hidden rounded-full bg-slate-100">
            <View className="bg-emerald-500" style={{ flex: present || 0.01 }} />
            <View className="bg-rose-400" style={{ flex: absent || 0.01 }} />
            <View className="bg-amber-400" style={{ flex: leave || 0.01 }} />
          </View>
          <View className="mt-4 flex-row justify-between">
            <Text className="text-xs font-bold text-emerald-600">
              Present: {present}
            </Text>
            <Text className="text-xs font-bold text-rose-500">
              Absent: {absent}
            </Text>
            <Text className="text-xs font-bold text-amber-500">
              Leave: {leave}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Mark / Edit Attendance Modal */}
      <MarkAttendanceModal
        visible={modalVisible}
        employees={employees}
        initialEmployeeId={selectedEmployeeForModal}
        initialDate={selectedDateForModal}
        onClose={() => setModalVisible(false)}
        onSaved={() => loadData(true)}
      />

      {/* Floating Action Button */}
      <FAB onPress={handleOpenNewAttendance} style={{ bottom: 32 }} />
    </SafeAreaView>
  );
}
