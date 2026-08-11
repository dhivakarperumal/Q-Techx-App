import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api, { API_BASE_URL } from "../../../api";

// ── Helpers ──
const fmtDate = (v?: string | number) => {
  if (!v) return "N/A";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getAvatarUrl = (photoUrl?: string) => {
  if (!photoUrl) return "https://i.pravatar.cc/150";
  if (photoUrl.startsWith("http")) return photoUrl;
  const baseUrl = API_BASE_URL.replace(/\/api$/, "");
  return `${baseUrl}${photoUrl}`;
};

const firstAvailable = (...values: any[]) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const normalizeEmployeePayload = (payload: any) => {
  if (!payload) return null;

  if (Array.isArray(payload)) return payload[0] || null;

  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    const nested = payload.data;
    if (
      nested.employee ||
      nested.user ||
      nested.member ||
      nested.result ||
      nested.details
    ) {
      return normalizeEmployeePayload(
        nested.employee ||
          nested.user ||
          nested.member ||
          nested.result ||
          nested.details,
      );
    }
    return nested;
  }

  if (
    payload.employee ||
    payload.user ||
    payload.member ||
    payload.result ||
    payload.details
  ) {
    return normalizeEmployeePayload(
      payload.employee ||
        payload.user ||
        payload.member ||
        payload.result ||
        payload.details,
    );
  }

  return payload;
};

