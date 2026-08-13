import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api";

type Member = Record<string, any>;
type Employee = { employee_id: string | number; first_name?: string; last_name?: string; employee_code?: string; designation?: string };
const types = ["All", "Trainee", "Intern"];
const statuses = ["All", "Active", "Completed", "On Leave", "Inactive"];
const uploadFields = ["profile_photo", "resume", "college_id_doc", "offer_letter", "internship_letter"] as const;
const emptyForm: Record<string, any> = { person_id: "", full_name: "", type: "Trainee", department: "", designation: "", reporting_manager: "", joining_date: "", end_date: "", status: "Active", mobile_number: "", email_address: "", current_address: "", emergency_contact_name: "", emergency_contact_number: "", college_university: "", course: "", academic_department: "", year_semester: "", college_id_number: "", guide_name: "", username: "", official_email: "", password: "" };
const inputClass = "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900";
const nameOf = (member: Member) => member.full_name || "Unnamed member";
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
  return date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
};
const joiningDateOf = (member: Member) => member.joining_date || member.joiningDate || member.joined_date || member.date_joined || member.created_at || "";
const initials = (name: string) => name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
const employeeName = (employee: Employee) => `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.employee_code || "Employee";

function Field({ label, value, onChange, placeholder = "", multiline = false, secure = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; secure?: boolean }) {
  return <View className="mb-3"><Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text><TextInput value={value || ""} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#94a3b8" secureTextEntry={secure} multiline={multiline} numberOfLines={multiline ? 3 : 1} textAlignVertical={multiline ? "top" : "center"} className={inputClass} /></View>;
}

function Choices({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) {
  return <View className="mb-3"><Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text><View className="flex-row flex-wrap gap-2">{values.filter((item) => item !== "All").map((item) => <Pressable key={item} onPress={() => onChange(item)} className={`rounded-full border px-3 py-2 ${value === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-xs font-bold ${value === item ? "text-orange-600" : "text-slate-500"}`}>{item}</Text></Pressable>)}</View></View>;
}

function AssignmentModal({ visible, member, employees, onClose, onSaved }: { visible: boolean; member: Member | null; employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (visible) setEmployeeId(String(member?.assigned_employee_id || member?.employee_id || "")); }, [visible, member]);
  const submit = async () => {
    if (!member || !employeeId) return Alert.alert("Select employee", "Please select an employee to assign.");
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
      Alert.alert("Unable to assign employee", error?.message || "The assignment endpoint may not be available on the server.");
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View className="flex-1 justify-end bg-black/50"><View className="max-h-[90%] rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: '90%' }}><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">Assign Employee</Text><Text className="mt-1 text-xs text-white/70">{member ? nameOf(member) : ""}</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><View className="flex-1"><ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>{employees.map((employee) => <Pressable key={String(employee.employee_id)} onPress={() => setEmployeeId(String(employee.employee_id))} className={`mb-2 flex-row items-center rounded-2xl border p-3 ${employeeId === String(employee.employee_id) ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}><View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Text className="font-black text-blue-600">{initials(employeeName(employee))}</Text></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-800">{employeeName(employee)}</Text><Text className="mt-1 text-xs text-slate-500">{employee.employee_code || ""}{employee.designation ? ` - ${employee.designation}` : ""}</Text></View><Ionicons name={employeeId === String(employee.employee_id) ? "radio-button-on" : "radio-button-off"} size={21} color={employeeId === String(employee.employee_id) ? "#f97316" : "#94a3b8"} /></Pressable>)}</ScrollView></View><Pressable disabled={saving} onPress={submit} className="mx-5 mb-5 items-center rounded-xl bg-orange-500 py-3"><Text className="font-bold text-white">{saving ? "Saving..." : "Assign / Reassign"}</Text></Pressable></View></View></Modal>;
}

