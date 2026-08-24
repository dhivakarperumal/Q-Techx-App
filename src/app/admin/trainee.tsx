import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

type Member = Record<string, any>;
type Employee = {
  employee_id: string | number;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  designation?: string;
};
const types = ["All", "Trainee", "Intern"];
const statuses = ["All", "Active", "Completed", "On Leave", "Inactive"];
const uploadFields = [
  "profile_photo",
  "resume",
  "college_id_doc",
  "offer_letter",
  "internship_letter",
] as const;
const emptyForm: Record<string, any> = {
  person_id: "",
  full_name: "",
  type: "Trainee",
  department: "",
  designation: "",
  reporting_manager: "",
  joining_date: "",
  confirmation_date: "",
  end_date: "",
  status: "Active",
  mobile_number: "",
  email_address: "",
  current_address: "",
  emergency_contact_name: "",
  emergency_contact_number: "",
  college_university: "",
  course: "",
  academic_department: "",
  year_semester: "",
  college_id_number: "",
  guide_name: "",
  username: "",
  official_email: "",
  password: "",
};
const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const nameOf = (member?: Member | null) => {
  if (!member) return "Unnamed member";
  return (
    member.full_name ||
    member.trainee_name ||
    member.name ||
    "Unnamed member"
  );
};
const dateValue = (value?: string | Date) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const dateText = (value?: string | Date) => {
  const date = dateValue(value);
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
};
const joiningDateOf = (member?: Member | null) => {
  if (!member) return "";
  return (
    member.joining_date ||
    member.joiningDate ||
    member.joined_date ||
    member.date_joined ||
    member.created_at ||
    ""
  );
};
const initials = (name?: string) => {
  if (!name || typeof name !== "string") return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
};
const employeeName = (employee?: Employee | null) => {
  if (!employee) return "Employee";
  return (
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
    employee.employee_code ||
    "Employee"
  );
};
const hasActiveAssignment = (member?: Member | null) => {
  if (!member) return false;
  const candidateValues = [
    member?.has_active_assignment,
    member?.assigned_employee_id,
    member?.employee_id,
    member?.assigned_to,
    member?.current_employee_id,
    member?.assignment_status,
    member?.assignment?.is_active,
    member?.assignment?.active,
    member?.assignment?.status,
  ];

  return candidateValues.some((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "boolean") return value;
    const text = String(value).trim().toLowerCase();
    if (
      ["0", "false", "none", "null", "unassigned", "not assigned"].includes(
        text
      )
    )
      return false;
    return true;
  });
};

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  multiline = false,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TextInput
        value={value || ""}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secure}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        className={inputClass}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const selectedDate = dateValue(value) || new Date();

  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <Pressable
        onPress={() => setVisible(true)}
        className={inputClass + " flex-row items-center justify-between"}
      >
        <Text className={value ? "text-sm text-slate-900" : "text-sm text-slate-400"}>
          {value || "Select date"}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#f97316" />
      </Pressable>
      {visible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setVisible(false);
            if (event.type === "set" && date) {
              onChange(
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
              );
            }
          }}
          accentColor="#f97316"
        />
      )}
    </View>
  );
}

