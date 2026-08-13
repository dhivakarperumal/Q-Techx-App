import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";
import { FAB } from "../../components/FAB";

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
};

type ViewMode = "Month" | "Week" | "Day" | "Agenda";

const colors: Record<string, string> = {
  Meeting: "#2563eb",
  "Client Call": "#9333ea",
  Training: "#059669",
  Deadline: "#e11d48",
  Birthday: "#db2777",
  Holiday: "#0d9488",
  Leave: "#d97706",
  Other: "#64748b",
};

const getEvents = (data: unknown): MyEvent[] => {
  if (Array.isArray(data)) return data as MyEvent[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: MyEvent[] }).data;
  }
  return [];
};

const dateValue = (event: MyEvent) => event.planDate || "";
const eventDate = (event: MyEvent) => new Date(dateValue(event));
const validDate = (date: Date) => !Number.isNaN(date.getTime());
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const eventName = (event: MyEvent) => event.planTitle || event.title || "Untitled event";
const eventType = (event: MyEvent) => event.eventType || event.category || "Other";
const eventColor = (event: MyEvent) => colors[eventType(event)] || colors.Other;
const formatDate = (value?: string) => {
  const date = value ? new Date(value) : new Date(NaN);
  return validDate(date) ? date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Date unavailable";
};
const asList = (value?: string[] | string) => Array.isArray(value) ? value : value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

type CreateEventValues = {
  planTitle: string;
  description: string;
  planDate: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: string;
  status: string;
  checklistItems: string[];
  notes: string;
  location: string;
  meetingLink: string;
};

const createEventDefaults = (date: Date): CreateEventValues => ({
  planTitle: "",
  description: "",
  planDate: dateKey(date),
  startTime: "09:00",
  endTime: "10:00",
  category: "",
  priority: "Medium",
  status: "Pending",
  checklistItems: [""],
  notes: "",
  location: "",
  meetingLink: "",
});

