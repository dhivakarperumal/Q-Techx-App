import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "expo-router";
import type { ReactNode } from "react";
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
  View,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

dayjs.extend(isSameOrAfter);

type Attachment = string | { originalName?: string; fileName?: string; path?: string };
type MyEvent = {
  id?: string;
  _id?: string;
  user_id?: string | number | null;
  userId?: string | number | null;
  employeeId?: string | number | null;
  planTitle?: string;
  title?: string;
  description?: string;
  planDate?: string;
  startDate?: string;
  plan_date?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: string;
  category?: string;
  eventType?: string;
  priority?: string;
  status?: string;
  project?: string;
  module?: string;
  task?: string;
  dailyGoal?: string;
  expectedOutcome?: string;
  checklistItems?: string[] | string;
  reminderDate?: string;
  reminderTime?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  tags?: string[] | string;
  progress?: number;
  plannedHours?: string;
  workedHours?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  energyLevel?: string;
  todaysAchievement?: string;
  challenges?: string;
  tomorrowsPlan?: string;
  attachments?: Attachment[];
  allDay?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  Meeting: "#3b82f6",
  "Client Call": "#a855f7",
  Training: "#10b981",
  Deadline: "#f43f5e",
  Birthday: "#ec4899",
  Holiday: "#14b8a6",
  Leave: "#f59e0b",
  Other: "#64748b",
};

const getEvents = (data: unknown): MyEvent[] => {
  if (Array.isArray(data)) return data as MyEvent[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: MyEvent[] }).data;
  }
  return [];
};

const dateValue = (event: MyEvent) => event.planDate || event.startDate || event.plan_date || "";
const eventDate = (event: MyEvent) => dayjs(dateValue(event));
const validDate = (date: dayjs.Dayjs) => date.isValid();
const eventName = (event: MyEvent) => event.planTitle || event.title || "Untitled Event";
const eventType = (event: MyEvent) => event.category || event.eventType || "Other";
const eventColor = (event: MyEvent) => CATEGORY_COLORS[eventType(event)] || CATEGORY_COLORS.Other;
const asList = (value?: string[] | string) => Array.isArray(value) ? value : (typeof value === 'string' && value.trim()) ? value.split(/,|\n|;/).map((item) => item.trim()).filter(Boolean) : [];

const defaultForm = (date: dayjs.Dayjs) => ({
  planTitle: "",
  description: "",
  planDate: date.format("YYYY-MM-DD"),
  startTime: "09:00",
  endTime: "10:00",
  estimatedDuration: "",
  category: "Meeting",
  priority: "Medium",
  status: "Pending",
  project: "",
  module: "",
  task: "",
  dailyGoal: "",
  expectedOutcome: "",
  checklistItems: [""],
  reminderDate: "",
  reminderTime: "",
  location: "",
  meetingLink: "",
  notes: "",
  tags: [""],
  progress: 0,
  plannedHours: "",
  workedHours: "",
  breakStartTime: "",
  breakEndTime: "",
  energyLevel: "Medium",
  todaysAchievement: "",
  challenges: "",
  tomorrowsPlan: "",
});

const inputStyle = {
  borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, backgroundColor: "#fff",
  paddingHorizontal: 14, paddingVertical: 12, color: "#0f172a", fontSize: 14, marginBottom: 12
} as const;