function TraineeForm({ visible, member, onClose, onSaved }: { visible: boolean; member: Member | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(emptyForm); const [files, setFiles] = useState<Record<string, DocumentPicker.DocumentPickerAsset>>({}); const [saving, setSaving] = useState(false); const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { if (!visible) return; setFiles({}); setForm(member ? { ...emptyForm, ...member, joining_date: joiningDateOf(member)?.slice?.(0, 10) || "", end_date: member.end_date?.slice?.(0, 10) || "", password: "" } : { ...emptyForm }); }, [visible, member]);
  useEffect(() => { if (!visible || member || form.person_id) return; api.get("/trainee-intern/next-person-id").then((response) => { if (response.data?.code) set("person_id", response.data.code); }).catch(() => undefined); }, [visible, member, form.person_id]);
  const chooseFile = async (field: string) => { const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true }); if (!result.canceled && result.assets?.[0]) setFiles((current) => ({ ...current, [field]: result.assets[0] })); };
  const save = async () => { if (!form.full_name?.trim()) return Alert.alert("Required field", "Full name is required."); if (!member && !form.mobile_number) return Alert.alert("Required field", "Mobile number is required."); setSaving(true); try { const body = new FormData(); Object.entries(form).forEach(([key, value]) => { if (value !== "" && value !== null && value !== undefined) body.append(key, String(value)); }); Object.entries(files).forEach(([field, file]) => body.append(field, { uri: file.uri, name: file.name || field, type: file.mimeType || "application/octet-stream" } as unknown as Blob)); if (member) await api.put(`/trainee-intern/${member.uuid}`, body, { headers: { "Content-Type": "multipart/form-data" } }); else await api.post("/trainee-intern", body, { headers: { "Content-Type": "multipart/form-data" } }); Alert.alert("Success", member ? "Member updated successfully." : "Member created successfully."); onSaved(); onClose(); } catch (error: any) { Alert.alert("Unable to save member", error?.message || "Please try again."); } finally { setSaving(false); } };
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">{member ? "Edit Member" : "Add Trainee / Intern"}</Text><Text className="mt-1 text-xs text-white/70">Profile, credentials, academics and documents.</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 10 }}><View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-4 text-base font-black text-slate-900">Basic Information</Text><Field label="Person ID" value={form.person_id} onChange={(value) => set("person_id", value)} /><Field label="Full Name *" value={form.full_name} onChange={(value) => set("full_name", value)} /><Choices label="Type" values={types} value={form.type} onChange={(value) => set("type", value)} /><Field label="Department" value={form.department} onChange={(value) => set("department", value)} /><Field label="Designation" value={form.designation} onChange={(value) => set("designation", value)} /><Field label="Reporting Manager" value={form.reporting_manager} onChange={(value) => set("reporting_manager", value)} /><Field label="Joining Date (YYYY-MM-DD)" value={form.joining_date} onChange={(value) => set("joining_date", value)} /><Field label="End Date (YYYY-MM-DD)" value={form.end_date} onChange={(value) => set("end_date", value)} /><Choices label="Status" values={statuses} value={form.status} onChange={(value) => set("status", value)} /></View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-4 text-base font-black text-slate-900">Contact Information</Text><Field label="Mobile Number" value={form.mobile_number} onChange={(value) => set("mobile_number", value)} /><Field label="Email Address" value={form.email_address} onChange={(value) => set("email_address", value)} /><Field label="Current Address" value={form.current_address} onChange={(value) => set("current_address", value)} multiline /><Field label="Emergency Contact Name" value={form.emergency_contact_name} onChange={(value) => set("emergency_contact_name", value)} /><Field label="Emergency Contact Number" value={form.emergency_contact_number} onChange={(value) => set("emergency_contact_number", value)} /></View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-4 text-base font-black text-slate-900">Login Credentials</Text><Field label="Username" value={form.username} onChange={(value) => set("username", value)} /><Field label="Official Email" value={form.official_email} onChange={(value) => set("official_email", value)} /><Field label={member ? "Password (optional)" : "Password"} value={form.password} onChange={(value) => set("password", value)} secure /></View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-4 text-base font-black text-slate-900">Academic Information</Text><Field label="College / University" value={form.college_university} onChange={(value) => set("college_university", value)} /><Field label="Course" value={form.course} onChange={(value) => set("course", value)} /><Field label="Academic Department" value={form.academic_department} onChange={(value) => set("academic_department", value)} /><Field label="Year / Semester" value={form.year_semester} onChange={(value) => set("year_semester", value)} /><Field label="College ID Number" value={form.college_id_number} onChange={(value) => set("college_id_number", value)} /><Field label="Guide Name" value={form.guide_name} onChange={(value) => set("guide_name", value)} /></View><View className="mt-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-1 text-base font-black text-slate-900">Documents</Text><Text className="mb-4 text-xs text-slate-500">Select profile photo, resume, ID, offer, or internship documents.</Text>{uploadFields.map((field) => <Pressable key={field} onPress={() => chooseFile(field)} className="mb-2 flex-row items-center rounded-xl border border-dashed border-slate-300 p-3"><Ionicons name="cloud-upload-outline" size={20} color="#f97316" /><View className="ml-3 flex-1"><Text className="text-sm font-bold text-slate-700">{field.replace(/_/g, " ")}</Text><Text className="mt-1 text-xs text-slate-400">{files[field]?.name || "Tap to choose file"}</Text></View></Pressable>)}</View><Pressable disabled={saving} onPress={save} className="mt-5 items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-50"><Text className="font-black text-white">{saving ? "Saving..." : member ? "Update Member" : "Save Member"}</Text></Pressable></ScrollView></View></Modal>;
}

