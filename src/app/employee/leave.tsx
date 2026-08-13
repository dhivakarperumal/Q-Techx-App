import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../../api";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

type Leave = {
  id: number | string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  no_of_days?: string | number;
  day_type?: string;
  half_day_type?: string;
  reason?: string;
  status?: string;
  admin_reason?: string;
};

type LeaveSetting = {
  leave_type: string;
  max_days?: string | number;
  is_active?: string | number | boolean;
};

const fallbackLeaveTypes = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Work From Home",
  "Comp Off",
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const excludedFromBalance = (status?: string) =>
  ["rejected", "reject", "cancelled", "cancel"].includes(
    String(status || "").toLowerCase(),
  );

export default function EmployeeLeaveScreen() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [settings, setSettings] = useState<LeaveSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const formatPickerDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDefaultLeaveDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return {
      from_date: formatPickerDate(today),
      to_date: formatPickerDate(tomorrow),
    };
  };

  const [form, setForm] = useState({
    leave_type: "Casual Leave",
    from_date: getDefaultLeaveDates().from_date,
    to_date: getDefaultLeaveDates().to_date,
    day_type: "Full Day",
    half_day_type: "Morning",
    reason: "",
  });

  const fetchLeaveData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [leavesResponse, settingsResponse] = await Promise.all([
        api.get("/employee-leaves/my-leaves"),
        api.get("/leave-settings"),
      ]);
      setLeaves(leavesResponse.data?.data || []);
      setSettings(settingsResponse.data?.data || []);
    } catch {
      Alert.alert(
        "Unable to load leave data",
        "Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const leaveTypes = useMemo(
    () => [
      ...new Set([
        ...settings.map((item) => item.leave_type),
        ...fallbackLeaveTypes,
      ]),
    ],
    [settings],
  );
  const balances = useMemo(
    () =>
      settings
        .filter(
          (setting) =>
            Number(setting.is_active ?? 1) === 1 || setting.is_active === true,
        )
        .map((setting) => {
          const taken = leaves
            .filter(
              (leave) =>
                leave.leave_type === setting.leave_type &&
                !excludedFromBalance(leave.status),
            )
            .reduce((total, leave) => total + Number(leave.no_of_days || 0), 0);
          const total = Number(setting.max_days || 0);
          return {
            type: setting.leave_type,
            total,
            taken,
            remaining: Math.max(total - taken, 0),
          };
        }),
    [leaves, settings],
  );
  const filteredLeaves = useMemo(
    () =>
      leaves
        .filter(
          (leave) => statusFilter === "All" || leave.status === statusFilter,
        )
        .sort(
          (a, b) =>
            new Date(b.from_date || 0).getTime() -
            new Date(a.from_date || 0).getTime(),
        ),
    [leaves, statusFilter],
  );
  const totalAllowed = balances.reduce((total, item) => total + item.total, 0);
  const totalTaken = balances.reduce((total, item) => total + item.taken, 0);
  const updateForm = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submitLeave = async () => {
    if (!form.from_date || !form.to_date || !form.reason.trim()) {
      Alert.alert(
        "Incomplete request",
        "Please enter dates and a reason for your leave.",
      );
      return;
    }
    const from = new Date(`${form.from_date}T00:00:00`);
    const to = new Date(`${form.to_date}T00:00:00`);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      to < from
    ) {
      Alert.alert(
        "Invalid dates",
        "Use YYYY-MM-DD and make sure the end date is not before the start date.",
      );
      return;
    }
    const no_of_days =
      form.day_type === "Half Day"
        ? 0.5
        : Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
    const balance = balances.find((item) => item.type === form.leave_type);
    if (balance && no_of_days > balance.remaining) {
      Alert.alert(
        "Leave balance exceeded",
        `Only ${balance.remaining} day(s) remain for ${form.leave_type}.`,
      );
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/employee-leaves/apply", {
        ...form,
        to_date: form.day_type === "Half Day" ? form.from_date : form.to_date,
        no_of_days,
        half_day_type: form.day_type === "Half Day" ? form.half_day_type : null,
      });
      setShowApply(false);
      setForm({
        leave_type: leaveTypes[0] || "Casual Leave",
        from_date: getDefaultLeaveDates().from_date,
        to_date: getDefaultLeaveDates().to_date,
        day_type: "Full Day",
        half_day_type: "Morning",
        reason: "",
      });
      Alert.alert(
        "Request submitted",
        "Your leave request was sent for approval.",
      );
      fetchLeaveData(true);
    } catch (error: any) {
      Alert.alert(
        "Could not apply",
        error?.message || "Failed to apply leave.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <TopHeader title="Leave" subtitle="Requests and balances" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLeaveData(true)}
            tintColor="#2563eb"
          />
        }
      >
        {/* ── STATS SECTION ── */}
        <View className="mt-6 mb-6 px-4 flex-row justify-between">
          {[
            {
              label: "Allowed",
              value: String(totalAllowed),
              sub: "Total Days",
              icon: "calendar",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Taken",
              value: String(totalTaken),
              sub: "Used",
              icon: "time",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-orange-500",
            },
            {
              label: "Remaining",
              value: String(Math.max(totalAllowed - totalTaken, 0)),
              sub: "Available",
              icon: "checkmark-circle",
              color: "#f97316",
              bg: "#fff7ed",
              subColor: "text-emerald-500",
            },
          ].map((stat, idx) => (
            <View
              key={idx}
              className="w-[32%] overflow-hidden rounded-[22px] border border-slate-200 bg-[#f5f5f5]"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <LinearGradient
                colors={["#f5f5f5", "#f5f5f5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 10, paddingVertical: 14 }}
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#171717]">
                    <Ionicons
                      name={stat.icon as any}
                      size={18}
                      color="#f97316"
                    />
                  </View>
                  {idx === 2 && (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-[#22c55e]">
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>

                <Text
                  className="text-[10px] font-black uppercase tracking-[1.2px] text-slate-500"
                  numberOfLines={1}
                >
                  {stat.label}
                </Text>
                <Text className="mt-2 text-[28px] font-black text-slate-900">
                  {stat.value}
                </Text>
                <Text
                  className={`mt-1 text-[11px] font-semibold ${stat.subColor || "text-slate-500"}`}
                >
                  {stat.sub}
                </Text>
              </LinearGradient>
            </View>
          ))}
        </View>
        {balances.length > 0 && (
          <View className="mt-6 px-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Leave balance
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {balances.map((item) => (
                <View
                  key={item.type}
                  className="mr-3 w-40 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <Text className="font-bold text-slate-900" numberOfLines={1}>
                    {item.type}
                  </Text>
                  <Text className="mt-3 text-2xl font-black text-slate-900">
                    {item.remaining}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    of {item.total} remaining
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <View className="mt-7 flex-row items-center justify-between px-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Request history
          </Text>
          <Pressable
            onPress={() => fetchLeaveData(true)}
            accessibilityLabel="Refresh leave history"
          >
            <Ionicons name="refresh-outline" size={20} color="#64748b" />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 px-4"
        >
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              className={`mr-2 rounded-full border px-4 py-2 ${statusFilter === status ? "border-orange-600 bg-orange-600" : "border-slate-200 bg-white"}`}
            >
              <Text
                className={`text-xs font-bold ${statusFilter === status ? "text-white" : "text-slate-600"}`}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View className="mt-4 gap-3 px-4">
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : filteredLeaves.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8">
              <Ionicons name="calendar-outline" size={28} color="#94a3b8" />
              <Text className="mt-3 font-semibold text-slate-500">
                No leave requests found.
              </Text>
            </View>
          ) : (
            filteredLeaves.map((leave) => {
              const normalized = String(
                leave.status || "Pending",
              ).toLowerCase();
              const statusColor =
                normalized === "approved"
                  ? "#16a34a"
                  : normalized === "rejected"
                    ? "#e11d48"
                    : "#ea580c";
              const statusBg =
                normalized === "approved"
                  ? "#f0fdf4"
                  : normalized === "rejected"
                    ? "#fff1f2"
                    : "#fff7ed";
              return (
                <View
                  key={leave.id}
                  className="mb-4 overflow-hidden rounded-[24px] border border-orange-200 bg-white p-5"
                  style={{
                    shadowColor: "#f97316",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                    elevation: 4,
                  }}
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-orange-100">
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#f97316"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-black text-slate-900">
                          {leave.leave_type || "Leave"}
                        </Text>
                        <Text className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-slate-500">
                          {leave.day_type || "Full Day"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: statusBg,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: "800",
                          textTransform: "uppercase",
                        }}
                      >
                        {leave.status || "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <Text className="text-xs font-semibold text-slate-600">
                      {formatDate(leave.from_date)}
                      {leave.from_date !== leave.to_date
                        ? ` - ${formatDate(leave.to_date)}`
                        : ""}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-500">
                      {leave.no_of_days} day(s)
                    </Text>
                    {leave.day_type === "Half Day" && (
                      <Text className="text-xs font-bold text-orange-600">
                        {leave.half_day_type} half day
                      </Text>
                    )}
                  </View>

                  {!!leave.reason && (
                    <Text
                      className="mt-3 text-sm leading-5 text-slate-600"
                      numberOfLines={2}
                    >
                      {leave.reason}
                    </Text>
                  )}
                  {!!leave.admin_reason && (
                    <Text className="mt-3 text-xs italic text-slate-500">
                      Admin: {leave.admin_reason}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <Pressable
        onPress={() => setShowApply(true)}
        className="absolute bottom-[120px] right-5 z-20 h-16 w-16 items-center justify-center rounded-full bg-orange-600"
        style={{
          shadowColor: "#f97316",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <BottomHome />
      <Modal
        visible={showApply}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApply(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] overflow-hidden rounded-t-[28px] bg-[#f2f2f2] pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between rounded-t-[26px] bg-[#111827] px-5 py-4">
              <View className="flex-1 pr-0">
                <Text className="text-[16px] font-black text-[#f97316]">
                  Apply for leave
                </Text>
                <Text className="mt-1 text-[15px] text-slate-200">
                  Submit a request for approval.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowApply(false)}
                className="h-11 w-11 items-center justify-center rounded-full bg-white"
              >
                <Ionicons name="close" size={24} color="#1f2937" />
              </Pressable>
            </View>

            <ScrollView
              className="mt-2 px-0"
              keyboardShouldPersistTaps="handled"
            >
              <Text className="mb-2 px-5 text-[12px] font-black uppercase tracking-[2px] text-slate-500">
                Leave type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {leaveTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => updateForm("leave_type", type)}
                    className={`mr-2 rounded-full border px-4 py-3 ${form.leave_type === type ? "border-[#f97316] bg-[#f97316]" : "border-slate-300 bg-white"}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${form.leave_type === type ? "text-white" : "text-slate-700"}`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View className="flex-row gap-3 px-5">
                <View className="flex-1">
                  <Text className="mb-2 text-[12px] font-black uppercase tracking-[2px] text-slate-500">
                    From (YYYY-MM-DD)
                  </Text>
                  <Pressable
                    onPress={() => setShowFromDatePicker(true)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                  >
                    <Text className="text-base text-slate-900">
                      {form.from_date || "Select date"}
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-1">
                  <Text className="mb-2 text-[12px] font-black uppercase tracking-[2px] text-slate-500">
                    To (YYYY-MM-DD)
                  </Text>
                  <Pressable
                    onPress={() => setShowToDatePicker(true)}
                    disabled={form.day_type === "Half Day"}
                    className={`rounded-xl border border-slate-300 px-3 py-3 ${form.day_type === "Half Day" ? "bg-slate-100" : "bg-white"}`}
                  >
                    <Text
                      className={`text-base ${form.day_type === "Half Day" ? "text-slate-400" : "text-slate-900"}`}
                    >
                      {form.day_type === "Half Day"
                        ? form.from_date || "Select date"
                        : form.to_date || "Select date"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text className="mb-2 mt-4 px-5 text-[12px] font-black uppercase tracking-[2px] text-slate-500">
                Day type
              </Text>
              <View className="flex-row gap-3 px-5">
                {["Full Day", "Half Day"].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => updateForm("day_type", type)}
                    className={`flex-1 rounded-xl border px-3 py-3 ${form.day_type === type ? "border-[#f97316] bg-[#fff7ed]" : "border-slate-300 bg-white"}`}
                  >
                    <Text
                      className={`text-center text-base font-semibold ${form.day_type === type ? "text-[#f97316]" : "text-slate-600"}`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {form.day_type === "Half Day" && (
                <View className="mt-3 flex-row gap-3">
                  {["Morning", "Afternoon"].map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => updateForm("half_day_type", type)}
                      className={`flex-1 rounded-xl border px-3 py-3 ${form.half_day_type === type ? "border-[#f97316] bg-[#fff7ed]" : "border-slate-300 bg-white"}`}
                    >
                      <Text
                        className={`text-center text-base font-semibold ${form.half_day_type === type ? "text-[#f97316]" : "text-slate-600"}`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text className="mb-2 mt-4 px-5 text-[12px] font-black uppercase tracking-[2px] text-slate-500">
                Reason
              </Text>
              <TextInput
                value={form.reason}
                onChangeText={(value) => updateForm("reason", value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Tell us why you need leave"
                placeholderTextColor="#94a3b8"
                className="mx-5 min-h-[100px] rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
              />

              <Pressable
                disabled={submitting}
                onPress={submitLeave}
                className="mx-5 mt-5 items-center rounded-xl bg-[#f97316] py-4 active:bg-[#ea580c]"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[16px] font-black text-white">
                    Submit request
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showFromDatePicker && (
        <DateTimePicker
          value={
            form.from_date ? new Date(`${form.from_date}T00:00:00`) : new Date()
          }
          mode="date"
          onChange={(_, selectedDate) => {
            setShowFromDatePicker(false);
            if (selectedDate) {
              updateForm("from_date", formatPickerDate(selectedDate));
            }
          }}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={
            form.to_date ? new Date(`${form.to_date}T00:00:00`) : new Date()
          }
          mode="date"
          onChange={(_, selectedDate) => {
            setShowToDatePicker(false);
            if (selectedDate) {
              updateForm("to_date", formatPickerDate(selectedDate));
            }
          }}
        />
      )}
    </View>
  );
}