const CustomSelect = ({ label, value, options, onSelect }: { label: string, value: string, options: string[], onSelect: (val: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity onPress={() => setOpen(!open)} style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }]}>
        <Text style={{ color: value ? "#0f172a" : "#94a3b8" }}>{value || "Select..."}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
      </TouchableOpacity>
      {open && (
        <View style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, backgroundColor: "#fff", marginTop: 4, maxHeight: 150 }}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt, i) => (
              <TouchableOpacity key={i} onPress={() => { onSelect(opt); setOpen(false); }} style={{ padding: 12, borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: "#f1f5f9" }}>
                <Text style={{ color: "#0f172a" }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

function CreateEventModal({ visible, initialData, initialDate, userId, onClose, onSaved }: { visible: boolean; initialData?: MyEvent | null; initialDate: dayjs.Dayjs; userId?: string | number; onClose: () => void; onSaved: () => Promise<void> }) {
  const [formData, setFormData] = useState<any>(() => defaultForm(initialDate));
  const [documentFile, setDocumentFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Basic");

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setFormData({
          ...initialData,
          planTitle: initialData.planTitle || initialData.title || "",
          planDate: initialData.planDate || initialData.startDate || initialData.plan_date || "",
          category: initialData.category || initialData.eventType || "Meeting",
          checklistItems: asList(initialData.checklistItems).length ? asList(initialData.checklistItems) : [""],
          tags: asList(initialData.tags).length ? asList(initialData.tags) : [""],
        });
      } else {
        setFormData(defaultForm(initialDate));
      }
      setDocumentFile(null);
      setActiveTab("Basic");
    }
  }, [initialDate, initialData, visible]);

  const update = (field: string, value: string | number) => setFormData((c: any) => ({ ...c, [field]: value }));
  const updateArray = (field: "checklistItems" | "tags", index: number, value: string) => {
    setFormData((c: any) => {
      const newArr = [...c[field]];
      newArr[index] = value;
      return { ...c, [field]: newArr };
    });
  };
  const removeArrayItem = (field: "checklistItems" | "tags", index: number) => {
    setFormData((c: any) => {
      const newArr = c[field].length > 1 ? c[field].filter((_: any, i: number) => i !== index) : [""];
      return { ...c, [field]: newArr };
    });
  };
  const addArrayItem = (field: "checklistItems" | "tags") => setFormData((c: any) => ({ ...c, [field]: [...c[field], ""] }));

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (!result.canceled) setDocumentFile(result.assets[0]);
  };

  const save = async () => {
    if (!formData.planTitle.trim() || !formData.planDate || !formData.startTime || !formData.endTime) {
      Alert.alert("Required fields", "Please enter a title, date, start time, and end time.");
      return;
    }
    setSaving(true);
    try {
      const payloadData = new FormData();
      const payload: Record<string, any> = {
        ...formData,
        checklistItems: JSON.stringify(formData.checklistItems.map((i: string) => i.trim()).filter(Boolean)),
        tags: JSON.stringify(formData.tags.map((i: string) => i.trim()).filter(Boolean)),
        user_id: userId || "",
        progress: formData.progress || 0,
      };
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) payloadData.append(key, String(value));
      });
      if (documentFile) {
        payloadData.append("document", { uri: documentFile.uri, name: documentFile.name || "document", type: documentFile.mimeType || "application/octet-stream" } as unknown as Blob);
      }
      
      if (formData.id || formData._id) {
        await api.put(`/myevents/${formData.id || formData._id}`, payloadData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/myevents", payloadData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      await onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert("Unable to save", error?.response?.data?.message || error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, placeholder, multiline = false, keyboardType = "default" }: any) => (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={String(formData[field] || "")}
        onChangeText={(val) => update(field, val)}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[inputStyle, multiline && { minHeight: 80, textAlignVertical: "top" }]}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>{initialData ? "Edit Event" : "Plan My Day"}</Text>
            <Text style={{ marginTop: 3, color: "#64748b", fontSize: 13 }}>{initialData ? "Update your event details" : "Create a personal calendar event"}</Text>
          </View>
          <Pressable onPress={onClose} style={{ borderRadius: 20, backgroundColor: "#f1f5f9", padding: 8 }}><Ionicons name="close" size={20} color="#475569" /></Pressable>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {["Basic", "Details", "Work", "Tracking"].map(tab => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: activeTab === tab ? "#2563eb" : "transparent" }}>
                <Text style={{ fontSize: 14, fontWeight: activeTab === tab ? "700" : "500", color: activeTab === tab ? "#2563eb" : "#64748b" }}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          
          {activeTab === "Basic" && (
            <View>
              <Field label="Plan Title *" field="planTitle" placeholder="Enter plan title" />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Field label="Plan Date *" field="planDate" placeholder="YYYY-MM-DD" /></View>
                <View style={{ flex: 1 }}><CustomSelect label="Category *" value={formData.category} options={Object.keys(CATEGORY_COLORS)} onSelect={v => update("category", v)} /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Field label="Start Time *" field="startTime" placeholder="HH:MM" /></View>
                <View style={{ flex: 1 }}><Field label="End Time *" field="endTime" placeholder="HH:MM" /></View>
              </View>
              <Field label="Description" field="description" placeholder="Describe your plan" multiline />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><CustomSelect label="Priority" value={formData.priority} options={["Low", "Medium", "High", "Critical"]} onSelect={v => update("priority", v)} /></View>
                <View style={{ flex: 1 }}><CustomSelect label="Status" value={formData.status} options={["Pending", "In Progress", "Completed"]} onSelect={v => update("status", v)} /></View>
              </View>
              <Field label="Location" field="location" placeholder="Office, room, or address" />
              <Field label="Meeting Link" field="meetingLink" placeholder="https://..." />
            </View>
          )}

          {activeTab === "Details" && (
            <View>
              <Field label="Notes" field="notes" placeholder="Additional notes" multiline />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Field label="Reminder Date" field="reminderDate" placeholder="YYYY-MM-DD" /></View>
                <View style={{ flex: 1 }}><Field label="Reminder Time" field="reminderTime" placeholder="HH:MM" /></View>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>Checklist Items</Text>
                {formData.checklistItems.map((item: string, index: number) => (
                  <View key={`chk-${index}`} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <TextInput value={item} onChangeText={(val) => updateArray("checklistItems", index, val)} placeholder="Add checklist item" style={[inputStyle, { flex: 1, marginBottom: 0 }]} />
                    <Pressable onPress={() => removeArrayItem("checklistItems", index)} style={{ justifyContent: "center", padding: 8 }}><Ionicons name="trash-outline" size={20} color="#dc2626" /></Pressable>
                  </View>
                ))}
                <Pressable onPress={() => addArrayItem("checklistItems")} style={{ alignSelf: "flex-start", paddingVertical: 8 }}><Text style={{ color: "#2563eb", fontWeight: "700" }}>+ Add Item</Text></Pressable>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>Tags</Text>
                {formData.tags.map((item: string, index: number) => (
                  <View key={`tag-${index}`} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <TextInput value={item} onChangeText={(val) => updateArray("tags", index, val)} placeholder="Tag" style={[inputStyle, { flex: 1, marginBottom: 0 }]} />
                    <Pressable onPress={() => removeArrayItem("tags", index)} style={{ justifyContent: "center", padding: 8 }}><Ionicons name="trash-outline" size={20} color="#dc2626" /></Pressable>
                  </View>
                ))}
                <Pressable onPress={() => addArrayItem("tags")} style={{ alignSelf: "flex-start", paddingVertical: 8 }}><Text style={{ color: "#2563eb", fontWeight: "700" }}>+ Add Tag</Text></Pressable>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>Upload Document</Text>
                <Pressable onPress={pickDocument} style={[inputStyle, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Ionicons name="document-attach-outline" size={20} color="#2563eb" />
                  <Text style={{ flex: 1, color: "#475569" }}>{documentFile?.name || "Choose a document"}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === "Work" && (
            <View>
              <Field label="Project" field="project" placeholder="Project name" />
              <Field label="Module" field="module" placeholder="Module name" />
              <Field label="Task" field="task" placeholder="Task name" />
              <Field label="Daily Goal" field="dailyGoal" placeholder="Goal for today" multiline />
              <Field label="Expected Outcome" field="expectedOutcome" placeholder="Expected outcome" multiline />
            </View>
          )}

          {activeTab === "Tracking" && (
            <View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Field label="Planned Hrs" field="plannedHours" placeholder="e.g. 4" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label="Worked Hrs" field="workedHours" placeholder="e.g. 3.5" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label="Progress %" field="progress" placeholder="0-100" keyboardType="numeric" /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Field label="Break Start" field="breakStartTime" placeholder="HH:MM" /></View>
                <View style={{ flex: 1 }}><Field label="Break End" field="breakEndTime" placeholder="HH:MM" /></View>
              </View>
              <CustomSelect label="Energy Level" value={formData.energyLevel} options={["Low", "Medium", "High"]} onSelect={v => update("energyLevel", v)} />
              <Field label="Today's Achievement" field="todaysAchievement" placeholder="What did you achieve?" multiline />
              <Field label="Challenges" field="challenges" placeholder="Any blockers?" multiline />
              <Field label="Tomorrow's Plan" field="tomorrowsPlan" placeholder="Plan for tomorrow" multiline />
            </View>
          )}
          
          <Pressable disabled={saving} onPress={save} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, backgroundColor: saving ? "#93c5fd" : "#2563eb", paddingVertical: 16, marginTop: 12 }}>
            <Ionicons name={saving ? "hourglass-outline" : "save-outline"} size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{saving ? "Saving..." : initialData ? "Update Event" : "Save Event"}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const Row = ({ label, value }: { label: string; value?: string | number }) => value ? (
  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
    <Text style={{ flexShrink: 0, fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>{label}</Text>
    <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#0f172a", textAlign: "right" }}>{value}</Text>
  </View>
) : null;

const Section = ({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Ionicons>["name"]; children: ReactNode }) => (
  <View style={{ marginBottom: 20 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <Ionicons name={icon} size={16} color="#64748b" />
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#64748b", letterSpacing: 1, textTransform: "uppercase" }}>{title}</Text>
    </View>
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", paddingHorizontal: 16 }}>{children}</View>
  </View>
);

function EventDetailsModal({ event, onClose, onEdit, onDelete }: { event: MyEvent | null; onClose: () => void; onEdit: (e: MyEvent) => void; onDelete: (id: string) => void }) {
  if (!event) return null;
  const checklist = asList(event.checklistItems);
  const tags = asList(event.tags);
  const attachments = event.attachments || [];
  const color = eventColor(event);

  const confirmDelete = () => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { if (event.id || event._id) onDelete(event.id || event._id as string); } }
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
        <View style={{ padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <View style={{ alignSelf: "flex-start", backgroundColor: `${color}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ color, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{eventType(event)}</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>{eventName(event)}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={() => onEdit(event)} style={{ padding: 8, backgroundColor: "#eff6ff", borderRadius: 12 }}><Ionicons name="pencil" size={18} color="#2563eb" /></TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={{ padding: 8, backgroundColor: "#fef2f2", borderRadius: 12 }}><Ionicons name="trash" size={18} color="#ef4444" /></TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: "#f1f5f9", borderRadius: 12 }}><Ionicons name="close" size={18} color="#475569" /></TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Section title="Basic Details" icon="calendar-outline">
            <Row label="Date" value={dayjs(dateValue(event)).format("dddd, MMMM D, YYYY")} />
            <Row label="Time" value={event.allDay ? 'All Day' : `${event.startTime || "--:--"} - ${event.endTime || "--:--"}`} />
            <Row label="Duration" value={event.estimatedDuration} />
            <Row label="Status" value={event.status} />
            <Row label="Priority" value={event.priority} />
            <Row label="Progress" value={event.progress !== undefined ? `${event.progress}%` : undefined} />
          </Section>

          {(event.description || event.notes) && (
            <Section title="Information" icon="reader-outline">
              {event.description && <View style={{ paddingVertical: 12, borderBottomWidth: event.notes ? 1 : 0, borderBottomColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Description</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.description}</Text></View>}
              {event.notes && <View style={{ paddingVertical: 12 }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Notes</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.notes}</Text></View>}
            </Section>
          )}

          {checklist.length > 0 && (
            <Section title="Checklist" icon="checkmark-circle-outline">
              <View style={{ paddingVertical: 12, gap: 10 }}>
                {checklist.map((item, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <Ionicons name="ellipse" size={10} color={color} style={{ marginTop: 4 }} />
                    <Text style={{ flex: 1, fontSize: 14, color: "#334155" }}>{item}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {(event.project || event.module || event.task || event.dailyGoal || event.expectedOutcome) && (
            <Section title="Work Context" icon="briefcase-outline">
              <Row label="Project" value={event.project} />
              <Row label="Module" value={event.module} />
              <Row label="Task" value={event.task} />
              {event.dailyGoal && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Daily Goal</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.dailyGoal}</Text></View>}
              {event.expectedOutcome && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Expected Outcome</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.expectedOutcome}</Text></View>}
            </Section>
          )}

          {(event.plannedHours || event.workedHours || event.energyLevel || event.breakStartTime || event.breakEndTime || event.todaysAchievement || event.challenges || event.tomorrowsPlan) && (
            <Section title="Tracking & Reflection" icon="stats-chart-outline">
              <Row label="Planned Hrs" value={event.plannedHours} />
              <Row label="Worked Hrs" value={event.workedHours} />
              <Row label="Energy Level" value={event.energyLevel} />
              <Row label="Break" value={event.breakStartTime && event.breakEndTime ? `${event.breakStartTime} - ${event.breakEndTime}` : undefined} />
              {event.todaysAchievement && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Achievement</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.todaysAchievement}</Text></View>}
              {event.challenges && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Challenges</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.challenges}</Text></View>}
              {event.tomorrowsPlan && <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Tomorrow's Plan</Text><Text style={{ fontSize: 14, color: "#334155" }}>{event.tomorrowsPlan}</Text></View>}
            </Section>
          )}

          {(event.location || event.meetingLink || event.reminderDate || event.reminderTime) && (
            <Section title="Schedule Details" icon="location-outline">
              <Row label="Location" value={event.location} />
              <Row label="Meeting Link" value={event.meetingLink} />
              <Row label="Reminder Date" value={event.reminderDate ? dayjs(event.reminderDate).format("MMM D, YYYY") : undefined} />
              <Row label="Reminder Time" value={event.reminderTime} />
            </Section>
          )}

          {tags.length > 0 && (
            <Section title="Tags" icon="pricetags-outline">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 12 }}>
                {tags.map((tag, i) => (
                  <View key={i} style={{ backgroundColor: "#eff6ff", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#bfdbfe" }}>
                    <Text style={{ color: "#2563eb", fontSize: 12, fontWeight: "600" }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {attachments.length > 0 && (
            <Section title="Attachments" icon="attach-outline">
              <View style={{ paddingVertical: 8, gap: 8 }}>
                {attachments.map((att: any, i) => {
                  const name = typeof att === "string" ? att.split("/").pop() : att.originalName || att.fileName || "Attachment";
                  return (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" }}>
                      <View style={{ backgroundColor: "#eff6ff", padding: 8, borderRadius: 8 }}><Ionicons name="document-text" size={16} color="#2563eb" /></View>
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#334155" }}>{name}</Text>
                    </View>
                  );
                })}
              </View>
            </Section>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function AdminMyCalendarScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<MyEvent | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await api.get("/myevents");
      const payload = getEvents(response.data);
      const userId = user?.id || user?.userId || user?.employee_id || user?.employeeId || user?.user_id || user?.uuid;
      setEvents(userId ? payload.filter(ev => {
        const owner = ev.user_id || ev.userId || ev.employeeId || ev.employee_id;
        return owner != null && String(owner) === String(userId);
      }) : payload);
    } catch (err) {
      Alert.alert("Error", "Failed to load your calendar events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const monthStart = currentDate.startOf('month');
  const monthEnd = currentDate.endOf('month');
  const startDay = monthStart.day();
  const daysInMonth = monthEnd.date();
  const cells: (number | null)[] = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const displayedEvents = selectedDate
    ? events.filter(ev => eventDate(ev).isSame(selectedDate, 'day'))
    : events.filter(ev => eventDate(ev).isSameOrAfter(dayjs().startOf('day')));

  const sortedEvents = displayedEvents.sort((a, b) => eventDate(a).valueOf() - eventDate(b).valueOf());
  const finalEvents = selectedDate ? sortedEvents : sortedEvents.slice(0, 15);

  const groupedEvents = finalEvents.reduce((acc: any, ev) => {
    const dStr = eventDate(ev).format('dddd, MMMM D, YYYY');
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(ev);
    return acc;
  }, {});

  const currentUserId = user?.id || user?.userId || user?.employee_id || user?.employeeId || user?.user_id || user?.uuid;

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/myevents/${id}`);
      setSelectedEvent(null);
      fetchEvents(true);
      Alert.alert("Success", "Event deleted successfully.");
    } catch (e) {
      Alert.alert("Error", "Failed to delete event.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
      <TopHeader title="My Calendar" subtitle="Plan your day and track your events" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />}>
        
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Plan My Day</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>Your personal plans and tasks.</Text>
          </View>
          <TouchableOpacity onPress={() => { setEventToEdit(null); setShowCreateModal(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>New Event</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={{ borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setCurrentDate(currentDate.subtract(1, 'month'))} style={{ padding: 4 }}><Ionicons name="chevron-back" size={20} color="#64748b" /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>{currentDate.format('MMMM YYYY')}</Text>
                <TouchableOpacity onPress={() => setCurrentDate(currentDate.add(1, 'month'))} style={{ padding: 4 }}><Ionicons name="chevron-forward" size={20} color="#64748b" /></TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "800", color: "#94a3b8" }}>{d}</Text>)}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {cells.map((day, idx) => {
                  const dStr = currentDate.date(day || 1).format('YYYY-MM-DD');
                  const isToday = day === dayjs().date() && currentDate.isSame(dayjs(), 'month');
                  const isSelected = selectedDate && selectedDate.isSame(dStr, 'day');
                  const dayEvents = day !== null ? events.filter(ev => eventDate(ev).isSame(dStr, 'day')) : [];
                  
                  return (
                    <TouchableOpacity 
                      key={idx} activeOpacity={0.7}
                      onPress={() => {
                        if (day !== null) {
                          const d = currentDate.date(day);
                          setSelectedDate(selectedDate?.isSame(d, 'day') ? null : d);
                        }
                      }}
                      style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 }}
                    >
                      {day !== null && (
                        <View style={{ 
                          width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", 
                          backgroundColor: isToday ? "#2563eb" : isSelected ? "#eff6ff" : "transparent",
                          borderWidth: isSelected && !isToday ? 2 : 0, borderColor: isSelected ? "#2563eb" : "transparent"
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: isToday ? "800" : "600", color: isToday ? "#fff" : isSelected ? "#2563eb" : "#334155" }}>
                            {day}
                          </Text>
                          {dayEvents.length > 0 && !isToday && (
                            <View style={{ position: 'absolute', bottom: 3, flexDirection: "row", gap: 2 }}>
                              {dayEvents.slice(0, 3).map((ev, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: eventColor(ev) }} />)}
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 16, gap: 12, paddingHorizontal: 4 }}>
                {Object.keys(CATEGORY_COLORS).map(type => (
                  <View key={type} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CATEGORY_COLORS[type] }} />
                    <Text style={{ fontSize: 11, color: "#64748b", fontWeight: "600" }}>{type}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
              {selectedDate ? `Events on ${selectedDate.format('MMMM D, YYYY')}` : 'Upcoming Events'}
            </Text>

            <View style={{ gap: 20 }}>
              {Object.keys(groupedEvents).length === 0 ? (
                <Text style={{ textAlign: "center", color: "#94a3b8", marginVertical: 20 }}>{selectedDate ? "No events scheduled for this day." : "No upcoming events."}</Text>
              ) : Object.keys(groupedEvents).map(dateStr => (
                <View key={dateStr}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 10 }}>{dateStr}</Text>
                  <View style={{ gap: 10 }}>
                    {groupedEvents[dateStr].map((ev: MyEvent) => {
                      const color = eventColor(ev);
                      return (
                        <TouchableOpacity 
                          key={ev.id || ev._id || Math.random().toString()} 
                          onPress={() => setSelectedEvent(ev)}
                          style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: color, borderLeftWidth: 4, borderLeftColor: color, padding: 14 }}
                        >
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{eventName(ev)}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="time-outline" size={12} color="#94a3b8" /><Text style={{ fontSize: 12, color: "#64748b" }}>{ev.allDay ? 'All Day' : `${ev.startTime || '--:--'} - ${ev.endTime || '--:--'}`}</Text></View>
                              {ev.location && <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Ionicons name="location-outline" size={12} color="#94a3b8" /><Text style={{ fontSize: 12, color: "#64748b" }} numberOfLines={1}>{ev.location}</Text></View>}
                            </View>
                          </View>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: `${color}15` }}>
                            <Text style={{ fontSize: 10, fontWeight: "800", color, textTransform: "uppercase" }}>{eventType(ev)}</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <CreateEventModal 
        visible={showCreateModal} 
        initialDate={selectedDate || dayjs()} 
        initialData={eventToEdit}
        userId={currentUserId} 
        onClose={() => { setShowCreateModal(false); setEventToEdit(null); }} 
        onSaved={async () => { await fetchEvents(true); }} 
      />
      
      <EventDetailsModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        onEdit={(ev) => { setSelectedEvent(null); setEventToEdit(ev); setShowCreateModal(true); }}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