function Choices({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values
          .filter((item) => item !== "All")
          .map((item) => (
            <Pressable
              key={item}
              onPress={() => onChange(item)}
              className={`rounded-full border px-3 py-2 ${
                value === item
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  value === item ? "text-orange-600" : "text-slate-500"
                }`}
              >
                {item}
              </Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

/* ── REUSABLE FILTER DROPDOWN MODAL ── */
function FilterDropdownModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[] | string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-center px-8"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-2xl overflow-hidden shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <Text className="text-base font-bold text-slate-900">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt) => {
              const label = typeof opt === "string" ? opt : opt.label;
              const val = typeof opt === "string" ? opt : opt.value;
              const isSelected =
                selectedValue === val ||
                ((selectedValue === "All" || !selectedValue) &&
                  (val === "All" || val === ""));

              return (
                <TouchableOpacity
                  key={val || label}
                  onPress={() => {
                    onSelect(val);
                    onClose();
                  }}
                  className={`px-5 py-3.5 border-b border-slate-100 flex-row items-center justify-between ${
                    isSelected ? "bg-orange-50/50" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? "font-bold text-orange-500"
                        : "text-slate-700"
                    }`}
                  >
                    {label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#f97316" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AssignmentModal({
  visible,
  member,
  employees,
  onClose,
  onSaved,
}: {
  visible: boolean;
  member: Member | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible)
      setEmployeeId(
        String(member?.assigned_employee_id || member?.employee_id || "")
      );
  }, [visible, member]);
  const submit = async () => {
    if (!member || !employeeId)
      return Alert.alert("Select employee", "Please select an employee to assign.");
    setSaving(true);
    try {
      await api.post("/trainee-assignments", {
        trainee_id: member.id || member.uuid,
        employee_id: employeeId,
        trainee_name: member.full_name,
        trainee_code: member.person_id,
        trainee_email: member.email_address,
        trainee_phone: member.mobile_number,
        trainee_department: member.department,
        trainee_designation: member.designation,
        trainee_course: member.course,
        trainee_joining_date: joiningDateOf(member),
        person_type: member.type,
        person_name: member.full_name,
        person_id: member.person_id,
        person_email: member.email_address,
        person_phone: member.mobile_number,
        department: member.department,
        designation: member.designation,
        course: member.course,
        joining_date: joiningDateOf(member),
        status: "Active",
      });
      Alert.alert("Assigned", "Employee assigned successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to assign employee",
        error?.message ||
          "The assignment endpoint may not be available on the server."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl h-[85%] shadow-2xl overflow-hidden">
          <View className="bg-black pt-4 px-6 pb-6">
            <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-black text-orange-500">
                  Assign Employee
                </Text>
                <Text className="mt-1 text-xs text-white/70">
                  {member ? nameOf(member) : ""}
                </Text>
              </View>
              <Pressable onPress={onClose}>
                <Ionicons name="close-circle" size={28} color="#f97316" />
              </Pressable>
            </View>
          </View>
          <View className="flex-1">
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingTop: 0 }}
            >
              {employees.map((employee) => (
                <Pressable
                  key={String(employee.employee_id)}
                  onPress={() =>
                    setEmployeeId(String(employee.employee_id))
                  }
                  className={`mb-2 flex-row items-center rounded-2xl border p-3 ${
                    employeeId === String(employee.employee_id)
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Text className="font-black text-blue-600">
                      {initials(employeeName(employee))}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-slate-800">
                      {employeeName(employee)}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      {employee.employee_code || ""}
                      {employee.designation
                        ? ` - ${employee.designation}`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      employeeId === String(employee.employee_id)
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={21}
                    color={
                      employeeId === String(employee.employee_id)
                        ? "#f97316"
                        : "#94a3b8"
                    }
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <Pressable
            disabled={saving}
            onPress={submit}
            className="mx-5 mb-5 items-center rounded-xl bg-orange-500 py-3"
          >
            <Text className="font-bold text-white">
              {saving ? "Saving..." : "Assign / Reassign"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function TraineeForm({
  visible,
  member,
  onClose,
  onSaved,
}: {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(emptyForm);
  const [files, setFiles] = useState<
    Record<string, DocumentPicker.DocumentPickerAsset>
  >({});
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!visible) return;
    setFiles({});
    setForm(
      member
        ? {
            ...emptyForm,
            ...member,
            joining_date: joiningDateOf(member)?.slice?.(0, 10) || "",
            confirmation_date:
              member.confirmation_date?.slice?.(0, 10) ||
              member.confirmationDate?.slice?.(0, 10) ||
              "",
            end_date: member.end_date?.slice?.(0, 10) || "",
            password: "",
          }
        : { ...emptyForm }
    );
  }, [visible, member]);
  useEffect(() => {
    if (!visible || member || form.person_id) return;
    api
      .get("/trainee-intern/next-person-id")
      .then((response) => {
        if (response.data?.code) set("person_id", response.data.code);
      })
      .catch(() => undefined);
  }, [visible, member, form.person_id]);
  const chooseFile = async (field: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0])
      setFiles((current) => ({ ...current, [field]: result.assets[0] }));
  };
  const save = async () => {
    if (!form.full_name?.trim())
      return Alert.alert("Required field", "Full name is required.");
    if (!member && !form.mobile_number)
      return Alert.alert("Required field", "Mobile number is required.");
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined)
          body.append(key, String(value));
      });
      Object.entries(files).forEach(([field, file]) =>
        body.append(field, {
          uri: file.uri,
          name: file.name || field,
          type: file.mimeType || "application/octet-stream",
        } as unknown as Blob)
      );
      if (member)
        await api.put(`/trainee-intern/${member.uuid}`, body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      else
        await api.post("/trainee-intern", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      Alert.alert(
        "Success",
        member
          ? "Member updated successfully."
          : "Member created successfully."
      );
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to save member",
        error?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                {member ? "Edit Member" : "Add Trainee / Intern"}
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                Profile, credentials, academics and documents.
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            paddingTop: 10,
          }}
        >
          <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-base font-black text-slate-900">
              Basic Information
            </Text>
            <Field
              label="Person ID"
              value={form.person_id}
              onChange={(value) => set("person_id", value)}
            />
            <Field
              label="Full Name *"
              value={form.full_name}
              onChange={(value) => set("full_name", value)}
            />
            <Choices
              label="Type"
              values={types}
              value={form.type}
              onChange={(value) => set("type", value)}
            />
            <Field
              label="Department"
              value={form.department}
              onChange={(value) => set("department", value)}
            />
            <Field
              label="Designation"
              value={form.designation}
              onChange={(value) => set("designation", value)}
            />
            <Field
              label="Reporting Manager"
              value={form.reporting_manager}
              onChange={(value) => set("reporting_manager", value)}
            />
            <DateField
              label="Joining Date"
              value={form.joining_date}
              onChange={(value) => set("joining_date", value)}
            />
            <DateField
              label="Confirmation Date"
              value={form.confirmation_date}
              onChange={(value) => set("confirmation_date", value)}
            />
            <DateField
              label="End Date"
              value={form.end_date}
              onChange={(value) => set("end_date", value)}
            />
            <Choices
              label="Status"
              values={statuses}
              value={form.status}
              onChange={(value) => set("status", value)}
            />
          </View>
          <View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-base font-black text-slate-900">
              Contact Information
            </Text>
            <Field
              label="Mobile Number"
              value={form.mobile_number}
              onChange={(value) => set("mobile_number", value)}
            />
            <Field
              label="Email Address"
              value={form.email_address}
              onChange={(value) => set("email_address", value)}
            />
            <Field
              label="Current Address"
              value={form.current_address}
              onChange={(value) => set("current_address", value)}
              multiline
            />
            <Field
              label="Emergency Contact Name"
              value={form.emergency_contact_name}
              onChange={(value) => set("emergency_contact_name", value)}
            />
            <Field
              label="Emergency Contact Number"
              value={form.emergency_contact_number}
              onChange={(value) => set("emergency_contact_number", value)}
            />
          </View>
          <View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-base font-black text-slate-900">
              Login Credentials
            </Text>
            <Field
              label="Username"
              value={form.username}
              onChange={(value) => set("username", value)}
            />
            <Field
              label="Official Email"
              value={form.official_email}
              onChange={(value) => set("official_email", value)}
            />
            <Field
              label={member ? "Password (optional)" : "Password"}
              value={form.password}
              onChange={(value) => set("password", value)}
              secure
            />
          </View>
          <View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-4 text-base font-black text-slate-900">
              Academic Information
            </Text>
            <Field
              label="College / University"
              value={form.college_university}
              onChange={(value) => set("college_university", value)}
            />
            <Field
              label="Course"
              value={form.course}
              onChange={(value) => set("course", value)}
            />
            <Field
              label="Academic Department"
              value={form.academic_department}
              onChange={(value) => set("academic_department", value)}
            />
            <Field
              label="Year / Semester"
              value={form.year_semester}
              onChange={(value) => set("year_semester", value)}
            />
            <Field
              label="College ID Number"
              value={form.college_id_number}
              onChange={(value) => set("college_id_number", value)}
            />
            <Field
              label="Guide Name"
              value={form.guide_name}
              onChange={(value) => set("guide_name", value)}
            />
          </View>
          <View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-1 text-base font-black text-slate-900">
              Documents
            </Text>
            <Text className="mb-4 text-xs text-slate-500">
              Select profile photo, resume, ID, offer, or internship
              documents.
            </Text>
            {uploadFields.map((field) => (
              <Pressable
                key={field}
                onPress={() => chooseFile(field)}
                className="mb-2 flex-row items-center rounded-xl border border-dashed border-slate-300 p-3"
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#f97316"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-slate-700">
                    {field.replace(/_/g, " ")}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-400">
                    {files[field]?.name || "Tap to choose file"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable
            disabled={saving}
            onPress={save}
            className="mt-5 items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-50"
          >
            <Text className="font-black text-white">
              {saving
                ? "Saving..."
                : member
                ? "Update Member"
                : "Save Member"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailModal({
  member,
  onClose,
  onEdit,
  onDelete,
}: {
  member: Member;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                {nameOf(member)}
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                {member.person_id || "Trainee / Intern"}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            paddingTop: 10,
          }}
        >
          <View className="items-center rounded-3xl bg-white p-5 shadow-sm">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-orange-100">
              <Text className="text-2xl font-black text-orange-600">
                {initials(nameOf(member))}
              </Text>
            </View>
            <Text className="mt-3 text-xl font-black text-slate-900">
              {nameOf(member)}
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              {member.type} - {member.status}
            </Text>
          </View>
          <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
            {[
              ["Department", member.department],
              ["Designation", member.designation],
              ["Reporting Manager", member.reporting_manager],
              ["Mobile", member.mobile_number],
              ["Email", member.email_address],
              ["Joining Date", dateText(joiningDateOf(member))],
              ["Confirmation Date", dateText(member.confirmation_date || member.confirmationDate)],
              ["End Date", dateText(member.end_date)],
              ["College", member.college_university],
              ["Course", member.course],
              ["Academic Department", member.academic_department],
              ["Year / Semester", member.year_semester],
              ["Guide", member.guide_name],
            ].map(([label, value]) =>
              value ? (
                <View key={label} className="border-b border-slate-100 py-3">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    {String(value)}
                  </Text>
                </View>
              ) : null
            )}
          </View>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={onEdit}
              className="flex-1 items-center rounded-xl border border-orange-500 py-3"
            >
              <Text className="font-bold text-orange-600">Edit</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              className="flex-1 items-center rounded-xl bg-rose-600 py-3"
            >
              <Text className="font-bold text-white">Delete</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

type AttendanceRow = {
  trainee_intern_id?: string;
  trainee_name?: string;
  person_id?: string;
  type?: string;
  status?: string;
  present_days?: number;
  absent_days?: number;
};
type AttendanceDetail = {
  id?: string;
  attendance_date?: string;
  date?: string;
  check_in_time?: string;
  check_out_time?: string;
  attendance_status?: string;
  location?: string;
};
const attendanceDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const currentTime = () => {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatTimeValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const calculateMetrics = (checkIn: string, checkOut: string) => {
  const parseTime = (value: string) => {
    if (!value) return null;
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const officeCheckIn = parseTime("09:30");
  const officeCheckOut = parseTime("18:00");
  const checkInMinutes = parseTime(checkIn);
  const checkOutMinutes = parseTime(checkOut);
  let workingHours = "0h 0m",
    lateEntry = "No",
    earlyExit = "No",
    overtime = "No";
  if (checkInMinutes !== null && checkOutMinutes !== null) {
    const durationMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
    workingHours = `${Math.floor(durationMinutes / 60)}h ${
      durationMinutes % 60
    }m`;
  }
  if (checkInMinutes !== null) {
    const lateBy = checkInMinutes - officeCheckIn!;
    if (lateBy > 0)
      lateEntry = `${Math.floor(lateBy / 60)}h ${lateBy % 60}m`;
  }
  if (checkOutMinutes !== null) {
    const exitBefore = officeCheckOut! - checkOutMinutes;
    if (exitBefore > 0)
      earlyExit = `${Math.floor(exitBefore / 60)}h ${exitBefore % 60}m`;
  }
  if (checkOutMinutes !== null) {
    const overtimeMinutes = Math.max(
      0,
      checkOutMinutes - officeCheckOut!
    );
    if (overtimeMinutes > 0)
      overtime = `${Math.floor(overtimeMinutes / 60)}h ${
        overtimeMinutes % 60
      }m`;
  }
  return {
    working_hours: workingHours,
    late_entry: lateEntry,
    early_exit: earlyExit,
    overtime,
  };
};

function AttendanceModal({
  visible,
  members,
  onClose,
  onSaved,
}: {
  visible: boolean;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    trainee_intern_id: "",
    date: attendanceDate(),
    check_in_time: "",
    check_out_time: "",
    attendance_status: "Present",
    location: "",
  });
  const [metrics, setMetrics] = useState({
    working_hours: "0h 0m",
    late_entry: "No",
    early_exit: "No",
    overtime: "No",
  });
  const [saving, setSaving] = useState(false);
  const [activePicker, setActivePicker] = useState<
    "date" | "check_in_time" | "check_out_time" | null
  >(null);

  const set = (key: string, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (key === "check_in_time" || key === "check_out_time") {
      setMetrics(
        calculateMetrics(updated.check_in_time, updated.check_out_time)
      );
    }
  };

  useEffect(() => {
    if (visible) {
      setForm((current) => ({ ...current, date: attendanceDate() }));
      setActivePicker(null);
    }
  }, [visible]);

  const setNowTime = (field: "check_in_time" | "check_out_time") => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    set(field, `${hh}:${mm}`);
  };

  const getTimeDate = (timeStr?: string) => {
    const d = new Date();
    if (!timeStr) return d;
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        d.setHours(h, m, 0, 0);
        return d;
      }
    }
    return d;
  };

  const format12H = (timeStr?: string) => {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parts[1].slice(0, 2);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const dh = h % 12 || 12;
    return `${String(dh).padStart(2, "0")}:${m} ${ampm}`;
  };

  const save = async () => {
    if (!form.trainee_intern_id)
      return Alert.alert(
        "Required field",
        "Please select a trainee or intern."
      );
    if (!form.date)
      return Alert.alert(
        "Required field",
        "Please enter the attendance date."
      );
    setSaving(true);
    try {
      await api.post("/trainee-intern-attendance", {
        trainee_intern_id: form.trainee_intern_id,
        date: form.date,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        working_hours: metrics.working_hours,
        late_entry: metrics.late_entry,
        early_exit: metrics.early_exit,
        overtime: metrics.overtime,
        attendance_status: form.attendance_status,
        location: form.location,
      });
      Alert.alert(
        "Saved",
        "Trainee/intern attendance recorded successfully."
      );
      setForm({
        trainee_intern_id: "",
        date: attendanceDate(),
        check_in_time: "",
        check_out_time: "",
        attendance_status: "Present",
        location: "",
      });
      setMetrics({
        working_hours: "0h 0m",
        late_entry: "No",
        early_exit: "No",
        overtime: "No",
      });
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to save attendance",
        error?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                Mark Attendance
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                Create or update a trainee/intern record.
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            paddingTop: 10,
          }}
        >
          <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <Text className="mb-3 text-xs font-bold text-slate-500">
              Trainee / Intern
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {members.map((member) => (
                <Pressable
                  key={String(member.uuid)}
                  onPress={() =>
                    set("trainee_intern_id", String(member.uuid))
                  }
                  className={`mr-2 rounded-full border px-3 py-2 ${
                    form.trainee_intern_id === String(member.uuid)
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      form.trainee_intern_id === String(member.uuid)
                        ? "text-orange-600"
                        : "text-slate-500"
                    }`}
                  >
                    {nameOf(member)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Date Picker Tile */}
            <Text className="mb-1.5 text-xs font-bold text-slate-500">
              Date
            </Text>
            <TouchableOpacity
              onPress={() => setActivePicker("date")}
              className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={18} color="#f97316" />
                <Text className="ml-2.5 text-sm font-bold text-slate-900">
                  {form.date}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </TouchableOpacity>

            <Text className="mb-2 text-xs font-bold text-slate-500">
              Attendance Status
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {["Present", "Absent"].map((status) => (
                <Pressable
                  key={status}
                  onPress={() => set("attendance_status", status)}
                  className={`rounded-full border px-3 py-2 ${
                    form.attendance_status === status
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      form.attendance_status === status
                        ? "text-orange-600"
                        : "text-slate-500"
                    }`}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Check In Time Tile */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-slate-500">
                  Check-in Time
                </Text>
                <TouchableOpacity
                  onPress={() => setNowTime("check_in_time")}
                  className="bg-slate-900 px-2 py-0.5 rounded"
                >
                  <Text className="text-[10px] font-bold text-white">
                    Now
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setActivePicker("check_in_time")}
                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="log-in-outline"
                    size={18}
                    color="#10b981"
                  />
                  <Text
                    className={`ml-2.5 text-sm font-bold ${
                      form.check_in_time
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {format12H(form.check_in_time) || "Select check-in time"}
                  </Text>
                </View>
                {form.check_in_time ? (
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs font-extrabold text-slate-600">
                      {form.check_in_time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => set("check_in_time", "")}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#cbd5e1"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Check Out Time Tile */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-slate-500">
                  Check-out Time
                </Text>
                <TouchableOpacity
                  onPress={() => setNowTime("check_out_time")}
                  className="bg-slate-900 px-2 py-0.5 rounded"
                >
                  <Text className="text-[10px] font-bold text-white">
                    Now
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setActivePicker("check_out_time")}
                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color="#ef4444"
                  />
                  <Text
                    className={`ml-2.5 text-sm font-bold ${
                      form.check_out_time
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {format12H(form.check_out_time) ||
                      "Select check-out time"}
                  </Text>
                </View>
                {form.check_out_time ? (
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs font-extrabold text-slate-600">
                      {form.check_out_time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => set("check_out_time", "")}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#cbd5e1"
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Metrics calculation preview */}
            <View className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <View className="flex-row flex-wrap gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Working Hours</Text>
                  <Text className="mt-1 font-bold text-slate-900">
                    {metrics.working_hours}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Late Entry</Text>
                  <Text className="mt-1 font-bold text-slate-900">
                    {metrics.late_entry}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Early Exit</Text>
                  <Text className="mt-1 font-bold text-slate-900">
                    {metrics.early_exit}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Overtime</Text>
                  <Text className="mt-1 font-bold text-slate-900">
                    {metrics.overtime}
                  </Text>
                </View>
              </View>
            </View>

            <Field
              label="Location"
              value={form.location}
              onChange={(value) => set("location", value)}
              placeholder="Optional location"
            />
            <Pressable
              disabled={saving}
              onPress={save}
              className="mt-2 items-center rounded-xl bg-orange-500 py-3.5 disabled:opacity-50"
            >
              <Text className="font-bold text-white">
                {saving ? "Saving..." : "Save / Update"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {activePicker === "date" && (
          <DateTimePicker
            value={new Date(form.date || attendanceDate())}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") setActivePicker(null);
              if (event.type === "set" && selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const day = String(selectedDate.getDate()).padStart(2, "0");
                set("date", `${year}-${month}-${day}`);
              }
            }}
            accentColor="#f97316"
          />
        )}

        {activePicker && activePicker !== "date" && (
          <DateTimePicker
            value={getTimeDate(form[activePicker])}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              const field = activePicker as
                | "check_in_time"
                | "check_out_time";
              if (Platform.OS === "android") setActivePicker(null);
              if (event.type === "set" && selectedDate) {
                const hh = String(selectedDate.getHours()).padStart(2, "0");
                const mm = String(selectedDate.getMinutes()).padStart(2, "0");
                set(field, `${hh}:${mm}`);
              }
            }}
            accentColor="#f97316"
          />
        )}
      </View>
    </Modal>
  );
}

function AttendanceDetailModal({
  visible,
  member,
  attendanceRecords,
  onClose,
}: {
  visible: boolean;
  member: AttendanceRow | null;
  attendanceRecords: AttendanceDetail[];
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                {member?.trainee_name || "Attendance Details"}
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                {member?.person_id || "ID"} • {member?.type || "Type"}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
            paddingTop: 10,
          }}
        >
          {attendanceRecords.length === 0 ? (
            <View className="items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12">
              <Ionicons name="calendar-outline" size={34} color="#cbd5e1" />
              <Text className="mt-3 font-bold text-slate-500">
                No detailed records found.
              </Text>
            </View>
          ) : (
            attendanceRecords.map((record, idx) => (
              <View
                key={record.id || idx}
                className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <View>
                    <Text className="font-bold text-slate-900">
                      {record.attendance_date || record.date || "Date"}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      {record.attendance_status || "Status"}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-2 py-1 ${
                      record.attendance_status?.toLowerCase() === "present"
                        ? "bg-emerald-50"
                        : "bg-rose-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        record.attendance_status?.toLowerCase() === "present"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {record.attendance_status || "Unknown"}
                    </Text>
                  </View>
                </View>
                {record.check_in_time && record.check_out_time && (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs text-slate-500">Check In</Text>
                      <Text className="mt-1 font-bold text-slate-900">
                        {record.check_in_time}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-slate-500">Check Out</Text>
                      <Text className="mt-1 font-bold text-slate-900">
                        {record.check_out_time}
                      </Text>
                    </View>
                  </View>
                )}
                {record.location && (
                  <View className="mt-3">
                    <Text className="text-xs text-slate-500">Location</Text>
                    <Text className="mt-1 font-bold text-slate-900">
                      {record.location}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

type TraineeTask = {
  uuid: string;
  task_name?: string;
  description?: string;
  task_document?: string;
  created_at?: string;
};
type TaskAssignment = {
  uuid?: string;
  trainee_name?: string;
  task_name?: string;
  assigned_date?: string;
  due_date?: string;
  status?: string;
  progress?: number;
  daily_report?: string;
};

function TaskMasterModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [taskDocument, setTaskDocument] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!taskName.trim())
      return Alert.alert("Required field", "Please enter a task name.");
    setSaving(true);
    try {
      const body = new FormData();

      body.append("task_name", taskName.trim());
      body.append("description", description.trim());

      if (taskDocument) {
        body.append("task_document", {
          uri: taskDocument.uri,
          name: taskDocument.name || "task-document",
          type: taskDocument.mimeType || "application/octet-stream",
        } as any);
      }

      await api.post("/trainee-tasks", body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Saved", "Task created successfully.");
      setTaskName("");
      setDescription("");
      setTaskDocument(null);
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to create task",
        error?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };
  const chooseDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setTaskDocument(result.assets[0]);
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Unable to select document", "Please try again.");
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                Create Task
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                Add a reusable task for trainees and interns.
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>
          <View className="rounded-3xl bg-white p-4 shadow-sm">
            <Field
              label="Task Name *"
              value={taskName}
              onChange={setTaskName}
              placeholder="Enter task name"
            />
            <Field
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Optional task description"
              multiline
            />
            <Text className="mb-2 text-xs font-bold text-slate-500">
              Upload Document
            </Text>

            <Pressable
              onPress={chooseDocument}
              className="mb-4 flex-row items-center rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-4"
            >
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-orange-100">
                <Ionicons
                  name="cloud-upload-outline"
                  size={22}
                  color="#f97316"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-slate-800">
                  {taskDocument?.name || "Choose a document"}
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  {taskDocument
                    ? "Tap to change document"
                    : "PDF, DOC, DOCX, XLS, XLSX, PPT, images, ZIP, etc."}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#f97316"
              />
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={save}
              className="items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"
            >
              <Text className="font-bold text-white">
                {saving ? "Saving..." : "Save Task"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function TaskAssignmentModal({
  visible,
  members,
  tasks,
  onClose,
  onSaved,
}: {
  visible: boolean;
  members: Member[];
  tasks: TraineeTask[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taskUuid, setTaskUuid] = useState("");
  const [memberUuid, setMemberUuid] = useState("");
  const [assignedDate, setAssignedDate] = useState(attendanceDate());
  const [assignedTime, setAssignedTime] = useState(currentTime());
  const [dueDate, setDueDate] = useState("");
  const [showAssignedTimePicker, setShowAssignedTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!taskUuid || !memberUuid || !assignedDate)
      return Alert.alert(
        "Required fields",
        "Select a task, trainee/intern, and assigned date."
      );
    setSaving(true);
    try {
      const body = new FormData();
      body.append("trainee_task_uuid", taskUuid);
      body.append("trainee_intern_uuid", memberUuid);
      body.append("assigned_date", assignedDate);
      body.append("assigned_time", assignedTime);
      body.append("due_date", dueDate);
      await api.post("/trainee-task-assignments", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Assigned", "Task assigned successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to assign task",
        error?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#f8fafc]">
        <View className="bg-black pt-4 px-6 pb-6">
          <View className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-black text-orange-500">
                Assign Task
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                Assign work to a trainee or intern.
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#f97316" />
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>
          <View className="rounded-3xl bg-white p-4 shadow-sm">
            <Text className="mb-2 text-xs font-bold text-slate-500">
              Select Task *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {tasks.map((task) => (
                <Pressable
                  key={task.uuid}
                  onPress={() => setTaskUuid(task.uuid)}
                  className={`mr-2 rounded-full border px-3 py-2 ${
                    taskUuid === task.uuid
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      taskUuid === task.uuid
                        ? "text-orange-600"
                        : "text-slate-500"
                    }`}
                  >
                    {task.task_name || "Untitled task"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text className="mb-2 text-xs font-bold text-slate-500">
              Select Trainee / Intern *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {members.map((member) => (
                <Pressable
                  key={String(member.uuid)}
                  onPress={() =>
                    setMemberUuid(String(member.uuid))
                  }
                  className={`mr-2 rounded-full border px-3 py-2 ${
                    memberUuid === String(member.uuid)
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      memberUuid === String(member.uuid)
                        ? "text-orange-600"
                        : "text-slate-500"
                    }`}
                  >
                    {nameOf(member)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <DateField label="Assigned Date *" value={assignedDate} onChange={setAssignedDate} />
            <View className="mb-3">
              <Text className="mb-1.5 text-xs font-bold text-slate-500">Assigned Time</Text>
              <Pressable onPress={() => setShowAssignedTimePicker(true)} className={inputClass + " flex-row items-center justify-between"}>
                <Text className="text-sm text-slate-900">{assignedTime}</Text>
                <Ionicons name="time-outline" size={18} color="#f97316" />
              </Pressable>
            </View>
            <DateField label="Due Date" value={dueDate} onChange={setDueDate} />
            <Pressable
              disabled={saving}
              onPress={save}
              className="items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"
            >
              <Text className="font-bold text-white">
                {saving ? "Assigning..." : "Assign Task"}
              </Text>
            </Pressable>
          </View>
          {showAssignedTimePicker && (
            <DateTimePicker
              value={(() => {
                const date = new Date();
                const [hours, minutes] = assignedTime.split(":").map(Number);
                date.setHours(hours || 0, minutes || 0, 0, 0);
                return date;
              })()}
              mode="time"
              display="default"
              onChange={(event, date) => {
                setShowAssignedTimePicker(false);
                if (event.type === "set" && date) setAssignedTime(formatTimeValue(date));
              }}
              accentColor="#f97316"
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminTraineeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("Members");

  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [attendanceDetails, setAttendanceDetails] = useState<
    AttendanceDetail[]
  >([]);
  const [tasks, setTasks] = useState<TraineeTask[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>(
    []
  );

  // Loading states
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search state (shared per tab)
  const [search, setSearch] = useState("");

  // Tab 1: Members filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Tab 2: Attendance filter state
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [attStatusFilter, setAttStatusFilter] = useState("All");
  const [attTypeFilter, setAttTypeFilter] = useState("All");
  const [attStatusDropdownOpen, setAttStatusDropdownOpen] = useState(false);
  const [attTypeDropdownOpen, setAttTypeDropdownOpen] = useState(false);
  const [attMonthDropdownOpen, setAttMonthDropdownOpen] = useState(false);
  const [attYearDropdownOpen, setAttYearDropdownOpen] = useState(false);

  // Tab 3: Tasks filter state
  const [taskDocFilter, setTaskDocFilter] = useState("All");
  const [taskDocDropdownOpen, setTaskDocDropdownOpen] = useState(false);

  // Tab 4: Assign Task filter state
  const [assignStatusFilter, setAssignStatusFilter] = useState("All");
  const [assignProgressFilter, setAssignProgressFilter] = useState("All");
  const [assignStatusDropdownOpen, setAssignStatusDropdownOpen] =
    useState(false);
  const [assignProgressDropdownOpen, setAssignProgressDropdownOpen] =
    useState(false);

  // Modals state
  const [formVisible, setFormVisible] = useState(false);
  const [assignmentVisible, setAssignmentVisible] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [assignmentMember, setAssignmentMember] = useState<Member | null>(
    null
  );
  const [attendanceVisible, setAttendanceVisible] = useState(false);
  const [attendanceDetailVisible, setAttendanceDetailVisible] =
    useState(false);
  const [selectedAttendanceMember, setSelectedAttendanceMember] =
    useState<AttendanceRow | null>(null);
  const [taskVisible, setTaskVisible] = useState(false);
  const [taskAssignmentVisible, setTaskAssignmentVisible] = useState(false);

  // Data loaders
  const loadMembers = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const query = new URLSearchParams({ page: "1", limit: "100" });
        if (search) query.set("search", search);
        if (typeFilter !== "All") query.set("type", typeFilter);
        if (statusFilter !== "All") query.set("status", statusFilter);
        const membersResponse = await api.get(
          `/trainee-intern?${query.toString()}`
        );
        setMembers(membersResponse.data?.data || []);
        try {
          const employeesResponse = await api.get(
            "/trainee-assignments/available-employees"
          );
          setEmployees(employeesResponse.data?.data || []);
        } catch {
          const employeesResponse = await api.get("/employees?limit=200");
          setEmployees(
            employeesResponse.data?.data ||
              employeesResponse.data?.employees ||
              []
          );
        }
      } catch (error: any) {
        Alert.alert(
          "Unable to load members",
          error?.message || "Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, typeFilter, statusFilter]
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const response = await api.get(
        `/trainee-intern-attendance/summary?month=${selectedMonth}&year=${selectedYear}`
      );
      const raw =
        response.data?.data ??
        response.data?.summary ??
        response.data?.attendance ??
        response.data;
      setAttendance(Array.isArray(raw) ? raw : []);
    } catch (error: any) {
      if (error?.status === 404 || error?.response?.status === 404) {
        setAttendance([]);
      } else {
        Alert.alert(
          "Unable to load attendance",
          error?.message || "Please try again."
        );
      }
    } finally {
      setAttendanceLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadAttendanceDetails = useCallback(
    async (memberId: string) => {
      setAttendanceLoading(true);
      try {
        const response = await api.get(
          `/trainee-intern-attendance?trainee_intern_id=${memberId}&month=${selectedMonth}&year=${selectedYear}`
        );
        const raw =
          response.data?.data ?? response.data?.records ?? response.data;
        setAttendanceDetails(Array.isArray(raw) ? raw : []);
      } catch (error: any) {
        if (error?.status === 404 || error?.response?.status === 404) {
          setAttendanceDetails([]);
        } else {
          Alert.alert(
            "Unable to load records",
            error?.message || "Please try again."
          );
        }
      } finally {
        setAttendanceLoading(false);
      }
    },
    [selectedMonth, selectedYear]
  );

  useEffect(() => {
    if (tab === "Attendance") loadAttendance();
  }, [tab, loadAttendance]);

  const loadTasks = useCallback(async () => {
    setTaskLoading(true);
    try {
      const [tasksResponse, assignmentsResponse] = await Promise.all([
        api.get("/trainee-tasks"),
        api.get("/trainee-task-assignments"),
      ]);
      const taskData = tasksResponse.data?.data ?? tasksResponse.data;
      setTasks(
        Array.isArray(taskData) ? taskData : taskData?.tasks || []
      );
      const assignmentData =
        assignmentsResponse.data?.data ?? assignmentsResponse.data;
      setTaskAssignments(
        Array.isArray(assignmentData)
          ? assignmentData
          : assignmentData?.assignments || []
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to load tasks",
        error?.message || "Please try again."
      );
    } finally {
      setTaskLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "Tasks" || tab === "Assign Task") loadTasks();
  }, [tab, loadTasks]);

  const remove = (member: Member) =>
    Alert.alert("Delete member", `Delete ${nameOf(member)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/trainee-intern/${member.uuid}`);
            setSelected(null);
            loadMembers(true);
          } catch (error: any) {
            Alert.alert(
              "Delete failed",
              error?.message || "Please try again."
            );
          }
        },
      },
    ]);

  // Tab 1: Member filters & stats
  const memberStats = {
    total: (members || []).length,
    active: (members || []).filter((item) => item?.status === "Active")
      .length,
    trainees: (members || []).filter((item) => item?.type === "Trainee")
      .length,
    interns: (members || []).filter((item) => item?.type === "Intern")
      .length,
  };

  const filteredMembers = (members || []).filter((member) => {
    if (!member) return false;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [
        member.full_name,
        member.person_id,
        member.email_address,
        member.mobile_number,
        member.department,
        member.designation,
        member.course,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    const matchesType =
      typeFilter === "All" ||
      !typeFilter ||
      (member.type || "").toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" ||
      !statusFilter ||
      (member.status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  // Tab 2: Attendance filtered list
  const attendanceList = Array.isArray(attendance) ? attendance : [];
  const membersList = Array.isArray(members) ? members : [];

  const displayAttendanceList = attendanceList.length
    ? attendanceList
    : membersList.map((member) => ({
        trainee_intern_id:
          member?.uuid || member?.id || member?.person_id,
        trainee_name: nameOf(member),
        person_id: member?.person_id || member?.personId,
        type: member?.type || "Trainee",
        status: member?.status || "Active",
        present_days: 0,
        absent_days: 0,
      }));

  const filteredAttendance = displayAttendanceList.filter((row) => {
    if (!row) return false;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [row.trainee_name, row.person_id, row.type].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(query)
      );
    const matchesType =
      attTypeFilter === "All" ||
      !attTypeFilter ||
      (row.type || "").toLowerCase() === attTypeFilter.toLowerCase();
    const matchesStatus =
      attStatusFilter === "All" ||
      !attStatusFilter ||
      (row.status || "").toLowerCase() === attStatusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPresentDays = attendanceList.reduce(
    (sum, r) => sum + (Number(r?.present_days) || 0),
    0
  );
  const totalAbsentDays = attendanceList.reduce(
    (sum, r) => sum + (Number(r?.absent_days) || 0),
    0
  );

  // Tab 3: Tasks filtered list
  const filteredTasks = (tasks || []).filter((task) => {
    if (!task) return false;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [task.task_name, task.description].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    const matchesDoc =
      taskDocFilter === "All" ||
      !taskDocFilter ||
      (taskDocFilter === "With Document" && Boolean(task.task_document)) ||
      (taskDocFilter === "Without Document" && !task.task_document);
    return matchesSearch && matchesDoc;
  });

  // Tab 4: Assigned Tasks filtered list
  const filteredTaskAssignments = (taskAssignments || []).filter(
    (assignment) => {
      if (!assignment) return false;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [
          assignment.task_name,
          assignment.trainee_name,
          assignment.status,
          assignment.assigned_date,
          assignment.due_date,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      const matchesStatus =
        assignStatusFilter === "All" ||
        !assignStatusFilter ||
        (assignment.status || "").toLowerCase() ===
          assignStatusFilter.toLowerCase();

      let matchesProgress = true;
      if (assignProgressFilter === "0") {
        matchesProgress = Number(assignment.progress) === 0;
      } else if (assignProgressFilter === "in_progress") {
        const prog = Number(assignment.progress);
        matchesProgress = prog > 0 && prog < 100;
      } else if (assignProgressFilter === "100") {
        matchesProgress = Number(assignment.progress) === 100;
      }

      return matchesSearch && matchesStatus && matchesProgress;
    }
  );

  /* ───────────────────────────────────────────────────────────
     RENDER TAB 1: MEMBERS
     ─────────────────────────────────────────────────────────── */
  const renderMembers = () => {
    const total = memberStats.total;
    const activePercent =
      total > 0
        ? ((memberStats.active / total) * 100).toFixed(1) + "%"
        : "0%";
    const traineePercent =
      total > 0
        ? ((memberStats.trainees / total) * 100).toFixed(1) + "%"
        : "0%";
    const internPercent =
      total > 0
        ? ((memberStats.interns / total) * 100).toFixed(1) + "%"
        : "0%";

    const dynamicStats = [
      {
        label: "Total Members",
        value: String(total),
        sub: "All Members",
        icon: "people",
        subColor: "text-orange-500",
      },
      {
        label: "Active",
        value: String(memberStats.active),
        sub: activePercent,
        icon: "person-add",
        subColor: "text-green-500",
      },
      {
        label: "Trainees",
        value: String(memberStats.trainees),
        sub: traineePercent,
        icon: "school",
        subColor: "text-violet-500",
      },
      {
        label: "Interns",
        value: String(memberStats.interns),
        sub: internPercent,
        icon: "book",
        subColor: "text-blue-500",
      },
    ];

    return (
      <>
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View
              key={idx}
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color="#f97316"
                    />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                      numberOfLines={2}
                    >
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold ${
                      stat.subColor || "text-gray-400"
                    }`}
                  >
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── SEARCH & FILTER (MATCHING TEAM SCREEN) ── */}
        <View className="mb-6">
          {/* Search Input */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search team members..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Dropdown Filters */}
          <View className="flex-row gap-3">
            {/* Status Dropdown */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setStatusDropdownOpen(true);
                  setTypeDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {statusFilter === "All" || !statusFilter
                    ? "All Status"
                    : statusFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Type / Role Dropdown */}
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setTypeDropdownOpen(true);
                  setStatusDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {typeFilter === "All" || !typeFilter
                    ? "All Types"
                    : typeFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Team Members ({filteredMembers.length})
          </Text>
        </View>

        {/* ── MEMBERS LIST ── */}
        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#f97316" />
            <Text className="mt-3 text-xs text-slate-400">
              Loading members...
            </Text>
          </View>
        ) : filteredMembers.length === 0 ? (
          <View className="items-center justify-center p-6 py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm mt-3">
              No team members found.
            </Text>
          </View>
        ) : (
          filteredMembers.map((member, idx) => {
            const isTrainee = (member.type || "Trainee") === "Trainee";
            const isInactive = member.status === "Inactive";
            const isOnLeave = member.status === "On Leave";

            const statusBg = isInactive
              ? "bg-red-100"
              : isOnLeave
              ? "bg-amber-100"
              : "bg-green-100";
            const statusColor = isInactive
              ? "text-red-600"
              : isOnLeave
              ? "text-amber-700"
              : "text-green-600";

            return (
              <TouchableOpacity
                key={member.uuid || idx}
                activeOpacity={0.88}
                onPress={() => setSelected(member)}
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm flex-row items-start justify-between"
              >
                {/* Left Side: Avatar and Info */}
                <View className="flex-row flex-1 mr-2">
                  <View className="mr-3.5">
                    <View className="w-13 h-13 rounded-full bg-orange-50 border border-orange-100 items-center justify-center">
                      <Text className="text-orange-600 font-black text-base">
                        {initials(nameOf(member))}
                      </Text>
                    </View>
                  </View>

                  {/* Info Block */}
                  <View className="flex-1 justify-center">
                    <View className="flex-row items-center mb-1.5 flex-wrap">
                      <Text className="text-slate-900 font-bold text-[15px] mr-2">
                        {nameOf(member)}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${
                          isTrainee ? "bg-orange-50" : "bg-blue-50"
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-bold ${
                            isTrainee
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        >
                          {member.type || "Trainee"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-1.5">
                      <Ionicons
                        name="briefcase-outline"
                        size={12}
                        color="#94a3b8"
                      />
                      <Text
                        className="text-slate-500 text-xs ml-1"
                        numberOfLines={1}
                      >
                        {member.person_id || member.personId || "TR-00"} •{" "}
                        {member.department ||
                          member.designation ||
                          member.course ||
                          "General"}
                      </Text>
                    </View>

                    <View className="flex-row items-center flex-wrap">
                      <View className="flex-row items-center mr-3 mb-1">
                        <Ionicons
                          name="mail-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-[10px] ml-1">
                          {member.email_address ||
                            member.official_email ||
                            "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row items-center mb-1">
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-500 text-[10px] ml-1">
                          {member.mobile_number || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Side: Status Badge & Actions */}
                <View className="justify-between items-end h-[68px]">
                  <View className={`px-2 py-1 rounded-md ${statusBg}`}>
                    <Text
                      className={`text-[9px] font-bold ${statusColor}`}
                    >
                      {member.status || "Active"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setAssignmentMember(member);
                      setAssignmentVisible(true);
                    }}
                    className={`mt-auto items-center rounded-full border px-2.5 py-1 ${
                      hasActiveAssignment(member)
                        ? "border-slate-300 bg-slate-100"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        hasActiveAssignment(member)
                          ? "text-slate-600"
                          : "text-orange-600"
                      }`}
                    >
                      {hasActiveAssignment(member)
                        ? "Reassign"
                        : "Assign"}
                    </Text>
                  </Pressable>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Filter Modals for Members */}
        <FilterDropdownModal
          visible={statusDropdownOpen}
          title="Select Status"
          options={[
            { label: "All Status", value: "All" },
            { label: "Active", value: "Active" },
            { label: "Completed", value: "Completed" },
            { label: "On Leave", value: "On Leave" },
            { label: "Inactive", value: "Inactive" },
          ]}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          onClose={() => setStatusDropdownOpen(false)}
        />

        <FilterDropdownModal
          visible={typeDropdownOpen}
          title="Select Type"
          options={[
            { label: "All Types", value: "All" },
            { label: "Trainee", value: "Trainee" },
            { label: "Intern", value: "Intern" },
          ]}
          selectedValue={typeFilter}
          onSelect={setTypeFilter}
          onClose={() => setTypeDropdownOpen(false)}
        />
      </>
    );
  };

  /* ───────────────────────────────────────────────────────────
     RENDER TAB 2: ATTENDANCE
     ─────────────────────────────────────────────────────────── */
  const renderAttendance = () => {
    const dynamicStats = [
      {
        label: "Total Trainees",
        value: String(membersList.length),
        sub: "All Members",
        icon: "people",
        subColor: "text-orange-500",
      },
      {
        label: "Present Days",
        value: String(totalPresentDays),
        sub: "This Month",
        icon: "checkmark-circle",
        subColor: "text-green-500",
      },
      {
        label: "Absent Days",
        value: String(totalAbsentDays),
        sub: "This Month",
        icon: "close-circle",
        subColor: "text-red-500",
      },
      {
        label: "Period",
        value: `${MONTH_SHORT[selectedMonth - 1]}`,
        sub: String(selectedYear),
        icon: "calendar",
        subColor: "text-violet-500",
      },
    ];

    return (
      <>
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View
              key={idx}
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color="#f97316"
                    />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                      numberOfLines={2}
                    >
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold ${
                      stat.subColor || "text-gray-400"
                    }`}
                  >
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── MONTH / YEAR SELECTOR & SEARCH / FILTER ── */}
        <View className="mb-6">
          {/* Month & Year Filter Pills */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setAttMonthDropdownOpen(true)}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {MONTH_NAMES[selectedMonth - 1]}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#f97316"
                />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setAttYearDropdownOpen(true)}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {selectedYear}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Input */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search attendance by name, ID..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Dropdown Filters (Status & Type) */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setAttStatusDropdownOpen(true);
                  setAttTypeDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {attStatusFilter === "All" || !attStatusFilter
                    ? "All Status"
                    : attStatusFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setAttTypeDropdownOpen(true);
                  setAttStatusDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {attTypeFilter === "All" || !attTypeFilter
                    ? "All Types"
                    : attTypeFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Attendance Records ({filteredAttendance.length})
          </Text>
        </View>

        {/* ── ATTENDANCE LIST ── */}
        {attendanceLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#f97316" />
            <Text className="mt-3 text-xs text-slate-400">
              Loading attendance...
            </Text>
          </View>
        ) : filteredAttendance.length ? (
          filteredAttendance.map((row, index) => {
            const rowId =
              row?.trainee_intern_id || row?.uuid || row?.id || index;
            const traineeName =
              row?.trainee_name || nameOf(row) || "Trainee";

            return (
              <TouchableOpacity
                key={String(rowId)}
                activeOpacity={0.88}
                onPress={() => {
                  setSelectedAttendanceMember(row);
                  if (row?.trainee_intern_id) {
                    loadAttendanceDetails(String(row.trainee_intern_id));
                  } else {
                    setAttendanceDetails([]);
                  }
                  setAttendanceDetailVisible(true);
                }}
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100">
                      <Text className="font-black text-orange-600 text-sm">
                        {initials(traineeName)}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-slate-900 text-base">
                        {traineeName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-500">
                        {row?.person_id || "ID"} •{" "}
                        {row?.type || "Trainee"}
                      </Text>
                    </View>
                  </View>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-orange-50 border border-orange-100">
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#f97316"
                    />
                  </View>
                </View>

                <View className="mt-3.5 flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-emerald-50/80 border border-emerald-100/60 p-3">
                    <Text className="text-[11px] font-bold text-emerald-800">
                      Present Days
                    </Text>
                    <Text className="mt-1 text-xl font-black text-emerald-700">
                      {Number(row?.present_days) || 0}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-rose-50/80 border border-rose-100/60 p-3">
                    <Text className="text-[11px] font-bold text-rose-800">
                      Absent Days
                    </Text>
                    <Text className="mt-1 text-xl font-black text-rose-700">
                      {Number(row?.absent_days) || 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center justify-center p-6 py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
            <Text className="mt-3 font-bold text-slate-500">
              {search
                ? "No records match your search."
                : "No attendance records found."}
            </Text>
          </View>
        )}

        {/* Filter Modals for Attendance */}
        <FilterDropdownModal
          visible={attMonthDropdownOpen}
          title="Select Month"
          options={MONTH_NAMES.map((name, idx) => ({
            label: name,
            value: String(idx + 1),
          }))}
          selectedValue={String(selectedMonth)}
          onSelect={(val) => {
            setSelectedMonth(Number(val));
            setAttendanceDetailVisible(false);
          }}
          onClose={() => setAttMonthDropdownOpen(false)}
        />

        <FilterDropdownModal
          visible={attYearDropdownOpen}
          title="Select Year"
          options={[
            selectedYear - 2,
            selectedYear - 1,
            selectedYear,
            selectedYear + 1,
          ].map((year) => ({
            label: String(year),
            value: String(year),
          }))}
          selectedValue={String(selectedYear)}
          onSelect={(val) => {
            setSelectedYear(Number(val));
            setAttendanceDetailVisible(false);
          }}
          onClose={() => setAttYearDropdownOpen(false)}
        />

        <FilterDropdownModal
          visible={attStatusDropdownOpen}
          title="Select Status"
          options={[
            { label: "All Status", value: "All" },
            { label: "Active", value: "Active" },
            { label: "On Leave", value: "On Leave" },
            { label: "Inactive", value: "Inactive" },
          ]}
          selectedValue={attStatusFilter}
          onSelect={setAttStatusFilter}
          onClose={() => setAttStatusDropdownOpen(false)}
        />

        <FilterDropdownModal
          visible={attTypeDropdownOpen}
          title="Select Type"
          options={[
            { label: "All Types", value: "All" },
            { label: "Trainee", value: "Trainee" },
            { label: "Intern", value: "Intern" },
          ]}
          selectedValue={attTypeFilter}
          onSelect={setAttTypeFilter}
          onClose={() => setAttTypeDropdownOpen(false)}
        />
      </>
    );
  };

  /* ───────────────────────────────────────────────────────────
     RENDER TAB 3: TASKS
     ─────────────────────────────────────────────────────────── */
  const renderTasks = () => {
    const dynamicStats = [
      {
        label: "Total Tasks",
        value: String(tasks.length),
        sub: "All Tasks",
        icon: "checkbox",
        subColor: "text-orange-500",
      },
      {
        label: "Assigned",
        value: String(taskAssignments.length),
        sub: "All Time",
        icon: "checkmark-done",
        subColor: "text-green-500",
      },
    ];

    return (
      <>
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View
              key={idx}
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color="#f97316"
                    />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                      numberOfLines={2}
                    >
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold ${
                      stat.subColor || "text-gray-400"
                    }`}
                  >
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── SEARCH & FILTER ── */}
        <View className="mb-6">
          {/* Search Input */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search tasks by title or description..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Document Filter Dropdown */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setTaskDocDropdownOpen(true)}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {taskDocFilter === "All" || !taskDocFilter
                    ? "All Tasks"
                    : taskDocFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Task Master ({filteredTasks.length})
          </Text>
        </View>

        {/* ── TASKS LIST ── */}
        {taskLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#f97316" />
            <Text className="mt-3 text-xs text-slate-400">
              Loading tasks...
            </Text>
          </View>
        ) : filteredTasks.length ? (
          filteredTasks.map((task, idx) => (
            <View
              key={task.uuid || idx}
              className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1 mr-2">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 mr-3">
                    <Ionicons
                      name="clipboard-outline"
                      size={22}
                      color="#f97316"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900 text-base">
                      {task.task_name || "Untitled task"}
                    </Text>
                    {task.description ? (
                      <Text className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {task.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {task.task_document ? (
                <View className="mt-3 pt-3 border-t border-slate-100 flex-row items-center">
                  <Ionicons
                    name="document-attach-outline"
                    size={14}
                    color="#f97316"
                  />
                  <Text
                    className="ml-1.5 text-xs font-semibold text-orange-600 flex-1"
                    numberOfLines={1}
                  >
                    Attached Document
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View className="items-center justify-center p-6 py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <Ionicons name="checkbox-outline" size={40} color="#cbd5e1" />
            <Text className="mt-3 font-bold text-slate-500">
              {search
                ? "No matching tasks found."
                : "No trainee tasks found."}
            </Text>
          </View>
        )}

        {/* Filter Modal for Tasks */}
        <FilterDropdownModal
          visible={taskDocDropdownOpen}
          title="Filter Tasks"
          options={[
            { label: "All Tasks", value: "All" },
            { label: "With Document", value: "With Document" },
            { label: "Without Document", value: "Without Document" },
          ]}
          selectedValue={taskDocFilter}
          onSelect={setTaskDocFilter}
          onClose={() => setTaskDocDropdownOpen(false)}
        />
      </>
    );
  };

  /* ───────────────────────────────────────────────────────────
     RENDER TAB 4: ASSIGN TASK
     ─────────────────────────────────────────────────────────── */
  const renderTaskAssignments = () => {
    const inProgressCount = taskAssignments.filter(
      (t) => t.status === "In Progress"
    ).length;
    const completedCount = taskAssignments.filter(
      (t) => t.status === "Completed"
    ).length;
    const pendingCount = taskAssignments.filter(
      (t) => t.status === "Pending" || !t.status
    ).length;

    const dynamicStats = [
      {
        label: "Total Assigned",
        value: String(taskAssignments.length),
        sub: "All Tasks",
        icon: "list",
        subColor: "text-orange-500",
      },
      {
        label: "In Progress",
        value: String(inProgressCount),
        sub: "Active Work",
        icon: "time",
        subColor: "text-blue-500",
      },
      {
        label: "Completed",
        value: String(completedCount),
        sub: "Finished",
        icon: "checkmark-circle",
        subColor: "text-green-500",
      },
      {
        label: "Pending",
        value: String(pendingCount),
        sub: "To Do",
        icon: "alert-circle",
        subColor: "text-amber-500",
      },
    ];

    return (
      <>
        {/* ── STATS SECTION ── */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {dynamicStats.map((stat, idx) => (
            <View
              key={idx}
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
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
              >
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons
                      name={stat.icon as any}
                      size={20}
                      color="#f97316"
                    />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
                      numberOfLines={2}
                    >
                      {stat.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-[22px] font-black text-black">
                    {stat.value}
                  </Text>
                  <Text
                    className={`text-[10px] font-bold ${
                      stat.subColor || "text-gray-400"
                    }`}
                  >
                    {stat.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* ── SEARCH & FILTER ── */}
        <View className="mb-6">
          {/* Search Input */}
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search assignment, task, trainee..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm font-medium text-slate-800"
            />
            {search ? (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Dropdown Filters (Status & Progress) */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setAssignStatusDropdownOpen(true);
                  setAssignProgressDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {assignStatusFilter === "All" || !assignStatusFilter
                    ? "All Status"
                    : assignStatusFilter}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setAssignProgressDropdownOpen(true);
                  setAssignStatusDropdownOpen(false);
                }}
                className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
              >
                <Text
                  className="text-xs font-medium text-slate-700"
                  numberOfLines={1}
                >
                  {assignProgressFilter === "All" || !assignProgressFilter
                    ? "All Progress"
                    : assignProgressFilter === "0"
                    ? "Not Started (0%)"
                    : assignProgressFilter === "in_progress"
                    ? "In Progress (1-99%)"
                    : "Completed (100%)"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── LIST HEADER ── */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-slate-800 font-bold text-sm">
            Assigned Tasks ({filteredTaskAssignments.length})
          </Text>
        </View>

        {/* ── ASSIGNMENTS LIST ── */}
        {taskLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#f97316" />
            <Text className="mt-3 text-xs text-slate-400">
              Loading assignments...
            </Text>
          </View>
        ) : filteredTaskAssignments.length ? (
          filteredTaskAssignments.map((assignment, index) => {
            const status = assignment.status || "Pending";
            const progress = Number(assignment.progress) || 0;

            const isCompleted = status === "Completed" || progress === 100;
            const isInProgress = status === "In Progress";
            const isReview = status === "Review";

            const badgeBg = isCompleted
              ? "bg-emerald-100"
              : isInProgress
              ? "bg-blue-100"
              : isReview
              ? "bg-purple-100"
              : "bg-amber-100";

            const badgeText = isCompleted
              ? "text-emerald-700"
              : isInProgress
              ? "text-blue-700"
              : isReview
              ? "text-purple-700"
              : "text-amber-700";

            return (
              <View
                key={assignment.uuid || index}
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 text-base">
                      {assignment.task_name || "Untitled task"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="person-outline"
                        size={12}
                        color="#94a3b8"
                      />
                      <Text className="text-xs font-semibold text-slate-600 ml-1">
                        {assignment.trainee_name || "Trainee / Intern"}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full ${badgeBg}`}>
                    <Text className={`text-[10px] font-bold ${badgeText}`}>
                      {status}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="mt-3.5">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-[11px] font-semibold text-slate-500">
                      Progress
                    </Text>
                    <Text className="text-[11px] font-extrabold text-orange-600">
                      {progress}%
                    </Text>
                  </View>
                  <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <View
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      className={`h-full rounded-full ${
                        isCompleted ? "bg-emerald-500" : "bg-orange-500"
                      }`}
                    />
                  </View>
                </View>

                {/* Dates footer */}
                <View className="mt-3 pt-3 border-t border-slate-100 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#94a3b8"
                    />
                    <Text className="text-[10px] font-medium text-slate-500 ml-1">
                      Assigned:{" "}
                      {assignment.assigned_date?.slice?.(0, 10) || "-"}
                    </Text>
                  </View>
                  {assignment.due_date ? (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color="#f97316"
                      />
                      <Text className="text-[10px] font-bold text-orange-600 ml-1">
                        Due: {assignment.due_date?.slice?.(0, 10)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center p-6 py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <Ionicons name="list-outline" size={40} color="#cbd5e1" />
            <Text className="mt-3 font-bold text-slate-500">
              {search
                ? "No matching assignments found."
                : "No task assignments found."}
            </Text>
          </View>
        )}

        {/* Filter Modals for Assign Task */}
        <FilterDropdownModal
          visible={assignStatusDropdownOpen}
          title="Select Status"
          options={[
            { label: "All Status", value: "All" },
            { label: "Pending", value: "Pending" },
            { label: "In Progress", value: "In Progress" },
            { label: "Review", value: "Review" },
            { label: "Completed", value: "Completed" },
          ]}
          selectedValue={assignStatusFilter}
          onSelect={setAssignStatusFilter}
          onClose={() => setAssignStatusDropdownOpen(false)}
        />

        <FilterDropdownModal
          visible={assignProgressDropdownOpen}
          title="Select Progress"
          options={[
            { label: "All Progress", value: "All" },
            { label: "Not Started (0%)", value: "0" },
            { label: "In Progress (1-99%)", value: "in_progress" },
            { label: "Completed (100%)", value: "100" },
          ]}
          selectedValue={assignProgressFilter}
          onSelect={setAssignProgressFilter}
          onClose={() => setAssignProgressDropdownOpen(false)}
        />
      </>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* ── TOP NAV BAR ── */}
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
        <Pressable
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
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
          Trainee & Internship
        </Text>
      </View>

      {/* ── TABS SELECTOR ── */}
      <View
        style={{
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {["Members", "Attendance", "Tasks", "Assign Task"].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setTab(item);
                setSearch("");
              }}
              style={{
                paddingVertical: 14,
                marginRight: 24,
                borderBottomWidth: 2,
                borderBottomColor: tab === item ? "#f97316" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: tab === item ? "700" : "600",
                  color: tab === item ? "#f97316" : "#64748b",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              tab === "Attendance"
                ? loadAttendance()
                : tab === "Tasks" || tab === "Assign Task"
                ? loadTasks()
                : loadMembers(true)
            }
            tintColor="#f97316"
          />
        }
      >
        {tab === "Members"
          ? renderMembers()
          : tab === "Attendance"
          ? renderAttendance()
          : tab === "Tasks"
          ? renderTasks()
          : renderTaskAssignments()}
      </ScrollView>

      {/* ── ACTION MODALS ── */}
      <TraineeForm
        visible={formVisible}
        member={editing}
        onClose={() => setFormVisible(false)}
        onSaved={() => loadMembers(true)}
      />
      <AssignmentModal
        visible={assignmentVisible}
        member={assignmentMember}
        employees={employees}
        onClose={() => setAssignmentVisible(false)}
        onSaved={() => loadMembers(true)}
      />
      <AttendanceModal
        visible={attendanceVisible}
        members={members}
        onClose={() => setAttendanceVisible(false)}
        onSaved={loadAttendance}
      />
      <AttendanceDetailModal
        visible={attendanceDetailVisible}
        member={selectedAttendanceMember}
        attendanceRecords={attendanceDetails}
        onClose={() => setAttendanceDetailVisible(false)}
      />
      <TaskMasterModal
        visible={taskVisible}
        onClose={() => setTaskVisible(false)}
        onSaved={loadTasks}
      />
      <TaskAssignmentModal
        visible={taskAssignmentVisible}
        members={members}
        tasks={tasks}
        onClose={() => setTaskAssignmentVisible(false)}
        onSaved={loadTasks}
      />
      {selected && (
        <DetailModal
          member={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
            setFormVisible(true);
          }}
          onDelete={() => remove(selected)}
        />
      )}

      {/* Floating Action Button */}
      <FAB
        onPress={() => {
          if (tab === "Members") {
            setEditing(null);
            setFormVisible(true);
          } else if (tab === "Attendance") {
            setAttendanceVisible(true);
          } else if (tab === "Tasks") {
            setTaskVisible(true);
          } else if (tab === "Assign Task") {
            setTaskAssignmentVisible(true);
          }
        }}
        style={{ bottom: 32 }}
      />
    </SafeAreaView>
  );
}