function DetailModal({ member, onClose, onEdit, onDelete }: { member: Member; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  return <Modal visible animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">{nameOf(member)}</Text><Text className="mt-1 text-xs text-white/70">{member.person_id || "Trainee / Intern"}</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 10 }}><View className="items-center rounded-3xl bg-white p-5 shadow-sm"><View className="h-20 w-20 items-center justify-center rounded-3xl bg-orange-100"><Text className="text-2xl font-black text-orange-600">{initials(nameOf(member))}</Text></View><Text className="mt-3 text-xl font-black text-slate-900">{nameOf(member)}</Text><Text className="mt-1 text-sm text-slate-500">{member.type} - {member.status}</Text></View><View className="mt-4 rounded-3xl bg-white p-4 shadow-sm">{[["Department", member.department], ["Designation", member.designation], ["Reporting Manager", member.reporting_manager], ["Mobile", member.mobile_number], ["Email", member.email_address], ["Joining Date", dateText(joiningDateOf(member))], ["End Date", dateText(member.end_date)], ["College", member.college_university], ["Course", member.course], ["Academic Department", member.academic_department], ["Year / Semester", member.year_semester], ["Guide", member.guide_name]].map(([label, value]) => value ? <View key={label} className="border-b border-slate-100 py-3"><Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</Text><Text className="mt-1 text-sm text-slate-700">{String(value)}</Text></View> : null)}</View><View className="mt-4 flex-row gap-3"><Pressable onPress={onEdit} className="flex-1 items-center rounded-xl border border-orange-500 py-3"><Text className="font-bold text-orange-600">Edit</Text></Pressable><Pressable onPress={onDelete} className="flex-1 items-center rounded-xl bg-rose-600 py-3"><Text className="font-bold text-white">Delete</Text></Pressable></View></ScrollView></View></Modal>;
}

type AttendanceRow = { trainee_intern_id?: string; trainee_name?: string; person_id?: string; type?: string; present_days?: number; absent_days?: number };
const attendanceDate = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };

