import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api";

/* ─── constants ────────────────────────────────────────────── */
const CATEGORIES = ["Website", "Web Application", "Mobile Application", "ERP", "CRM", "SaaS", "E-commerce"];
const STATUSES   = ["Draft", "Active", "Inactive"];
const YES_NO     = ["Yes", "No"];

/* ─── helpers ──────────────────────────────────────────────── */
const fmtDate = (v?: string | number) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v)
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const statusStyle = (s?: string) =>
  s === "Active"   ? { color: "#15803d", bg: "#dcfce7" } :
  s === "Inactive" ? { color: "#be123c", bg: "#ffe4e6" } :
                     { color: "#b45309", bg: "#fef3c7" };

/* Flatten camelCase / snake_case */
const g = (plan: any, camel: string, snake: string) => plan?.[camel] ?? plan?.[snake];

const planToForm = (plan: any) => ({
  planName:                g(plan,"planName","plan_name")               ?? "",
  planCode:                g(plan,"planCode","plan_code")               ?? "",
  category:                plan?.category                               ?? "Website",
  status:                  plan?.status                                 ?? "Draft",
  shortDescription:        g(plan,"shortDescription","short_description") ?? "",
  fullDescription:         g(plan,"fullDescription","full_description")   ?? plan?.description ?? "",
  hostingIncluded:         g(plan,"hostingIncluded","hosting_included")   ?? "Yes",
  hostingType:             g(plan,"hostingType","hosting_type")           ?? "Cloud Hosting",
  storageLimit:            g(plan,"storageLimit","storage_limit")         ?? "50 GB",
  bandwidthLimit:          g(plan,"bandwidthLimit","bandwidth_limit")     ?? "200 GB",
  freeSsl:                 g(plan,"freeSsl","free_ssl")                   ?? "Yes",
  freeEmailAccounts:       g(plan,"freeEmailAccounts","free_email_accounts") ?? "5",
  dailyBackup:             g(plan,"dailyBackup","daily_backup")           ?? "Yes",
  hostingDuration:         g(plan,"hostingDuration","hosting_duration")   ?? "12 Months",
  domainIncluded:          g(plan,"domainIncluded","domain_included")     ?? "Yes",
  domainExtension:         g(plan,"domainExtension","domain_extension")   ?? ".com",
  domainValidity:          g(plan,"domainValidity","domain_validity")     ?? "1 Year",
  freeRenewal:             g(plan,"freeRenewal","free_renewal")           ?? "Yes",
  whoisPrivacy:            g(plan,"whoisPrivacy","whois_privacy")         ?? "Yes",
  freeMaintenance:         g(plan,"freeMaintenance","free_maintenance")   ?? "Yes",
  maintenanceDuration:     g(plan,"maintenanceDuration","maintenance_duration") ?? "6 Months",
  bugFixesIncluded:        g(plan,"bugFixesIncluded","bug_fixes_included")  ?? "Yes",
  securityUpdates:         g(plan,"securityUpdates","security_updates")     ?? "Yes",
  performanceOptimization: g(plan,"performanceOptimization","performance_optimization") ?? "Yes",
  backupSupport:           g(plan,"backupSupport","backup_support")         ?? "Yes",
  emailSupport:            g(plan,"emailSupport","email_support")           ?? "Yes",
  phoneSupport:            g(plan,"phoneSupport","phone_support")           ?? "Yes",
  whatsappSupport:         g(plan,"whatsappSupport","whatsapp_support")     ?? "No",
  liveChat:                g(plan,"liveChat","live_chat")                   ?? "Yes",
  prioritySupport:         g(plan,"prioritySupport","priority_support")     ?? "No",
  dedicatedProjectManager: g(plan,"dedicatedProjectManager","dedicated_project_manager") ?? "No",
  supportDuration:         g(plan,"supportDuration","support_duration")     ?? "6 Months",
  responseSla:             g(plan,"responseSla","response_sla")             ?? "24 Hours",
  sourceCode:              g(plan,"sourceCode","source_code")               ?? "Yes",
  documentation:           plan?.documentation                              ?? "Yes",
  installationGuide:       g(plan,"installationGuide","installation_guide") ?? "Yes",
  apiDocumentation:        g(plan,"apiDocumentation","api_documentation")   ?? "No",
  userManual:              g(plan,"userManual","user_manual")               ?? "Yes",
  adminManual:             g(plan,"adminManual","admin_manual")             ?? "Yes",
  trainingSession:         g(plan,"trainingSession","training_session")     ?? "No",
  deployment:              plan?.deployment                                 ?? "Yes",
  testingReport:           g(plan,"testingReport","testing_report")         ?? "Yes",
  featuredBadge:           g(plan,"featuredBadge","featured_badge")         ?? "Recommended",
  salesNotes:              g(plan,"salesNotes","sales_notes")               ?? "",
  technicalNotes:          g(plan,"technicalNotes","technical_notes")       ?? "",
  modules:                 (plan?.modules ?? []) as any[],
});

