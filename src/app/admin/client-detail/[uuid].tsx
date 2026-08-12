import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api";
import ClientFormModal from "../../../components/ClientFormModal";

type Client = Record<string, any>;

/* ─── constants ─────────────────────────────────────────────── */
const statuses = ["Lead", "Prospect", "Active", "Inactive", "Converted", "Closed"];
const followStatuses = ["Pending", "Follow Up", "Completed", "Rescheduled", "Cancelled"];

const statusColor: Record<string, string> = {
  Active: "#16a34a",
  Lead: "#0284c7",
  Prospect: "#7c3aed",
  Inactive: "#dc2626",
  Converted: "#d97706",
  Closed: "#64748b",
};
const statusBg: Record<string, string> = {
  Active: "#dcfce7",
  Lead: "#dbeafe",
  Prospect: "#ede9fe",
  Inactive: "#fee2e2",
  Converted: "#fef3c7",
  Closed: "#f1f5f9",
};
const avatarPalette = ["#f97316", "#0ea5e9", "#a855f7", "#10b981", "#e11d48", "#f59e0b"];
const getAvatarColor = (name: string) =>
  avatarPalette[(name?.charCodeAt(0) || 0) % avatarPalette.length];

/* ─── helpers ────────────────────────────────────────────────── */
const dateLabel = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const timeAgo = (value?: string) => {
  if (!value) return "";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/* ─── small components ───────────────────────────────────────── */
function InfoRow({ icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Ionicons name={icon} size={18} color="#f97316" />
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 3 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#1e293b", fontWeight: "500", lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 18, marginBottom: 14, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#f1f5f9" }}>
      {children}
    </View>
  );
}

function CardTitle({ title, icon }: { title: string; icon: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
        <Ionicons name={icon} size={15} color="#f97316" />
      </View>
      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f172a" }}>{title}</Text>
    </View>
  );
}

function StatusChip({
  label,
  active,
  activeColor,
  activeBg,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: active ? activeBg : "#f8fafc",
        borderColor: active ? activeColor : "#e2e8f0",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? activeColor : "#64748b" }}>{label}</Text>
    </Pressable>
  );
}