function AttendanceModal({ visible, members, onClose, onSaved }: { visible: boolean; members: Member[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ trainee_intern_id: "", date: attendanceDate(), check_in_time: "", check_out_time: "", attendance_status: "Present", location: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { if (visible) setForm((current) => ({ ...current, date: attendanceDate() })); }, [visible]);
  const save = async () => {
    if (!form.trainee_intern_id) return Alert.alert("Required field", "Please select a trainee or intern.");
    if (!form.date) return Alert.alert("Required field", "Please enter the attendance date.");
    setSaving(true);
    try {
      await api.post("/trainee-intern-attendance", form);
      Alert.alert("Saved", "Trainee/intern attendance recorded successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert("Unable to save attendance", error?.message || "Please try again.");
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">Mark Attendance</Text><Text className="mt-1 text-xs text-white/70">Create or update a trainee/intern record.</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 10 }}><View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="mb-3 text-xs font-bold text-slate-500">Trainee / Intern</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">{members.map((member) => <Pressable key={String(member.uuid)} onPress={() => set("trainee_intern_id", String(member.uuid))} className={`mr-2 rounded-full border px-3 py-2 ${form.trainee_intern_id === String(member.uuid) ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-xs font-bold ${form.trainee_intern_id === String(member.uuid) ? "text-orange-600" : "text-slate-500"}`}>{nameOf(member)}</Text></Pressable>)}</ScrollView><Field label="Date (YYYY-MM-DD)" value={form.date} onChange={(value) => set("date", value)} /><Text className="mb-2 text-xs font-bold text-slate-500">Attendance Status</Text><View className="mb-3 flex-row flex-wrap gap-2">{["Present", "Absent"].map((status) => <Pressable key={status} onPress={() => set("attendance_status", status)} className={`rounded-full border px-3 py-2 ${form.attendance_status === status ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${form.attendance_status === status ? "text-orange-600" : "text-slate-500"}`}>{status}</Text></Pressable>)}</View><Field label="Check-in Time (HH:MM)" value={form.check_in_time} onChange={(value) => set("check_in_time", value)} placeholder="09:30" /><Field label="Check-out Time (HH:MM)" value={form.check_out_time} onChange={(value) => set("check_out_time", value)} placeholder="18:00" /><Field label="Location" value={form.location} onChange={(value) => set("location", value)} placeholder="Optional location" /><Pressable disabled={saving} onPress={save} className="mt-2 items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"><Text className="font-bold text-white">{saving ? "Saving..." : "Save / Update"}</Text></Pressable></View></ScrollView></View></Modal>;
}

type TraineeTask = { uuid: string; task_name?: string; description?: string };
type TaskAssignment = { uuid?: string; trainee_name?: string; task_name?: string; assigned_date?: string; due_date?: string; status?: string; progress?: number; daily_report?: string };

function TaskMasterModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!taskName.trim()) return Alert.alert("Required field", "Please enter a task name.");
    setSaving(true);
    try {
      const body = new FormData();
      body.append("task_name", taskName.trim());
      body.append("description", description.trim());
      await api.post("/trainee-tasks", body, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Saved", "Task created successfully.");
      setTaskName("");
      setDescription("");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert("Unable to create task", error?.message || "Please try again.");
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">Create Task</Text><Text className="mt-1 text-xs text-white/70">Add a reusable task for trainees and interns.</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}><View className="rounded-3xl bg-white p-4 shadow-sm"><Field label="Task Name *" value={taskName} onChange={setTaskName} placeholder="Enter task name" /><Field label="Description" value={description} onChange={setDescription} placeholder="Optional task description" multiline /><Pressable disabled={saving} onPress={save} className="items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"><Text className="font-bold text-white">{saving ? "Saving..." : "Save Task"}</Text></Pressable></View></ScrollView></View></Modal>;
}

function TaskAssignmentModal({ visible, members, tasks, onClose, onSaved }: { visible: boolean; members: Member[]; tasks: TraineeTask[]; onClose: () => void; onSaved: () => void }) {
  const [taskUuid, setTaskUuid] = useState("");
  const [memberUuid, setMemberUuid] = useState("");
  const [assignedDate, setAssignedDate] = useState(attendanceDate());
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!taskUuid || !memberUuid || !assignedDate) return Alert.alert("Required fields", "Select a task, trainee/intern, and assigned date.");
    setSaving(true);
    try {
      const body = new FormData();
      body.append("trainee_task_uuid", taskUuid);
      body.append("trainee_intern_uuid", memberUuid);
      body.append("assigned_date", assignedDate);
      body.append("assigned_time", "");
      body.append("due_date", dueDate);
      await api.post("/trainee-task-assignments", body, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Assigned", "Task assigned successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert("Unable to assign task", error?.message || "Please try again.");
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View className="flex-1 bg-[#f8fafc]"><View className="bg-black px-5 py-4 flex-row items-center justify-between"><View><Text className="text-lg font-black text-orange-500">Assign Task</Text><Text className="mt-1 text-xs text-white/70">Assign work to a trainee or intern.</Text></View><Pressable onPress={onClose}><Ionicons name="close-circle" size={28} color="#f97316" /></Pressable></View><ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}><View className="rounded-3xl bg-white p-4 shadow-sm"><Text className="mb-2 text-xs font-bold text-slate-500">Select Task *</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">{tasks.map((task) => <Pressable key={task.uuid} onPress={() => setTaskUuid(task.uuid)} className={`mr-2 rounded-full border px-3 py-2 ${taskUuid === task.uuid ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${taskUuid === task.uuid ? "text-orange-600" : "text-slate-500"}`}>{task.task_name || "Untitled task"}</Text></Pressable>)}</ScrollView><Text className="mb-2 text-xs font-bold text-slate-500">Select Trainee / Intern *</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">{members.map((member) => <Pressable key={String(member.uuid)} onPress={() => setMemberUuid(String(member.uuid))} className={`mr-2 rounded-full border px-3 py-2 ${memberUuid === String(member.uuid) ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><Text className={`text-xs font-bold ${memberUuid === String(member.uuid) ? "text-orange-600" : "text-slate-500"}`}>{nameOf(member)}</Text></Pressable>)}</ScrollView><Field label="Assigned Date *" value={assignedDate} onChange={setAssignedDate} placeholder="YYYY-MM-DD" /><Field label="Due Date" value={dueDate} onChange={setDueDate} placeholder="YYYY-MM-DD" /><Pressable disabled={saving} onPress={save} className="items-center rounded-xl bg-orange-500 py-3 disabled:opacity-50"><Text className="font-bold text-white">{saving ? "Assigning..." : "Assign Task"}</Text></Pressable></View></ScrollView></View></Modal>;
}

export default function AdminTraineeScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]); const [employees, setEmployees] = useState<Employee[]>([]); const [attendance, setAttendance] = useState<AttendanceRow[]>([]); const [tasks, setTasks] = useState<TraineeTask[]>([]); const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]); const [loading, setLoading] = useState(true); const [attendanceLoading, setAttendanceLoading] = useState(false); const [taskLoading, setTaskLoading] = useState(false); const [refreshing, setRefreshing] = useState(false); const [search, setSearch] = useState(""); const [type, setType] = useState("All"); const [status, setStatus] = useState("All"); const [tab, setTab] = useState("Members"); const [attendanceVisible, setAttendanceVisible] = useState(false); const [taskVisible, setTaskVisible] = useState(false); const [taskAssignmentVisible, setTaskAssignmentVisible] = useState(false); const [formVisible, setFormVisible] = useState(false); const [assignmentVisible, setAssignmentVisible] = useState(false); const [editing, setEditing] = useState<Member | null>(null); const [selected, setSelected] = useState<Member | null>(null); const [assignmentMember, setAssignmentMember] = useState<Member | null>(null); const [typeDropdownOpen, setTypeDropdownOpen] = useState(false); const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const loadMembers = useCallback(async (refresh = false) => { if (refresh) setRefreshing(true); else setLoading(true); try { const query = new URLSearchParams({ page: "1", limit: "100" }); if (search) query.set("search", search); if (type !== "All") query.set("type", type); if (status !== "All") query.set("status", status); const membersResponse = await api.get(`/trainee-intern?${query.toString()}`); setMembers(membersResponse.data?.data || []); try { const employeesResponse = await api.get("/trainee-assignments/available-employees"); setEmployees(employeesResponse.data?.data || []); } catch { const employeesResponse = await api.get("/employees?limit=200"); setEmployees(employeesResponse.data?.data || employeesResponse.data?.employees || []); } } catch (error: any) { Alert.alert("Unable to load members", error?.message || "Please try again."); } finally { setLoading(false); setRefreshing(false); } }, [search, type, status]);
  useEffect(() => { loadMembers(); }, [loadMembers]);
  const loadAttendance = useCallback(async () => { setAttendanceLoading(true); try { const now = new Date(); const response = await api.get(`/trainee-intern-attendance/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`); setAttendance(response.data?.data || []); } catch (error: any) { Alert.alert("Unable to load attendance", error?.message || "Please try again."); } finally { setAttendanceLoading(false); } }, []);
  useEffect(() => { if (tab === "Attendance") loadAttendance(); }, [tab, loadAttendance]);
  const loadTasks = useCallback(async () => { setTaskLoading(true); try { const [tasksResponse, assignmentsResponse] = await Promise.all([api.get("/trainee-tasks"), api.get("/trainee-task-assignments")]); const taskData = tasksResponse.data?.data ?? tasksResponse.data; setTasks(Array.isArray(taskData) ? taskData : taskData?.tasks || []); const assignmentData = assignmentsResponse.data?.data ?? assignmentsResponse.data; setTaskAssignments(Array.isArray(assignmentData) ? assignmentData : assignmentData?.assignments || []); } catch (error: any) { Alert.alert("Unable to load tasks", error?.message || "Please try again."); } finally { setTaskLoading(false); } }, []);
  useEffect(() => { if (tab === "Tasks" || tab === "Assign Task") loadTasks(); }, [tab, loadTasks]);
  const remove = (member: Member) => Alert.alert("Delete member", `Delete ${nameOf(member)}?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await api.delete(`/trainee-intern/${member.uuid}`); setSelected(null); loadMembers(true); } catch (error: any) { Alert.alert("Delete failed", error?.message || "Please try again."); } } }]);
  const stats = { total: members.length, active: members.filter((item) => item.status === "Active").length, trainees: members.filter((item) => item.type === "Trainee").length, interns: members.filter((item) => item.type === "Intern").length };
    const renderMembers = () => (
      <>
        {/* Stats cards (like ExpensesTab) */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          {[{ label: 'Total', value: stats.total, icon: 'people' }, { label: 'Active', value: stats.active, icon: 'checkmark' }, { label: 'Trainees', value: stats.trainees, icon: 'school' }, { label: 'Interns', value: stats.interns, icon: 'book' }].map((stat, idx) => (
            <TouchableOpacity
              key={String(idx)}
              activeOpacity={0.9}
              className="mb-3 w-[48%] overflow-hidden rounded-2xl border border-orange-100"
              style={{
                shadowColor: '#f97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <LinearGradient colors={["#ffffff", "#fff7ed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-4 py-4">
                <View className="flex-row items-center mb-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                    <Ionicons name={stat.icon as any} size={20} color="#f97316" />
                  </View>
                  <View className="ml-2 flex-1">
                    <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">{stat.label}</Text>
                  </View>
                </View>
                <View className="mt-1 flex-col">
                  <Text className="text-[22px] font-black text-black">{stat.value}</Text>
                  <Text className={`text-[10px] font-bold mt-0.5 text-gray-400`}>{"All Time"}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search and filters (like ExpensesTab) */}
        <View className="mb-6">
          <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search name, email, or person ID..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm font-medium text-slate-800 h-10"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Pressable onPress={() => setTypeDropdownOpen(true)} className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-slate-700">{type || 'All'}</Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </Pressable>
            </View>
            <View className="flex-1">
              <Pressable onPress={() => setStatusDropdownOpen(true)} className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-slate-700">{status || 'All'}</Text>
                <Ionicons name="chevron-down" size={15} color="#64748b" />
              </Pressable>
            </View>
          </View>
        </View>

        <Text className="mb-3 mt-6 text-lg font-black text-slate-900">Member Directory</Text>

        {/* Members list */}
        {loading ? (
          <View className="items-center py-12"><ActivityIndicator color="#f97316" /></View>
        ) : members.length === 0 ? (
          <View className="items-center justify-center p-6 py-10">
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm mt-3">No members found</Text>
          </View>
        ) : (
          <View className="p-0">
            {members.map((member, i) => (
              <View key={member.uuid || i} className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-12 h-12 rounded-full items-center justify-center bg-orange-50">
                    <Text className="text-orange-600 font-black">{initials(nameOf(member))}</Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-slate-900">{nameOf(member)}</Text>
                    <Text className="mt-1 text-xs text-slate-500">{member.person_id || member.personId || 'Trainee'} • {member.type || 'Trainee'}</Text>
                    <Text className="mt-1 text-xs text-slate-400">{member.joining_date ? `Joined ${dateText(member.joining_date)}` : ''}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className={`text-sm font-bold ${member.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>{member.status || 'Active'}</Text>
                  <Pressable onPress={() => { setAssignmentMember(member); setAssignmentVisible(true); }} className="mt-3 items-center rounded-full border border-orange-200 px-3 py-1">
                    <Text className="text-xs font-bold text-orange-600">{member.assigned_employee_id ? 'Reassign' : 'Assign'}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </>
    );
  const renderAttendance = () => (<><View className="mb-6 flex-row flex-wrap justify-between">{[{ label: 'Total', value: members.length, icon: 'people' }, { label: 'Present Days', value: attendance.reduce((sum, r) => sum + (r.present_days || 0), 0), icon: 'checkmark' }, { label: 'Absent Days', value: attendance.reduce((sum, r) => sum + (r.absent_days || 0), 0), icon: 'close' }].map((stat, idx) => (<TouchableOpacity key={String(idx)} activeOpacity={0.9} className="mb-3 w-[48%] overflow-hidden rounded-2xl border border-orange-100" style={{ shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4, }}><LinearGradient colors={["#ffffff", "#fff7ed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-4 py-4"><View className="flex-row items-center mb-3"><View className="h-10 w-10 items-center justify-center rounded-xl bg-black"><Ionicons name={stat.icon as any} size={20} color="#f97316" /></View><View className="ml-2 flex-1"><Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">{stat.label}</Text></View></View><View className="mt-1 flex-col"><Text className="text-[22px] font-black text-black">{stat.value}</Text><Text className={`text-[10px] font-bold mt-0.5 text-gray-400`}>This Month</Text></View></LinearGradient></TouchableOpacity>))}</View><View className="mt-5 flex-row items-center justify-between"><View><Text className="text-xl font-black text-slate-900">Attendance</Text><Text className="mt-1 text-sm text-slate-500">This month&apos;s trainee and intern summary.</Text></View><Pressable onPress={() => setAttendanceVisible(true)} className="flex-row items-center rounded-xl bg-orange-500 px-3 py-2"><Ionicons name="add" size={17} color="white" /><Text className="ml-1 text-xs font-bold text-white">Mark</Text></Pressable></View>{attendanceLoading ? <View className="items-center py-12"><ActivityIndicator color="#f97316" /></View> : attendance.length ? attendance.map((row, index) => <View key={row.trainee_intern_id || index} className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><View className="flex-row items-center"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-50"><Text className="font-black text-orange-600">{initials(row.trainee_name || "Trainee")}</Text></View><View className="ml-3 flex-1"><Text className="font-bold text-slate-900">{row.trainee_name || "Unnamed member"}</Text><Text className="mt-1 text-xs text-slate-500">{row.person_id || "No person ID"} - {row.type || "Trainee / Intern"}</Text></View></View><View className="mt-4 flex-row gap-3"><View className="flex-1 rounded-xl bg-emerald-50 p-3"><Text className="text-xs text-emerald-700">Present</Text><Text className="mt-1 text-xl font-black text-emerald-700">{row.present_days || 0}</Text></View><View className="flex-1 rounded-xl bg-rose-50 p-3"><Text className="text-xs text-rose-700">Absent</Text><Text className="mt-1 text-xl font-black text-rose-700">{row.absent_days || 0}</Text></View></View></View>) : <View className="mt-5 items-center rounded-3xl border border-dashed border-slate-200 bg-white p-8"><Ionicons name="calendar-outline" size={34} color="#cbd5e1" /><Text className="mt-3 font-bold text-slate-500">No attendance records this month.</Text></View>}</>;
  const renderTasks = () => (
    <>
      {/* Stats cards for Tasks */}
      <View className="mb-6 flex-row flex-wrap justify-between">
        {[{ label: 'Total Tasks', value: tasks.length, icon: 'checkbox' }, { label: 'Assigned', value: taskAssignments.length, icon: 'checkmark-done' }].map((stat, idx) => (
          <TouchableOpacity
            key={String(idx)}
            activeOpacity={0.9}
            className="mb-3 w-[48%] overflow-hidden rounded-2xl border border-orange-100"
            style={{
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <LinearGradient colors={["#ffffff", "#fff7ed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-4 py-4">
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name={stat.icon as any} size={20} color="#f97316" />
                </View>
                <View className="ml-2 flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">{stat.label}</Text>
                </View>
              </View>
              <View className="mt-1 flex-col">
                <Text className="text-[22px] font-black text-black">{stat.value}</Text>
                <Text className={`text-[10px] font-bold mt-0.5 text-gray-400`}>All Time</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View><View className="mt-5 flex-row items-center justify-between"><View><Text className="text-xl font-black text-slate-900">Task Master</Text><Text className="mt-1 text-sm text-slate-500">Reusable tasks for trainees and interns.</Text></View><Pressable onPress={() => setTaskVisible(true)} className="flex-row items-center rounded-xl bg-orange-500 px-3 py-2"><Ionicons name="add" size={17} color="white" /><Text className="ml-1 text-xs font-bold text-white">New Task</Text></Pressable></View>{taskLoading ? <View className="items-center py-12"><ActivityIndicator color="#f97316" /></View> : tasks.length ? tasks.map((task) => <View key={task.uuid} className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><Text className="font-bold text-slate-900">{task.task_name || "Untitled task"}</Text><Text className="mt-2 text-sm text-slate-500">{task.description || "No description"}</Text></View>) : <View className="mt-5 items-center rounded-3xl border border-dashed border-slate-200 bg-white p-8"><Ionicons name="checkbox-outline" size={34} color="#cbd5e1" /><Text className="mt-3 font-bold text-slate-500">No trainee tasks found.</Text></View>}</>;
  const renderTaskAssignments = () => (
    <>
      {/* Stats cards for Assign Task */}
      <View className="mb-6 flex-row flex-wrap justify-between">
        {[{ label: 'Total Assigned', value: taskAssignments.length, icon: 'list' }, { label: 'In Progress', value: taskAssignments.filter(t => t.status === 'In Progress').length, icon: 'play' }].map((stat, idx) => (
          <TouchableOpacity
            key={String(idx)}
            activeOpacity={0.9}
            className="mb-3 w-[48%] overflow-hidden rounded-2xl border border-orange-100"
            style={{
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <LinearGradient colors={["#ffffff", "#fff7ed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-4 py-4">
              <View className="flex-row items-center mb-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
                  <Ionicons name={stat.icon as any} size={20} color="#f97316" />
                </View>
                <View className="ml-2 flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500">{stat.label}</Text>
                </View>
              </View>
              <View className="mt-1 flex-col">
                <Text className="text-[22px] font-black text-black">{stat.value}</Text>
                <Text className={`text-[10px] font-bold mt-0.5 text-gray-400`}>All Time</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View><View className="mt-5 flex-row items-center justify-between"><View><Text className="text-xl font-black text-slate-900">Assigned Tasks</Text><Text className="mt-1 text-sm text-slate-500">Track work assigned to trainees and interns.</Text></View><Pressable onPress={() => setTaskAssignmentVisible(true)} className="flex-row items-center rounded-xl bg-orange-500 px-3 py-2"><Ionicons name="add" size={17} color="white" /><Text className="ml-1 text-xs font-bold text-white">Assign</Text></Pressable></View>{taskLoading ? <View className="items-center py-12"><ActivityIndicator color="#f97316" /></View> : taskAssignments.length ? taskAssignments.map((assignment, index) => <View key={assignment.uuid || index} className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"><View className="flex-row items-start justify-between"><View className="flex-1"><Text className="font-bold text-slate-900">{assignment.task_name || "Untitled task"}</Text><Text className="mt-1 text-xs text-slate-500">{assignment.trainee_name || "Trainee / Intern"}</Text></View><Text className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">{assignment.status || "Pending"}</Text></View><View className="mt-3 flex-row justify-between"><Text className="text-xs text-slate-500">Assigned: {assignment.assigned_date?.slice?.(0, 10) || "-"}</Text><Text className="text-xs font-bold text-orange-600">{assignment.progress || 0}%</Text></View></View>) : <View className="mt-5 items-center rounded-3xl border border-dashed border-slate-200 bg-white p-8"><Ionicons name="list-outline" size={34} color="#cbd5e1" /><Text className="mt-3 font-bold text-slate-500">No task assignments found.</Text></View>}</>;
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Trainee & Internship</Text>
      </View><ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => tab === "Attendance" ? loadAttendance() : tab === "Tasks" || tab === "Assign Task" ? loadTasks() : loadMembers(true)} tintColor="#f97316" />}><View className="flex-row items-start justify-between"><View className="flex-1 pr-3"><Text className="text-3xl font-black text-slate-900">Trainees & Interns</Text><Text className="mt-1 text-sm text-slate-500">Manage profiles, attendance, tasks, and assignments.</Text></View><Pressable onPress={() => { if (tab === "Members") { setEditing(null); setFormVisible(true); } else if (tab === "Attendance") { setAttendanceVisible(true); } else if (tab === "Tasks") { setTaskVisible(true); } else if (tab === "Assign Task") { setTaskAssignmentVisible(true); } }} className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-500"><Ionicons name="add" size={25} color="white" /></Pressable></View><View className="mt-5 flex-row bg-white border-b border-slate-200">{["Members", "Attendance", "Tasks", "Assign Task"].map((item) => <Pressable key={item} onPress={() => setTab(item)} className="flex-1 items-center py-4" style={{borderBottomWidth: 2, borderBottomColor: tab === item ? "#f97316" : "transparent"}}><Text className={`text-xs font-bold ${tab === item ? "text-orange-500" : "text-slate-500"}`}>{item}</Text></Pressable>)}</View>{tab === "Members" ? renderMembers() : tab === "Attendance" ? renderAttendance() : tab === "Tasks" ? renderTasks() : renderTaskAssignments()}</ScrollView><TraineeForm visible={formVisible} member={editing} onClose={() => setFormVisible(false)} onSaved={() => loadMembers(true)} /><AssignmentModal visible={assignmentVisible} member={assignmentMember} employees={employees} onClose={() => setAssignmentVisible(false)} onSaved={() => loadMembers(true)} /><AttendanceModal visible={attendanceVisible} members={members} onClose={() => setAttendanceVisible(false)} onSaved={loadAttendance} /><TaskMasterModal visible={taskVisible} onClose={() => setTaskVisible(false)} onSaved={loadTasks} /><TaskAssignmentModal visible={taskAssignmentVisible} members={members} tasks={tasks} onClose={() => setTaskAssignmentVisible(false)} onSaved={loadTasks} />{selected && <DetailModal member={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); setFormVisible(true); }} onDelete={() => remove(selected)} />}</SafeAreaView>;
}