type PlanForm = ReturnType<typeof planToForm>;

/* ─── small reusable components ────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}>
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

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f8fafc" }}>
      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500", flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#1e293b", fontWeight: "700", textAlign: "right", flex: 1 }}>{value}</Text>
    </View>
  );
}

function ToggleRow({ label, value }: { label: string; value?: string }) {
  const yes = value === "Yes";
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f8fafc" }}>
      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "500", flex: 1 }}>{label}</Text>
      <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: yes ? "#dcfce7" : "#f1f5f9" }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: yes ? "#15803d" : "#64748b" }}>{value ?? "—"}</Text>
      </View>
    </View>
  );
}

/* ─── Edit form sub-components ──────────────────────────────── */
function EField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={label}
        placeholderTextColor="#94a3b8"
        style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, backgroundColor: "#f8fafc", paddingHorizontal: 14, paddingVertical: multiline ? 12 : 12, fontSize: 14, color: "#1e293b", minHeight: multiline ? 80 : undefined, textAlignVertical: multiline ? "top" : undefined }}
      />
    </View>
  );
}

function EToggle({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {YES_NO.map(opt => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: "center", backgroundColor: value === opt ? (opt === "Yes" ? "#dcfce7" : "#fee2e2") : "#f8fafc", borderColor: value === opt ? (opt === "Yes" ? "#16a34a" : "#dc2626") : "#e2e8f0" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: value === opt ? (opt === "Yes" ? "#16a34a" : "#dc2626") : "#64748b" }}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function EChips({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: value === opt ? "#fff7ed" : "#f8fafc", borderColor: value === opt ? "#f97316" : "#e2e8f0" }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: value === opt ? "#f97316" : "#64748b" }}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ESectionTitle({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: "#f97316" }}>{title}</Text>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [plan, setPlan]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm]         = useState<PlanForm | null>(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch ── */
  const fetchPlan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/project-plans/${id}`);
      const d = res.data;
      const raw = d?.data ?? d;
      setPlan(raw);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const openEdit = () => {
    if (!plan) return;
    setForm(planToForm(plan));
    setEditVisible(true);
  };

  const upd = <K extends keyof PlanForm>(field: K, value: PlanForm[K]) =>
    setForm(cur => cur ? { ...cur, [field]: value } : cur);

  /* ── save edit ── */
  const handleSave = async () => {
    if (!form?.planName?.trim()) {
      Alert.alert("Plan name required", "Enter a name for this project plan.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        planName: form.planName.trim(),
        modules: (form.modules ?? []).map(({ document, ...m }: any) => m),
        includedModules: (form.modules ?? []).map((m: any) => m.title ?? m),
      };
      await api.put(`/project-plans/${id}`, payload);
      setEditVisible(false);
      await fetchPlan();
      Alert.alert("Saved", "Plan updated successfully.");
    } catch (err: any) {
      Alert.alert("Save failed", err?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = () => {
    Alert.alert(
      "Delete Plan",
      `Delete "${plan?.planName ?? plan?.plan_name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/project-plans/${id}`);
              router.back();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert("Delete failed", err?.message ?? "Please try again.");
            }
          },
        },
      ]
    );
  };

  /* ─── loading / error ─── */
  if (loading || deleting) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, color: "#94a3b8", fontWeight: "600" }}>
          {deleting ? "Deleting…" : "Loading plan…"}
        </Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
        <Text style={{ marginTop: 12, color: "#64748b", fontWeight: "600", fontSize: 15 }}>Plan not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#f97316", borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  /* derived values */
  const planName     = g(plan,"planName","plan_name")      ?? "Untitled Plan";
  const planCode     = g(plan,"planCode","plan_code");
  const category     = plan.category;
  const status       = plan.status;
  const shortDesc    = g(plan,"shortDescription","short_description");
  const fullDesc     = g(plan,"fullDescription","full_description") ?? plan.description;
  const projectName  = g(plan,"projectName","project_name") ?? plan.project?.name ?? plan.project?.project_name;
  const createdAt    = g(plan,"createdAt","created_at");
  const modules: any[] = plan.modules ?? plan.includedModules ?? [];
  const ss = statusStyle(status);

  const activeProjects    = g(plan,"activeProjectsUsingPlan","active_projects_using_plan")    ?? 0;
  const completedProjects = g(plan,"completedProjectsUsingPlan","completed_projects_using_plan") ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>

      {/* ══ HERO HEADER ═════════════════════════════════════ */}
      <View style={{ backgroundColor: "#0f172a", paddingBottom: 28, paddingHorizontal: 20 }}>
        <SafeAreaView edges={["top"]}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", marginBottom: 22, marginTop: 6 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>Project Plans</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center", shadowColor: "#2563eb", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 }}>
              <Ionicons name="layers-outline" size={28} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 26 }}>{planName}</Text>
              {planCode ? <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{planCode}</Text> : null}
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: ss.bg }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: ss.color }}>{status ?? "Draft"}</Text>
            </View>
            {category ? (
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#e2e8f0" }}>{category}</Text>
              </View>
            ) : null}
            {projectName ? (
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(249,115,22,0.2)" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#fb923c" }}>{projectName}</Text>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Pressable
            onPress={openEdit}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 16, borderWidth: 1.5, borderColor: "#f97316", backgroundColor: "#fff" }}
          >
            <Ionicons name="create-outline" size={18} color="#f97316" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#f97316" }}>Edit Plan</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 16, backgroundColor: "#ef4444", shadowColor: "#ef4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 }}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Delete Plan</Text>
          </Pressable>
        </View>

        {/* Usage stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Active Projects",  value: activeProjects,    color: "#3b82f6" },
            { label: "Completed",        value: completedProjects, color: "#10b981" },
            { label: "Modules",          value: modules.length,    color: "#a855f7" },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: "#94a3b8", marginTop: 3, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Overview */}
        <Card>
          <CardTitle title="Overview" icon="information-circle-outline" />
          <Row label="Plan Code"  value={planCode} />
          <Row label="Category"   value={category} />
          <Row label="Status"     value={status} />
          <Row label="Project"    value={projectName} />
          <Row label="Created"    value={fmtDate(createdAt) ?? undefined} />
          <Row label="Badge"      value={g(plan,"featuredBadge","featured_badge")} />
          {shortDesc ? <View style={{ paddingTop: 12 }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Short Description</Text><Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{shortDesc}</Text></View> : null}
          {fullDesc  ? <View style={{ paddingTop: 12 }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Full Description</Text><Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{fullDesc}</Text></View>  : null}
        </Card>

        {/* Hosting */}
        <Card>
          <CardTitle title="Hosting" icon="cloud-outline" />
          <ToggleRow label="Hosting Included"    value={g(plan,"hostingIncluded","hosting_included")} />
          <Row       label="Hosting Type"        value={g(plan,"hostingType","hosting_type")} />
          <Row       label="Storage Limit"       value={g(plan,"storageLimit","storage_limit")} />
          <Row       label="Bandwidth Limit"     value={g(plan,"bandwidthLimit","bandwidth_limit")} />
          <ToggleRow label="Free SSL"            value={g(plan,"freeSsl","free_ssl")} />
          <Row       label="Free Email Accounts" value={g(plan,"freeEmailAccounts","free_email_accounts")} />
          <ToggleRow label="Daily Backup"        value={g(plan,"dailyBackup","daily_backup")} />
          <Row       label="Hosting Duration"    value={g(plan,"hostingDuration","hosting_duration")} />
        </Card>

        {/* Domain */}
        <Card>
          <CardTitle title="Domain" icon="globe-outline" />
          <ToggleRow label="Domain Included" value={g(plan,"domainIncluded","domain_included")} />
          <Row       label="Extension"       value={g(plan,"domainExtension","domain_extension")} />
          <Row       label="Validity"        value={g(plan,"domainValidity","domain_validity")} />
          <ToggleRow label="Free Renewal"    value={g(plan,"freeRenewal","free_renewal")} />
          <ToggleRow label="WHOIS Privacy"   value={g(plan,"whoisPrivacy","whois_privacy")} />
        </Card>

        {/* Maintenance */}
        <Card>
          <CardTitle title="Maintenance" icon="construct-outline" />
          <ToggleRow label="Free Maintenance"         value={g(plan,"freeMaintenance","free_maintenance")} />
          <Row       label="Duration"                 value={g(plan,"maintenanceDuration","maintenance_duration")} />
          <ToggleRow label="Bug Fixes"                value={g(plan,"bugFixesIncluded","bug_fixes_included")} />
          <ToggleRow label="Security Updates"         value={g(plan,"securityUpdates","security_updates")} />
          <ToggleRow label="Performance Optimization" value={g(plan,"performanceOptimization","performance_optimization")} />
          <ToggleRow label="Backup Support"           value={g(plan,"backupSupport","backup_support")} />
        </Card>

        {/* Support */}
        <Card>
          <CardTitle title="Support" icon="headset-outline" />
          <ToggleRow label="Email Support"             value={g(plan,"emailSupport","email_support")} />
          <ToggleRow label="Phone Support"             value={g(plan,"phoneSupport","phone_support")} />
          <ToggleRow label="WhatsApp Support"          value={g(plan,"whatsappSupport","whatsapp_support")} />
          <ToggleRow label="Live Chat"                 value={g(plan,"liveChat","live_chat")} />
          <ToggleRow label="Priority Support"          value={g(plan,"prioritySupport","priority_support")} />
          <ToggleRow label="Dedicated Project Manager" value={g(plan,"dedicatedProjectManager","dedicated_project_manager")} />
          <Row       label="Support Duration"          value={g(plan,"supportDuration","support_duration")} />
          <Row       label="Response SLA"              value={g(plan,"responseSla","response_sla")} />
        </Card>

        {/* Delivery */}
        <Card>
          <CardTitle title="Delivery" icon="cube-outline" />
          <ToggleRow label="Source Code"        value={g(plan,"sourceCode","source_code")} />
          <ToggleRow label="Documentation"      value={plan?.documentation} />
          <ToggleRow label="Installation Guide" value={g(plan,"installationGuide","installation_guide")} />
          <ToggleRow label="API Documentation"  value={g(plan,"apiDocumentation","api_documentation")} />
          <ToggleRow label="User Manual"        value={g(plan,"userManual","user_manual")} />
          <ToggleRow label="Admin Manual"       value={g(plan,"adminManual","admin_manual")} />
          <ToggleRow label="Training Session"   value={g(plan,"trainingSession","training_session")} />
          <ToggleRow label="Deployment"         value={plan?.deployment} />
          <ToggleRow label="Testing Report"     value={g(plan,"testingReport","testing_report")} />
        </Card>

        {/* Modules */}
        {modules.length > 0 ? (
          <Card>
            <CardTitle title={`Modules (${modules.length})`} icon="grid-outline" />
            {modules.map((m: any, i: number) => {
              const title    = typeof m === "string" ? m : (m.title ?? m.name ?? `Module ${i + 1}`);
              const duration = typeof m === "object" ? (m.duration ?? m.durationLabel) : null;
              const desc     = typeof m === "object" ? (m.description ?? m.desc) : null;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: i < modules.length - 1 ? 1 : 0, borderBottomColor: "#f8fafc" }}>
                  <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#f97316" }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>{title}</Text>
                    {duration ? <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{duration}</Text> : null}
                    {desc ? <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 18 }}>{desc}</Text> : null}
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}

      </ScrollView>

      {/* ══ EDIT MODAL ══════════════════════════════════════ */}
      {form && (
        <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => !saving && setEditVisible(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: "94%" }}>
              {/* Handle */}
              <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" }} />
              </View>

              {/* Modal header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Edit Plan</Text>
                  <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Update project plan details</Text>
                </View>
                <Pressable onPress={() => !saving && setEditVisible(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* ── Basic Info ── */}
                <ESectionTitle title="Basic Info" />
                <EField  label="Plan Name"        value={form.planName}        onChange={v => upd("planName", v)} />
                <EField  label="Plan Code"        value={form.planCode}        onChange={v => upd("planCode", v)} />
                <EChips  label="Category"         value={form.category}        options={CATEGORIES} onChange={v => upd("category", v)} />
                <EChips  label="Status"           value={form.status}          options={STATUSES}   onChange={v => upd("status", v)} />
                <EField  label="Featured Badge"   value={form.featuredBadge}   onChange={v => upd("featuredBadge", v)} />
                <EField  label="Short Description" value={form.shortDescription} onChange={v => upd("shortDescription", v)} multiline />
                <EField  label="Full Description"  value={form.fullDescription}  onChange={v => upd("fullDescription", v)}  multiline />

                {/* ── Hosting ── */}
                <ESectionTitle title="Hosting" />
                <EToggle label="Hosting Included"    value={form.hostingIncluded}    onChange={v => upd("hostingIncluded", v)} />
                <EField  label="Hosting Type"        value={form.hostingType}        onChange={v => upd("hostingType", v)} />
                <EField  label="Storage Limit"       value={form.storageLimit}       onChange={v => upd("storageLimit", v)} />
                <EField  label="Bandwidth Limit"     value={form.bandwidthLimit}     onChange={v => upd("bandwidthLimit", v)} />
                <EToggle label="Free SSL"            value={form.freeSsl}            onChange={v => upd("freeSsl", v)} />
                <EField  label="Free Email Accounts" value={form.freeEmailAccounts}  onChange={v => upd("freeEmailAccounts", v)} />
                <EToggle label="Daily Backup"        value={form.dailyBackup}        onChange={v => upd("dailyBackup", v)} />
                <EField  label="Hosting Duration"    value={form.hostingDuration}    onChange={v => upd("hostingDuration", v)} />

                {/* ── Domain ── */}
                <ESectionTitle title="Domain" />
                <EToggle label="Domain Included" value={form.domainIncluded} onChange={v => upd("domainIncluded", v)} />
                <EField  label="Extension"       value={form.domainExtension} onChange={v => upd("domainExtension", v)} />
                <EField  label="Validity"        value={form.domainValidity}  onChange={v => upd("domainValidity", v)} />
                <EToggle label="Free Renewal"    value={form.freeRenewal}     onChange={v => upd("freeRenewal", v)} />
                <EToggle label="WHOIS Privacy"   value={form.whoisPrivacy}    onChange={v => upd("whoisPrivacy", v)} />

                {/* ── Maintenance ── */}
                <ESectionTitle title="Maintenance" />
                <EToggle label="Free Maintenance"          value={form.freeMaintenance}         onChange={v => upd("freeMaintenance", v)} />
                <EField  label="Duration"                  value={form.maintenanceDuration}     onChange={v => upd("maintenanceDuration", v)} />
                <EToggle label="Bug Fixes"                 value={form.bugFixesIncluded}        onChange={v => upd("bugFixesIncluded", v)} />
                <EToggle label="Security Updates"          value={form.securityUpdates}         onChange={v => upd("securityUpdates", v)} />
                <EToggle label="Performance Optimization"  value={form.performanceOptimization} onChange={v => upd("performanceOptimization", v)} />
                <EToggle label="Backup Support"            value={form.backupSupport}           onChange={v => upd("backupSupport", v)} />

                {/* ── Support ── */}
                <ESectionTitle title="Support" />
                <EToggle label="Email Support"             value={form.emailSupport}            onChange={v => upd("emailSupport", v)} />
                <EToggle label="Phone Support"             value={form.phoneSupport}            onChange={v => upd("phoneSupport", v)} />
                <EToggle label="WhatsApp Support"          value={form.whatsappSupport}         onChange={v => upd("whatsappSupport", v)} />
                <EToggle label="Live Chat"                 value={form.liveChat}                onChange={v => upd("liveChat", v)} />
                <EToggle label="Priority Support"          value={form.prioritySupport}         onChange={v => upd("prioritySupport", v)} />
                <EToggle label="Dedicated Project Manager" value={form.dedicatedProjectManager} onChange={v => upd("dedicatedProjectManager", v)} />
                <EField  label="Support Duration"          value={form.supportDuration}         onChange={v => upd("supportDuration", v)} />
                <EField  label="Response SLA"              value={form.responseSla}             onChange={v => upd("responseSla", v)} />

                {/* ── Delivery ── */}
                <ESectionTitle title="Delivery" />
                <EToggle label="Source Code"        value={form.sourceCode}       onChange={v => upd("sourceCode", v)} />
                <EToggle label="Documentation"      value={form.documentation}    onChange={v => upd("documentation", v)} />
                <EToggle label="Installation Guide" value={form.installationGuide} onChange={v => upd("installationGuide", v)} />
                <EToggle label="API Documentation"  value={form.apiDocumentation} onChange={v => upd("apiDocumentation", v)} />
                <EToggle label="User Manual"        value={form.userManual}       onChange={v => upd("userManual", v)} />
                <EToggle label="Admin Manual"       value={form.adminManual}      onChange={v => upd("adminManual", v)} />
                <EToggle label="Training Session"   value={form.trainingSession}  onChange={v => upd("trainingSession", v)} />
                <EToggle label="Deployment"         value={form.deployment}       onChange={v => upd("deployment", v)} />
                <EToggle label="Testing Report"     value={form.testingReport}    onChange={v => upd("testingReport", v)} />

                {/* ── Notes ── */}
                <ESectionTitle title="Notes" />
                <EField label="Sales Notes"     value={form.salesNotes}     onChange={v => upd("salesNotes", v)}     multiline />
                <EField label="Technical Notes" value={form.technicalNotes} onChange={v => upd("technicalNotes", v)} multiline />

                {/* Save button */}
                <Pressable
                  disabled={saving}
                  onPress={handleSave}
                  style={{ marginTop: 24, borderRadius: 16, paddingVertical: 16, alignItems: "center", backgroundColor: saving ? "#e2e8f0" : "#f97316", shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: saving ? 0 : 0.3, shadowRadius: 10, elevation: saving ? 0 : 5 }}
                >
                  {saving
                    ? <ActivityIndicator color="#94a3b8" />
                    : <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Save Changes</Text>}
                </Pressable>

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