const inputStyle = { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#f8fafc", paddingHorizontal: 12, paddingVertical: 10, color: "#0f172a", fontSize: 14 } as const;

function CreateEventModal({ visible, initialDate, userId, onClose, onSaved }: { visible: boolean; initialDate: Date; userId?: string | number; onClose: () => void; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState<CreateEventValues>(() => createEventDefaults(initialDate));
  const [documentFile, setDocumentFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValues(createEventDefaults(initialDate));
      setDocumentFile(null);
    }
  }, [initialDate, visible]);

  const update = (field: keyof CreateEventValues, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const updateChecklist = (index: number, value: string) => setValues((current) => ({ ...current, checklistItems: current.checklistItems.map((item, itemIndex) => itemIndex === index ? value : item) }));

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (!result.canceled) setDocumentFile(result.assets[0]);
  };

  const save = async () => {
    if (!values.planTitle.trim() || !values.planDate || !values.startTime || !values.endTime) {
      Alert.alert("Required fields", "Please enter a title, date, start time, and end time.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      const payload: Record<string, string | number> = {
        ...values,
        checklistItems: JSON.stringify(values.checklistItems.map((item) => item.trim()).filter(Boolean)),
        user_id: userId || "",
        progress: 0,
      };
      Object.entries(payload).forEach(([key, value]) => formData.append(key, String(value)));
      if (documentFile) {
        formData.append("document", { uri: documentFile.uri, name: documentFile.name || "document", type: documentFile.mimeType || "application/octet-stream" } as unknown as Blob);
      }
      await api.post("/myevents", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await onSaved();
      onClose();
    } catch (error) {
      Alert.alert("Unable to save", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, placeholder, multiline = false }: { label: string; field: keyof CreateEventValues; placeholder?: string; multiline?: boolean }) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>{label}</Text>
      <TextInput value={String(values[field])} onChangeText={(value) => update(field, value)} placeholder={placeholder} placeholderTextColor="#94a3b8" multiline={multiline} numberOfLines={multiline ? 3 : 1} style={[inputStyle, multiline && { minHeight: 78, textAlignVertical: "top" }]} />
    </View>
  );

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f8fafc" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ backgroundColor: "#000", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ width: 48, height: 6, backgroundColor: "#334155", borderRadius: 3, alignSelf: "center", marginBottom: 16 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "bold" }}>Plan My Day</Text>
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>Create a personal calendar event</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#ffedd5", padding: 8, borderRadius: 20 }}>
            <Ionicons name="close" size={20} color="#f97316" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <Field label="Plan title *" field="planTitle" placeholder="Enter plan title" />
        <Field label="Description" field="description" placeholder="Describe your plan" multiline />
        <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><Field label="Plan date *" field="planDate" placeholder="YYYY-MM-DD" /></View><View style={{ flex: 1 }}><Field label="Category" field="category" placeholder="Meeting, task..." /></View></View>
        <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><Field label="Start time *" field="startTime" /></View><View style={{ flex: 1 }}><Field label="End time *" field="endTime" /></View></View>
        <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><Field label="Priority" field="priority" placeholder="Low / Medium / High" /></View><View style={{ flex: 1 }}><Field label="Status" field="status" placeholder="Pending" /></View></View>
        <Field label="Location" field="location" placeholder="Office, room, or address" />
        <Field label="Meeting link" field="meetingLink" placeholder="https://..." />
        <Field label="Notes" field="notes" placeholder="Additional notes" multiline />
        <View style={{ gap: 8 }}><Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>Checklist items</Text>{values.checklistItems.map((item, index) => <View key={`checklist-${index}`} style={{ flexDirection: "row", gap: 8 }}><TextInput value={item} onChangeText={(value) => updateChecklist(index, value)} placeholder="Add checklist item" placeholderTextColor="#94a3b8" style={[inputStyle, { flex: 1 }]} /><Pressable onPress={() => setValues((current) => ({ ...current, checklistItems: current.checklistItems.length > 1 ? current.checklistItems.filter((_, itemIndex) => itemIndex !== index) : [""] }))} accessibilityLabel="Remove checklist item" style={{ justifyContent: "center", padding: 8 }}><Ionicons name="trash-outline" size={20} color="#dc2626" /></Pressable></View>)}<Pressable onPress={() => setValues((current) => ({ ...current, checklistItems: [...current.checklistItems, ""] }))} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: "#fdba74", paddingHorizontal: 12, paddingVertical: 8 }}><Ionicons name="add" size={17} color="#f97316" /><Text style={{ color: "#f97316", fontWeight: "700" }}>Add item</Text></Pressable></View>
        <View style={{ gap: 8 }}><Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>Upload document (optional)</Text><Pressable onPress={pickDocument} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff", padding: 12 }}><Ionicons name="document-attach-outline" size={20} color="#f97316" /><Text style={{ flex: 1, color: "#475569" }}>{documentFile?.name || "Choose a document"}</Text></Pressable></View>
        <Pressable disabled={saving} onPress={save} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, backgroundColor: saving ? "#fdba74" : "#f97316", paddingVertical: 14 }}><Ionicons name={saving ? "hourglass-outline" : "save-outline"} size={18} color="#fff" /><Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{saving ? "Saving..." : "Save event"}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>;
}

const Section = ({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Ionicons>["name"]; children: ReactNode }) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
      <Ionicons name={icon} size={15} color="#94a3b8" />
      <Text style={{ fontSize: 11, fontWeight: "800", color: "#64748b", letterSpacing: 0.8, textTransform: "uppercase" }}>{title}</Text>
    </View>
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", paddingHorizontal: 14 }}>{children}</View>
  </View>
);

