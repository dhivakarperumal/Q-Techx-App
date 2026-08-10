import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

type EventParticipant =
  | string
  | { user_id?: string | number; employee_id?: string | number; name?: string };

type Meeting = {
  id?: string;
  _id?: string;
  title?: string;
  planTitle?: string;
  eventType?: string;
  category?: string;
  startDate?: string;
  planDate?: string;
  plan_date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean | number;
  description?: string;
  location?: string;
  meetingLink?: string;
  link?: string;
  participants?: EventParticipant[] | string;
  user_id?: string | number;
  userId?: string | number;
  employeeId?: string | number;
};

const getEvents = (data: unknown): Meeting[] => {
  if (Array.isArray(data)) return data as Meeting[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: Meeting[] }).data;
  }
  return [];
};

const eventDate = (meeting: Meeting) =>
  meeting.planDate || meeting.startDate || meeting.plan_date || "";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (meeting: Meeting) => {
  if (meeting.allDay) return "All day";
  return [meeting.startTime, meeting.endTime].filter(Boolean).join(" - ") || "Time unavailable";
};

const getMeetingLink = (meeting: Meeting) => {
  const link = meeting.meetingLink || meeting.link;
  if (link) return link.startsWith("http") ? link : `https://${link}`;
  if (meeting.location?.startsWith("http")) return meeting.location;
  return null;
};

const matchesEmployee = (meeting: Meeting, ids: string[], name: string) => {
  const ownerId = meeting.user_id || meeting.userId || meeting.employeeId;
  if (ownerId && ids.includes(String(ownerId))) return true;

  let participants = meeting.participants;
  if (typeof participants === "string") {
    try {
      participants = JSON.parse(participants) as EventParticipant[];
    } catch {
      return false;
    }
  }

  if (!Array.isArray(participants)) return false;
  return participants.some((participant) => {
    if (typeof participant === "string") return Boolean(name) && participant.toLowerCase() === name;
    return (
      (participant.user_id !== undefined && ids.includes(String(participant.user_id))) ||
      (participant.employee_id !== undefined && ids.includes(String(participant.employee_id))) ||
      (Boolean(name) && participant.name?.toLowerCase() === name)
    );
  });
};

export default function EmployeeMeetingsScreen() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchMeetings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [personalResponse, officeResponse] = await Promise.all([
        api.get("/myevents").catch(() => ({ data: [] })),
        api.get("/events").catch(() => ({ data: [] })),
      ]);
      const ids = [
        user?.id,
        user?.userId,
        user?.employee_id,
        user?.employeeId,
        user?.user_id,
        user?.uuid,
      ]
        .filter(Boolean)
        .map(String);
      const name = String(user?.name || user?.full_name || user?.username || "").toLowerCase();
      const personalEvents = getEvents(personalResponse.data);
      const officeEvents = getEvents(officeResponse.data).filter((meeting) =>
        ids.length || name ? matchesEmployee(meeting, ids, name) : true,
      );
      const uniqueMeetings = new Map<string, Meeting>();

      [...personalEvents, ...officeEvents]
        .filter((meeting) => {
          const type = String(meeting.eventType || meeting.category || "").toLowerCase();
          return type.includes("meeting") || type.includes("meating") || type.includes("call");
        })
        .forEach((meeting, index) => {
          const key = meeting.id || meeting._id || `${meeting.title}-${eventDate(meeting)}-${index}`;
          uniqueMeetings.set(key, meeting);
        });

      setMeetings(
        [...uniqueMeetings.values()].sort(
          (first, second) => new Date(eventDate(first)).getTime() - new Date(eventDate(second)).getTime(),
        ),
      );
    } catch {
      setError("Unable to load meetings. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchMeetings();
    }, [fetchMeetings]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <TopHeader title="Meetings" subtitle="Your scheduled meetings" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMeetings(true)} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Meetings</Text>
            <Text style={{ marginTop: 6, fontSize: 15, color: "#64748b" }}>
              {loading ? "Loading your schedule..." : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"}`}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh meetings"
            onPress={() => fetchMeetings(true)}
            style={{ padding: 10, borderRadius: 12, backgroundColor: "#ecfeff" }}
          >
            <Ionicons name="refresh-outline" size={22} color="#0891b2" />
          </Pressable>
        </View>

        {loading && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 72 }}>
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 72 }}>
            <Ionicons name="cloud-offline-outline" size={42} color="#94a3b8" />
            <Text style={{ marginTop: 12, color: "#64748b", textAlign: "center" }}>{error}</Text>
            <Pressable onPress={() => fetchMeetings()} style={{ marginTop: 16, borderRadius: 10, backgroundColor: "#0891b2", paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text>
            </Pressable>
          </View>
        ) : meetings.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 72 }}>
            <Ionicons name="videocam-off-outline" size={42} color="#94a3b8" />
            <Text style={{ marginTop: 12, color: "#64748b" }}>No meetings scheduled.</Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 24 }}>
            {meetings.map((meeting, index) => {
              const link = getMeetingLink(meeting);
              return (
                <View key={meeting.id || meeting._id || `${meeting.title}-${index}`} style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#ecfeff", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="videocam-outline" size={22} color="#0891b2" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>{meeting.planTitle || meeting.title || "Untitled meeting"}</Text>
                      <Text style={{ marginTop: 4, fontSize: 12, color: "#0891b2", fontWeight: "700" }}>{meeting.eventType || meeting.category || "Meeting"}</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 16, gap: 8 }}>
                    <Text style={{ color: "#475569" }}>📅 {formatDate(eventDate(meeting))}</Text>
                    <Text style={{ color: "#475569" }}>🕘 {formatTime(meeting)}</Text>
                    {meeting.location && !meeting.location.startsWith("http") && <Text style={{ color: "#475569" }}>📍 {meeting.location}</Text>}
                  </View>
                  {meeting.description ? <Text style={{ marginTop: 12, color: "#64748b" }}>{meeting.description}</Text> : null}
                  {link ? (
                    <Pressable onPress={() => Linking.openURL(link)} style={{ marginTop: 16, alignItems: "center", borderRadius: 10, backgroundColor: "#0891b2", paddingVertical: 11 }}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>Join meeting</Text>
                    </Pressable>
                  ) : (
                    <Text style={{ marginTop: 16, color: "#94a3b8", fontSize: 12 }}>No meeting link provided</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomHome />
    </View>
  );
}
