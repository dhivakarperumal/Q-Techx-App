import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import api from "../../api";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";
import { FAB } from "../../components/FAB";

type OfficeEvent = {
  id?: string;
  _id?: string;
  title?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean | number;
  location?: string;
  meetingLink?: string;
  description?: string;
  notes?: string;
  status?: string;
  priority?: string;
  reminder?: string;
  project?: string;
  departments?: string[];
  teams?: string[];
  organizerName?: string;
  organizerDepartment?: string;
  organizerEmail?: string;
  organizerContactNumber?: string;
  participants?: (string | { name?: string })[];
  externalGuests?: boolean;
  guestEmailAddresses?: string[];
  attachments?: string[];
  activity?: string[];
  createdDate?: string;
  createdBy?: string;
  updatedDate?: string;
  color?: string;
};

const eventColors: Record<string, string> = {
  Meeting: "#0891b2",
  Holiday: "#16a34a",
  "Office Event": "#2563eb",
  "Project Deadline": "#9333ea",
  Interview: "#d97706",
};

const getEvents = (data: unknown): OfficeEvent[] => {
  if (Array.isArray(data)) return data as OfficeEvent[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: OfficeEvent[] }).data;
  }
  return [];
};

const toDate = (value?: string) => {
  const date = value ? new Date(value) : new Date(NaN);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const sameDay = (first: Date, second: Date) => dateKey(first) === dateKey(second);
const eventColor = (event: OfficeEvent) => event.color || eventColors[event.eventType || ""] || "#64748b";

const formatDate = (value?: string) => {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "Date unavailable";
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
      <Text style={{ flexShrink: 0, fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#0f172a", textAlign: "right" }}>{value}</Text>
    </View>
  );
};

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Ionicons>["name"]; children: React.ReactNode }) => (
  <View style={{ marginBottom: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
      <Ionicons name={icon} size={15} color="#94a3b8" />
      <Text style={{ fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</Text>
    </View>
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", paddingHorizontal: 14 }}>{children}</View>
  </View>
);

function EventDetailsModal({ event, onClose }: { event: OfficeEvent | null; onClose: () => void }) {
  if (!event) return null;
  const color = eventColor(event);
  const participants = event.participants || [];
  const date = event.startDate ? new Date(event.startDate) : null;
  const created = event.createdDate ? formatDate(event.createdDate) : "N/A";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View style={{ backgroundColor: "#000", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ width: 48, height: 6, backgroundColor: "#334155", borderRadius: 3, alignSelf: "center", marginBottom: 16 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <View style={{ alignSelf: "flex-start", backgroundColor: `${color}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 }}>
                <Text style={{ color, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{event.eventType || "Other"}</Text>
              </View>
              <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "bold" }}>{event.title || "Untitled event"}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close event details" style={{ padding: 8, borderRadius: 20, backgroundColor: "#ffedd5" }}>
              <Ionicons name="close" size={20} color="#f97316" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
          <DetailSection title="Schedule & location" icon="calendar-outline">
            <DetailRow label="Date" value={date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Date unavailable"} />
            <DetailRow label="Time" value={event.allDay ? "All day" : `${event.startTime || "--"} - ${event.endTime || "--"}`} />
            <DetailRow label="Location" value={event.location} />
            <DetailRow label="Meeting link" value={event.meetingLink} />
            <DetailRow label="Status" value={event.status} />
            <DetailRow label="Priority" value={event.priority} />
            <DetailRow label="Reminder" value={event.reminder} />
          </DetailSection>

          {(event.description || event.notes) && <DetailSection title="Information" icon="reader-outline"><DetailRow label="Description" value={event.description} /><DetailRow label="Notes" value={event.notes} /></DetailSection>}

          {(event.project || event.departments?.length || event.teams?.length || event.organizerName || event.organizerDepartment || event.organizerEmail || event.organizerContactNumber) && (
            <DetailSection title="Project & organization" icon="business-outline">
              <DetailRow label="Project" value={event.project} />
              <DetailRow label="Departments" value={event.departments?.join(", ")} />
              <DetailRow label="Teams" value={event.teams?.join(", ")} />
              <DetailRow label="Organizer" value={event.organizerName} />
              <DetailRow label="Department" value={event.organizerDepartment} />
              <DetailRow label="Email" value={event.organizerEmail} />
              <DetailRow label="Contact" value={event.organizerContactNumber} />
            </DetailSection>
          )}

          {participants.length > 0 && <DetailSection title="Participants" icon="people-outline"><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 14 }}>{participants.map((participant, index) => <View key={`${index}-${typeof participant === "string" ? participant : participant.name}`} style={{ borderRadius: 20, backgroundColor: "#f1f5f9", paddingHorizontal: 11, paddingVertical: 6 }}><Text style={{ fontSize: 12, fontWeight: "600", color: "#475569" }}>{typeof participant === "string" ? participant : participant.name || "Participant"}</Text></View>)}</View></DetailSection>}

          {(event.externalGuests || event.guestEmailAddresses?.length) && <DetailSection title="Guests" icon="person-add-outline"><DetailRow label="External guests" value={event.externalGuests ? "Allowed" : "Not allowed"} /><DetailRow label="Guest emails" value={event.guestEmailAddresses?.join(", ")} /></DetailSection>}

          {event.attachments?.length ? <DetailSection title="Attachments" icon="document-text-outline">{event.attachments.map((attachment, index) => <View key={`${attachment}-${index}`} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: index === event.attachments!.length - 1 ? 0 : 1, borderBottomColor: "#f1f5f9" }}><Ionicons name="document-text-outline" size={17} color="#7c3aed" /><Text style={{ flex: 1, color: "#334155" }}>{attachment.split("/").pop()}</Text></View>)}</DetailSection> : null}

          {event.activity?.length ? <DetailSection title="Activity" icon="eye-outline">{event.activity.map((item, index) => <Text key={`${item}-${index}`} style={{ paddingVertical: 10, color: "#475569", fontSize: 13 }}>{item}</Text>)}</DetailSection> : null}
          <Text style={{ textAlign: "center", color: "#94a3b8", fontSize: 10, textTransform: "uppercase" }}>Created: {created}{event.createdBy ? ` by ${event.createdBy}` : ""}{event.updatedDate ? ` · Updated: ${formatDate(event.updatedDate)}` : ""}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function OfficeCalendarScreen() {
  const now = new Date();
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<OfficeEvent | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get("/events");
      setEvents(getEvents(response.data));
    } catch {
      setError("Unable to load the office calendar. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const days = useMemo(() => {
    const firstDay = month.getDay();
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: totalDays }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
    ] as (Date | null)[];
  }, [month]);

  const monthEvents = useMemo(
    () => events
      .filter((event) => {
        const start = toDate(event.startDate);
        return start && start.getFullYear() === month.getFullYear() && start.getMonth() === month.getMonth();
      })
      .sort((first, second) => (toDate(first.startDate)?.getTime() || 0) - (toDate(second.startDate)?.getTime() || 0)),
    [events, month],
  );

  const hasEventOn = (day: Date) => events.some((event) => {
    const start = toDate(event.startDate);
    const end = toDate(event.endDate || event.startDate);
    if (!start || !end) return false;
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    return dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
      dayStart <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
  });

  const eventsOnDay = (day: Date) => events.filter((event) => {
    const start = toDate(event.startDate);
    const end = toDate(event.endDate || event.startDate);
    if (!start || !end) return false;
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    return dayStart >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && dayStart <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <TopHeader title="Office Calendar" subtitle="Company events and schedules" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Office Calendar</Text>
            <Text style={{ marginTop: 6, fontSize: 15, color: "#64748b" }}>Company-wide events, holidays and deadlines.</Text>
          </View>
          <Pressable onPress={() => fetchEvents(true)} accessibilityLabel="Refresh office calendar" style={{ padding: 10, borderRadius: 12, backgroundColor: "#ffedd5" }}>
            <Ionicons name="refresh-outline" size={22} color="#f97316" />
          </Pressable>
        </View>

        <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Pressable onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} accessibilityLabel="Previous month" style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={20} color="#475569" />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
            <Pressable onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} accessibilityLabel="Next month" style={{ padding: 6 }}>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: day === "Sun" ? "#ef4444" : "#94a3b8" }}>{day}</Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {days.map((day, index) => {
              const marked = day ? hasEventOn(day) : false;
              const isToday = day ? sameDay(day, now) : false;
              return (
                <Pressable key={day ? dateKey(day) : `empty-${index}`} disabled={!day || !marked} onPress={() => day && setSelectedEvent(eventsOnDay(day)[0] || null)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" }}>
                  {day && (
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? "#f97316" : marked ? "#ffedd5" : "transparent" }}>
                      <Text style={{ fontSize: 13, fontWeight: isToday ? "800" : "500", color: isToday ? "#fff" : marked ? "#f97316" : day.getDay() === 0 ? "#ef4444" : "#334155" }}>{day.getDate()}</Text>
                      {marked && !isToday && <View style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: "#f97316" }} />}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>This month</Text>
        {loading && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}><ActivityIndicator size="large" color="#f97316" /></View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}><Ionicons name="cloud-offline-outline" size={42} color="#94a3b8" /><Text style={{ marginTop: 12, color: "#64748b", textAlign: "center" }}>{error}</Text><Pressable onPress={() => fetchEvents()} style={{ marginTop: 16, borderRadius: 10, backgroundColor: "#f97316", paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text></Pressable></View>
        ) : monthEvents.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}><Ionicons name="calendar-outline" size={42} color="#cbd5e1" /><Text style={{ marginTop: 12, color: "#64748b" }}>No office events this month.</Text></View>
        ) : (
          <View style={{ gap: 10 }}>
            {monthEvents.map((event, index) => (
              <Pressable key={event.id || event._id || `${event.title}-${index}`} onPress={() => setSelectedEvent(event)} accessibilityLabel={`View details for ${event.title || "event"}`} style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${eventColor(event)}18`, alignItems: "center", justifyContent: "center" }}><Ionicons name="calendar-outline" size={22} color={eventColor(event)} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{event.title || "Untitled event"}</Text>
                  <Text style={{ marginTop: 3, fontSize: 12, color: eventColor(event), fontWeight: "700" }}>{event.eventType || "Office event"}</Text>
                  <Text style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>{formatDate(event.startDate)}{event.allDay ? " · All day" : event.startTime ? ` · ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}` : ""}</Text>
                  {event.location ? <Text style={{ marginTop: 3, fontSize: 12, color: "#94a3b8" }}>Location: {event.location}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomHome />
      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </View>
  );
}