// ── Read-only card components ──
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`mb-4 rounded-[24px] bg-white p-5 border border-slate-100 ${className}`}
      style={{
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function CardTitle({ title, icon }: { title: string; icon: any }) {
  return (
    <View className="mb-4 flex-row items-center">
      <View className="mr-2 h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
        <Ionicons name={icon} size={16} color="#f97316" />
      </View>
      <Text className="text-[15px] font-black text-slate-900">{title}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value?: string | null;
  copyable?: boolean;
}) {
  if (!value) return null;
  return (
    <View className="flex-row items-center justify-between border-b border-slate-50 py-3 last:border-0">
      <Text className="flex-1 text-[13px] font-semibold text-slate-500">
        {label}
      </Text>
      <Text className="flex-1 text-right text-[14px] font-bold text-slate-800">
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status?.toLowerCase() === "active";
  return (
    <View
      className={`rounded-full px-3 py-1 ${
        isActive ? "bg-emerald-100" : "bg-slate-100"
      }`}
    >
      <Text
        className={`text-[11px] font-bold ${
          isActive ? "text-emerald-700" : "text-slate-600"
        }`}
      >
        {status || "Unknown"}
      </Text>
    </View>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const directResponse = await api
        .get(`/employees/${encodeURIComponent(String(id))}`)
        .catch(() => null);
      const directEmployee = normalizeEmployeePayload(
        directResponse?.data || directResponse,
      );

      if (directEmployee) {
        setEmployee(directEmployee);
        return;
      }

      const queryResponse = await api
        .get(`/employees?employee_id=${encodeURIComponent(String(id))}`)
        .catch(() => null);
      const queryPayload =
        queryResponse?.data?.data ||
        queryResponse?.data ||
        queryResponse?.data?.users ||
        [];
      const queryList = Array.isArray(queryPayload)
        ? queryPayload
        : queryPayload?.results || [];
      const matchedByQuery = Array.isArray(queryList)
        ? queryList.find((item: any) =>
            [
              item.id,
              item.uuid,
              item._id,
              item.employee_id,
              item.employeeId,
              item.employee_code,
              item.employeeCode,
            ].some((value) => String(value) === String(id)),
          )
        : null;

      if (matchedByQuery) {
        setEmployee(normalizeEmployeePayload(matchedByQuery));
        return;
      }

      const fallbackResponse = await api.get("/employees").catch(() => null);
      const fallbackPayload =
        fallbackResponse?.data?.data ||
        fallbackResponse?.data ||
        fallbackResponse?.data?.users ||
        [];
      const fallbackList = Array.isArray(fallbackPayload)
        ? fallbackPayload
        : fallbackPayload?.results || [];
      const matchedFallback = Array.isArray(fallbackList)
        ? fallbackList.find((item: any) =>
            [
              item.id,
              item.uuid,
              item._id,
              item.employee_id,
              item.employeeId,
              item.employee_code,
              item.employeeCode,
            ].some((value) => String(value) === String(id)),
          )
        : null;

      setEmployee(normalizeEmployeePayload(matchedFallback || null));
    } catch {
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-3 font-semibold text-slate-400">
          Loading details...
        </Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <Ionicons name="person-circle-outline" size={64} color="#cbd5e1" />
        <Text className="mt-3 text-lg font-bold text-slate-600">
          Employee not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-xl bg-orange-500 px-6 py-3"
        >
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const fullName =
    firstAvailable(
      employee.full_name,
      employee.name,
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
      `${employee.firstname || ""} ${employee.lastname || ""}`.trim(),
    ) || "Unknown";
  const avatar = getAvatarUrl(
    firstAvailable(
      employee.profile_photo,
      employee.avatar,
      employee.profilePhoto,
    ),
  );
  const role = firstAvailable(
    employee.role,
    employee.designation,
    employee.job_title,
    employee.position,
    "Employee",
  );
  const department = firstAvailable(
    employee.department,
    employee.team,
    employee.unit,
    employee.division,
    "General",
  );
  const status = firstAvailable(
    employee.status,
    employee.employee_status,
    "Active",
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* ── HERO HEADER ── */}
      <View className="bg-slate-900 pb-8 pt-4 px-5">
        <SafeAreaView edges={["top"]}>
          {/* Top Nav */}
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 flex-row items-center justify-center rounded-full bg-white/10"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <StatusBadge status={status} />
          </View>

          {/* Profile Overview */}
          <View className="flex-row items-center gap-5">
            <Image
              source={{ uri: avatar }}
              className="h-20 w-20 rounded-full border-4 border-white/10 bg-slate-800"
            />
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">{fullName}</Text>
              <View className="mt-1 flex-row items-center">
                <Ionicons name="briefcase-outline" size={14} color="#94a3b8" />
                <Text className="ml-1.5 text-[13px] font-medium text-slate-400">
                  {role} • {department}
                </Text>
              </View>
              {employee.employee_code && (
                <View className="mt-2 self-start rounded-md bg-orange-500/20 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-orange-400">
                    ID: {employee.employee_code}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        contentContainerClassName="px-5 pt-5 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info */}
        <Card>
          <CardTitle title="Contact Information" icon="call-outline" />
          <Row label="Email Address" value={employee.email} />
          <Row label="Phone Number" value={employee.phone || employee.mobile} />
          <Row label="Alt Phone" value={employee.alt_phone} />
          <Row
            label="WhatsApp"
            value={employee.whatsapp_number || employee.whatsapp}
          />
          <Row label="LinkedIn" value={employee.linkedin} />
          <Row label="GitHub" value={employee.github} />
        </Card>

        {/* Employment Details */}
        <Card>
          <CardTitle title="Employment Details" icon="business-outline" />
          <Row
            label="Employee Code"
            value={employee.employee_code || employee.employeeCode}
          />
          <Row label="Department" value={department} />
          <Row label="Designation" value={role} />
          <Row
            label="Date of Joining"
            value={fmtDate(employee.date_of_joining || employee.joining_date)}
          />
          <Row
            label="Employment Type"
            value={
              employee.employment_type || employee.employmentType || "Full Time"
            }
          />
          <Row label="Shift" value={employee.shift} />
          <Row
            label="Manager"
            value={
              employee.manager_name ||
              employee.manager ||
              employee.reporting_manager
            }
          />
          <Row
            label="Location"
            value={employee.location || employee.work_location}
          />
        </Card>

        {/* Personal Details */}
        <Card>
          <CardTitle title="Personal Details" icon="person-outline" />
          <Row label="Gender" value={employee.gender} />
          <Row
            label="Date of Birth"
            value={fmtDate(employee.date_of_birth || employee.dob)}
          />
          <Row
            label="Blood Group"
            value={employee.blood_group || employee.bloodGroup}
          />
          <Row
            label="Marital Status"
            value={employee.marital_status || employee.maritalStatus}
          />
          <Row label="Nationality" value={employee.nationality} />
          <Row label="Caste" value={employee.caste} />
          <Row label="Religion" value={employee.religion} />

          {(employee.current_address ||
            employee.permanent_address ||
            employee.address) && (
            <>
              {employee.current_address && (
                <View className="mt-3 border-t border-slate-50 pt-3">
                  <Text className="mb-1 text-[13px] font-semibold text-slate-500">
                    Current Address
                  </Text>
                  <Text className="text-[14px] leading-5 text-slate-800">
                    {employee.current_address}
                  </Text>
                </View>
              )}
              {employee.permanent_address && (
                <View className="mt-3 border-t border-slate-50 pt-3">
                  <Text className="mb-1 text-[13px] font-semibold text-slate-500">
                    Permanent Address
                  </Text>
                  <Text className="text-[14px] leading-5 text-slate-800">
                    {employee.permanent_address}
                  </Text>
                </View>
              )}
              {employee.address &&
                !employee.current_address &&
                !employee.permanent_address && (
                  <View className="mt-3 border-t border-slate-50 pt-3">
                    <Text className="mb-1 text-[13px] font-semibold text-slate-500">
                      Address
                    </Text>
                    <Text className="text-[14px] leading-5 text-slate-800">
                      {employee.address}
                    </Text>
                  </View>
                )}
            </>
          )}
        </Card>

        {/* Emergency Contact */}
        {(employee.emergency_contact_name ||
          employee.emergency_contact_phone ||
          employee.emergency_contact_relation) && (
          <Card>
            <CardTitle title="Emergency Contact" icon="warning-outline" />
            <Row label="Contact Name" value={employee.emergency_contact_name} />
            <Row label="Relation" value={employee.emergency_contact_relation} />
            <Row
              label="Phone Number"
              value={employee.emergency_contact_phone}
            />
          </Card>
        )}

        {/* Additional Details */}
        {(employee.bank_name ||
          employee.bank_account_number ||
          employee.salary ||
          employee.pan_number ||
          employee.aadhaar_number ||
          employee.emergency_contact_name ||
          employee.emergency_contact_phone) && (
          <Card>
            <CardTitle title="Additional Details" icon="documents-outline" />
            <Row label="Bank Name" value={employee.bank_name} />
            <Row label="Bank Account" value={employee.bank_account_number} />
            <Row label="Salary" value={employee.salary} />
            <Row label="PAN Number" value={employee.pan_number} />
            <Row label="Aadhaar Number" value={employee.aadhaar_number} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