const Row = ({ label, value }: { label: string; value?: string }) => value ? (
  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
    <Text style={{ flexShrink: 0, fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>{label}</Text>
    <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#0f172a", textAlign: "right" }}>{value}</Text>
  </View>
) : null;

function EventDetails({ event, onClose }: { event: MyEvent | null; onClose: () => void }) {
  if (!event) return null;
  const checklist = asList(event.checklistItems);
  const tags = asList(event.tags);
  const attachments = event.attachments || [];
  const color = eventColor(event);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View style={{ backgroundColor: "#000", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ width: 48, height: 6, backgroundColor: "#334155", borderRadius: 3, alignSelf: "center", marginBottom: 16 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <View style={{ alignSelf: "flex-start", backgroundColor: `${color}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 }}>
                <Text style={{ color, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{eventType(event)}</Text>
              </View>
              <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "bold" }}>{eventName(event)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#ffedd5", padding: 8, borderRadius: 20 }}>
              <Ionicons name="close" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
          <Section title="Basic details" icon="calendar-outline">
            <Row label="Date" value={formatDate(event.planDate)} />
            <Row label="Time" value={`${event.startTime || "--"} - ${event.endTime || "--"}`} />
            <Row label="Duration" value={event.estimatedDuration} />
            <Row label="Status" value={event.status} />
            <Row label="Priority" value={event.priority} />
            <Row label="Progress" value={event.progress !== undefined ? `${event.progress}%` : undefined} />
          </Section>
          {(event.description || event.notes) && <Section title="Information" icon="reader-outline"><Row label="Description" value={event.description} /><Row label="Notes" value={event.notes} /></Section>}
          {(event.project || event.module || event.task) && <Section title="Work context" icon="briefcase-outline"><Row label="Project" value={event.project} /><Row label="Module" value={event.module} /><Row label="Task" value={event.task} /></Section>}
          {(event.dailyGoal || event.expectedOutcome || event.todaysAchievement || event.challenges || event.tomorrowsPlan) && <Section title="Daily plan" icon="flag-outline"><Row label="Daily goal" value={event.dailyGoal} /><Row label="Expected outcome" value={event.expectedOutcome} /><Row label="Today's achievement" value={event.todaysAchievement} /><Row label="Challenges" value={event.challenges} /><Row label="Tomorrow's plan" value={event.tomorrowsPlan} /></Section>}
          {checklist.length > 0 && <Section title="Checklist" icon="checkmark-circle-outline"><View style={{ paddingVertical: 10 }}>{checklist.map((item, index) => <View key={`${item}-${index}`} style={{ flexDirection: "row", gap: 8, paddingVertical: 5 }}><Ionicons name="ellipse-outline" size={15} color={color} /><Text style={{ flex: 1, color: "#334155" }}>{item}</Text></View>)}</View></Section>}
          {(event.location || event.meetingLink || event.reminderDate || event.reminderTime) && <Section title="Schedule details" icon="time-outline"><Row label="Location" value={event.location} /><Row label="Meeting link" value={event.meetingLink} /><Row label="Reminder date" value={formatDate(event.reminderDate)} /><Row label="Reminder time" value={event.reminderTime} /></Section>}
          {(event.plannedHours || event.workedHours || event.energyLevel || event.breakStartTime || event.breakEndTime) && <Section title="Work tracking" icon="stats-chart-outline"><Row label="Planned hours" value={event.plannedHours} /><Row label="Worked hours" value={event.workedHours} /><Row label="Energy" value={event.energyLevel} /><Row label="Break" value={event.breakStartTime && event.breakEndTime ? `${event.breakStartTime} - ${event.breakEndTime}` : undefined} /></Section>}
          {tags.length > 0 && <Section title="Tags" icon="pricetags-outline"><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 14 }}>{tags.map((tag, index) => <Text key={`${tag}-${index}`} style={{ borderRadius: 20, backgroundColor: "#ffedd5", paddingHorizontal: 10, paddingVertical: 6, color: "#f97316", fontSize: 12, fontWeight: "600" }}>{tag}</Text>)}</View></Section>}
          {attachments.length > 0 && <Section title="Attachments" icon="document-text-outline">{attachments.map((attachment, index) => { const name = typeof attachment === "string" ? attachment.split("/").pop() : attachment.originalName || attachment.fileName || "Attachment"; return <View key={`${name}-${index}`} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: index === attachments.length - 1 ? 0 : 1, borderBottomColor: "#f1f5f9" }}><Ionicons name="document-text-outline" size={17} color="#f97316" /><Text style={{ flex: 1, color: "#334155" }}>{name}</Text></View>; })}</Section>}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MyCalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const now = new Date();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const response = await api.get("/myevents");
      const payload = getEvents(response.data);
      const userId = [user?.id, user?.userId, user?.employee_id, user?.employeeId, user?.user_id, user?.uuid].find(Boolean);
      setEvents(userId ? payload.filter((event) => {
        const owner = event.user_id || event.userId || event.employeeId;
        return owner != null && String(owner) === String(userId);
      }) : payload);
    } catch {
      setError("Unable to load your calendar. Please try again.");
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: total }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))] as (Date | null)[];
  }, [month]);

  const eventsForDay = (day: Date) => events.filter((event) => {
    const date = eventDate(event);
    return validDate(date) && dateKey(date) === dateKey(day);
  }).sort((a, b) => a.startTime?.localeCompare(b.startTime || "") || 0);

  const monthEvents = useMemo(() => events.filter((event) => { const date = eventDate(event); return validDate(date) && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime()), [events, month]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(selectedDate); day.setDate(selectedDate.getDate() - selectedDate.getDay() + index); return day; }), [selectedDate]);
  const dayEvents = eventsForDay(selectedDate);

  const changeMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const openEvent = (event: MyEvent) => setSelectedEvent(event);
  const currentUserId = [user?.id, user?.userId, user?.employee_id, user?.employeeId, user?.user_id, user?.uuid].find(Boolean) as string | number | undefined;

  const EventCard = ({ event }: { event: MyEvent }) => {
    const color = eventColor(event);
    return <Pressable onPress={() => openEvent(event)} accessibilityLabel={`View details for ${eventName(event)}`} style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}><View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}><Ionicons name="calendar-outline" size={22} color={color} /></View><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{eventName(event)}</Text><Text style={{ marginTop: 3, fontSize: 12, fontWeight: "700", color }}>{eventType(event)}</Text><Text style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>{formatDate(event.planDate)} · {event.startTime || "All day"}{event.endTime ? ` - ${event.endTime}` : ""}</Text></View><Ionicons name="chevron-forward" size={18} color="#94a3b8" /></Pressable>;
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
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
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>My Calendar</Text>
      </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}><View style={{ flex: 1 }}><Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>My Calendar</Text><Text style={{ marginTop: 6, fontSize: 15, color: "#64748b" }}>Your personal plans, tasks and daily schedule.</Text></View><View style={{ flexDirection: "row", gap: 8 }}><Pressable onPress={() => fetchEvents(true)} accessibilityLabel="Refresh my calendar" style={{ padding: 10, borderRadius: 12, backgroundColor: "#ffedd5" }}><Ionicons name="refresh-outline" size={22} color="#f97316" /></Pressable></View></View>
      <View style={{ flexDirection: "row", marginTop: 20, borderRadius: 12, backgroundColor: "#e2e8f0", padding: 3 }}>{(["Month", "Week", "Day", "Agenda"] as ViewMode[]).map((mode) => <Pressable key={mode} onPress={() => setViewMode(mode)} style={{ flex: 1, alignItems: "center", borderRadius: 9, backgroundColor: viewMode === mode ? "#fff" : "transparent", paddingVertical: 9 }}><Text style={{ color: viewMode === mode ? "#f97316" : "#64748b", fontSize: 12, fontWeight: "700" }}>{mode}</Text></Pressable>)}</View>

      {viewMode !== "Agenda" && <View style={{ marginTop: 16, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 16 }}><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><Pressable onPress={() => viewMode === "Day" ? setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1)) : viewMode === "Week" ? setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7)) : changeMonth(-1)} style={{ padding: 6 }}><Ionicons name="chevron-back" size={20} color="#475569" /></Pressable><Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>{viewMode === "Day" ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : viewMode === "Week" ? `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text><Pressable onPress={() => viewMode === "Day" ? setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)) : viewMode === "Week" ? setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7)) : changeMonth(1)} style={{ padding: 6 }}><Ionicons name="chevron-forward" size={20} color="#475569" /></Pressable></View>
        {viewMode === "Month" && <><View style={{ flexDirection: "row", marginBottom: 6 }}>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <Text key={day} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: "#94a3b8" }}>{day}</Text>)}</View><View style={{ flexDirection: "row", flexWrap: "wrap" }}>{monthDays.map((day, index) => { const marked = day ? eventsForDay(day).length > 0 : false; const selected = day ? dateKey(day) === dateKey(selectedDate) : false; return <Pressable key={day ? dateKey(day) : `empty-${index}`} disabled={!day} onPress={() => day && setSelectedDate(day)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" }}>{day && <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: selected ? "#f97316" : marked ? "#ffedd5" : "transparent" }}><Text style={{ color: selected ? "#fff" : marked ? "#f97316" : "#334155", fontWeight: selected ? "800" : "500" }}>{day.getDate()}</Text>{marked && !selected && <View style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: "#f97316" }} />}</View></Pressable>; })}</View></>}
        {viewMode === "Week" && <View style={{ gap: 8 }}>{weekDays.map((day) => <Pressable key={dateKey(day)} onPress={() => setSelectedDate(day)} style={{ flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: dateKey(day) === dateKey(selectedDate) ? "#ffedd5" : "#f8fafc", padding: 10 }}><Text style={{ width: 76, fontWeight: "700", color: "#475569" }}>{day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</Text><Text style={{ flex: 1, color: "#64748b" }}>{eventsForDay(day).map(eventName).join(", ") || "No events"}</Text><Text style={{ color: "#f97316", fontWeight: "700" }}>{eventsForDay(day).length || ""}</Text></Pressable>)}</View>}
        {viewMode === "Day" && <View style={{ gap: 10 }}>{dayEvents.length ? dayEvents.map((event) => <EventCard key={event.id || event._id || eventName(event)} event={event} />) : <Text style={{ paddingVertical: 30, textAlign: "center", color: "#64748b" }}>No events for this day.</Text>}</View>}
      </View>}

      <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>{viewMode === "Agenda" ? "Upcoming events" : "Selected day schedule"}</Text>
      {loading ? <View style={{ alignItems: "center", paddingVertical: 40 }}><ActivityIndicator size="large" color="#f97316" /></View> : error ? <View style={{ alignItems: "center", paddingVertical: 40 }}><Text style={{ color: "#64748b", textAlign: "center" }}>{error}</Text><Pressable onPress={() => fetchEvents()} style={{ marginTop: 14, borderRadius: 10, backgroundColor: "#f97316", paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text></Pressable></View> : viewMode === "Agenda" ? (monthEvents.length ? <View style={{ gap: 10 }}>{monthEvents.map((event, index) => <EventCard key={event.id || event._id || `${eventName(event)}-${index}`} event={event} />)}</View> : <Text style={{ paddingVertical: 30, textAlign: "center", color: "#64748b" }}>No events in this month.</Text>) : (dayEvents.length ? <View style={{ gap: 10 }}>{dayEvents.map((event) => <EventCard key={event.id || event._id || eventName(event)} event={event} />)}</View> : <Text style={{ paddingVertical: 30, textAlign: "center", color: "#64748b" }}>No events for this day.</Text>)}
    </ScrollView>
    <FAB onPress={() => setShowCreateModal(true)} style={{ bottom: 24 }} />
    <CreateEventModal visible={showCreateModal} initialDate={selectedDate} userId={currentUserId} onClose={() => setShowCreateModal(false)} onSaved={() => fetchEvents(true)} />
    <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
  </SafeAreaView>;
}