/* ─── main screen ────────────────────────────────────────────── */
export default function ClientDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discussion, setDiscussion] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newFollowStatus, setNewFollowStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${uuid}`);
      const data: Client = res.data?.data || res.data;
      setClient(data);
      setHistory(data.history || []);
      setNewStatus(data.client_status || "Lead");
      setNewFollowStatus(data.follow_up_status || "Pending");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not load client.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uuid) fetchClient();
  }, [uuid]);

  const saveHistory = async () => {
    if (
      !discussion.trim() &&
      newStatus === client?.client_status &&
      newFollowStatus === client?.follow_up_status
    )
      return Alert.alert("Nothing to save", "Change a status or enter a discussion note.");
    setSaving(true);
    try {
      await api.post(`/clients/${uuid}/history`, {
        new_status: newStatus,
        follow_up_status: newFollowStatus,
        discussion_summary: discussion,
      });
      setDiscussion("");
      await fetchClient();
      Alert.alert("Saved", "Follow-up history updated.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Client",
      `Delete ${client?.client_name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/clients/${uuid}`);
              router.back();
            } catch (err: any) {
              Alert.alert("Delete failed", err?.message || "Please try again.");
            }
          },
        },
      ]
    );
  };

  /* ── loading ── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, color: "#94a3b8", fontWeight: "600" }}>Loading client…</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
        <Text style={{ marginTop: 12, color: "#64748b", fontWeight: "600", fontSize: 15 }}>Client not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#f97316", borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const initials = (client.client_name || "?")
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarColor = getAvatarColor(client.client_name || "");

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* ══ Hero Header ══════════════════════════════════════════ */}
      <View style={{ backgroundColor: "#0f172a", paddingBottom: 28, paddingHorizontal: 20 }}>
        <SafeAreaView edges={["top"]}>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 6 }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>Clients</Text>
          </Pressable>

          {/* Avatar + name row */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 22,
              backgroundColor: avatarColor,
              alignItems: "center", justifyContent: "center",
              shadowColor: avatarColor, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 18, elevation: 12,
            }}>
              <Text style={{ fontSize: 27, fontWeight: "900", color: "#fff" }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 21, fontWeight: "800", color: "#fff", lineHeight: 26 }}>{client.client_name}</Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>
                {client.company_name || client.business_name || "Client"}
              </Text>
            </View>
          </View>

          {/* Badge row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: statusBg[client.client_status] || "#f1f5f9" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor[client.client_status] || "#64748b" }}>
                {client.client_status || "No Status"}
              </Text>
            </View>
            {client.follow_up_status ? (
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#e2e8f0" }}>{client.follow_up_status}</Text>
              </View>
            ) : null}
            {client.service_type ? (
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(249,115,22,0.2)" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#fb923c" }}>{client.service_type}</Text>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      {/* ══ Scrollable body ══════════════════════════════════════ */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
          {/* ── Contact Information ── */}
        <Card>
          <CardTitle title="Contact Information" icon="person-outline" />
          <InfoRow icon="mail-outline"      label="Email"          value={client.email} />
          <InfoRow icon="call-outline"      label="Phone"          value={client.phone_number} />
          <InfoRow icon="people-outline"    label="Contact Person" value={client.contact_person} />
          <InfoRow icon="business-outline"  label="Business Name"  value={client.business_name} />
          <InfoRow icon="layers-outline"    label="Business Type"  value={client.business_type} />
          <InfoRow icon="construct-outline" label="Service Type"   value={client.service_type} />
        </Card>

        {/* ── Requirement & Notes ── */}
        {(client.requirement || client.notes_summary) ? (
          <Card>
            <CardTitle title="Requirement & Notes" icon="document-text-outline" />
            {client.requirement ? (
              <View style={{ marginBottom: client.notes_summary ? 14 : 0 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Requirement</Text>
                <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{client.requirement}</Text>
              </View>
            ) : null}
            {client.notes_summary ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Notes / Summary</Text>
                <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{client.notes_summary}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* ── Follow-up Schedule ── */}
        <Card>
          <CardTitle title="Follow-up Schedule" icon="calendar-outline" />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            {/* Follow-up */}
            <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Follow-up</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e293b" }}>
                {client.follow_up_date ? dateLabel(client.follow_up_date) : "—"}
              </Text>
              {client.follow_up_time ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <Ionicons name="time-outline" size={12} color="#94a3b8" />
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{client.follow_up_time}</Text>
                </View>
              ) : null}
            </View>
            {/* Next Follow-up */}
            <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Next Follow-up</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e293b" }}>
                {client.next_follow_up_date ? dateLabel(client.next_follow_up_date) : "—"}
              </Text>
              {client.next_follow_up_time ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <Ionicons name="time-outline" size={12} color="#94a3b8" />
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{client.next_follow_up_time}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {/* Reminder chip */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", gap: 8 }}>
            <Ionicons
              name={client.reminder ? "notifications" : "notifications-off-outline"}
              size={17}
              color={client.reminder ? "#f97316" : "#94a3b8"}
            />
            <Text style={{ fontSize: 13, fontWeight: "600", color: client.reminder ? "#f97316" : "#94a3b8" }}>
              Reminder {client.reminder ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </Card>

        {/* ── Update Status ── */}
        <Card>
          <CardTitle title="Update Status" icon="refresh-outline" />

          <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Client Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row" }}>
              {statuses.map((s) => (
                <StatusChip
                  key={s}
                  label={s}
                  active={newStatus === s}
                  activeColor={statusColor[s] || "#f97316"}
                  activeBg={statusBg[s] || "#fff7ed"}
                  onPress={() => setNewStatus(s)}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Follow-up Status</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
            {followStatuses.map((s) => (
              <StatusChip
                key={s}
                label={s}
                active={newFollowStatus === s}
                activeColor="#f97316"
                activeBg="#fff7ed"
                onPress={() => setNewFollowStatus(s)}
              />
            ))}
          </View>

          <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Discussion Note</Text>
          <TextInput
            value={discussion}
            onChangeText={setDiscussion}
            placeholder="What was discussed?"
            placeholderTextColor="#94a3b8"
            multiline
            style={{
              minHeight: 88, borderRadius: 14, borderWidth: 1,
              borderColor: "#e2e8f0", backgroundColor: "#f8fafc",
              padding: 14, fontSize: 14, color: "#1e293b",
              textAlignVertical: "top", marginBottom: 14, lineHeight: 22,
            }}
          />
          <Pressable
            disabled={saving}
            onPress={saveHistory}
            style={{
              backgroundColor: saving ? "#cbd5e1" : "#f97316",
              borderRadius: 14, paddingVertical: 14, alignItems: "center",
              shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: saving ? 0 : 0.3, shadowRadius: 10, elevation: saving ? 0 : 5,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
              {saving ? "Saving…" : "Save Update"}
            </Text>
          </Pressable>
        </Card>

        {/* ── History & Timeline ── */}
        <Card>
          <CardTitle title="History & Timeline" icon="time-outline" />
          {history.length ? (
            history.map((item, index) => (
              <View key={item.id || index} style={{ flexDirection: "row", marginBottom: index < history.length - 1 ? 0 : 4 }}>
                {/* Dot + line */}
                <View style={{ alignItems: "center", marginRight: 14, width: 30 }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: index === 0 ? "#f97316" : "#f1f5f9",
                    alignItems: "center", justifyContent: "center",
                    shadowColor: index === 0 ? "#f97316" : "transparent",
                    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: index === 0 ? 4 : 0,
                  }}>
                    <Ionicons
                      name={index === 0 ? "radio-button-on" : "ellipse"}
                      size={index === 0 ? 14 : 9}
                      color={index === 0 ? "#fff" : "#94a3b8"}
                    />
                  </View>
                  {index < history.length - 1 && (
                    <View style={{ width: 2, flex: 1, backgroundColor: "#f1f5f9", marginTop: 6, marginBottom: 6, minHeight: 24 }} />
                  )}
                </View>
                {/* Card */}
                <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b", flex: 1 }}>{item.event_type}</Text>
                    <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, color: "#64748b", fontWeight: "600" }}>{timeAgo(item.created_at)}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: "#94a3b8", marginBottom: item.discussion_summary ? 8 : 0 }}>{dateLabel(item.created_at)}</Text>
                  {item.discussion_summary ? (
                    <Text style={{ fontSize: 13, color: "#475569", lineHeight: 20 }}>{item.discussion_summary}</Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Ionicons name="time-outline" size={28} color="#cbd5e1" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#94a3b8" }}>No history yet</Text>
              <Text style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Log a follow-up above to get started</Text>
            </View>
          )}
        </Card>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 16 }}>
          <Pressable
            onPress={() => setEditVisible(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#f97316",
            }}
          >
            <Ionicons name="create-outline" size={22} color="#f97316" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: "#ef4444",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#ef4444",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit modal */}
      {client && (
        <ClientFormModal
          visible={editVisible}
          client={client}
          onClose={() => setEditVisible(false)}
          onSaved={() => {
            setEditVisible(false);
            fetchClient();
          }}
        />
      )}
    </View>
  );
}
