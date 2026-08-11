import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

/* ─── constants (same as Add form) ─────────────────────────── */
const categories = ["Website", "Web Application", "Mobile Application", "ERP", "CRM", "SaaS", "E-commerce"];
const statuses   = ["Draft", "Active", "Inactive"];

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

const gv = (plan: any, camel: string, snake: string) => plan?.[camel] ?? plan?.[snake];

const planToForm = (plan: any) => ({
  planName:                gv(plan,"planName","plan_name")                ?? "",
  planCode:                gv(plan,"planCode","plan_code")                ?? "",
  category:                plan?.category                                 ?? "Website",
  status:                  plan?.status                                   ?? "Draft",
  shortDescription:        gv(plan,"shortDescription","short_description") ?? "",
  fullDescription:         gv(plan,"fullDescription","full_description")   ?? plan?.description ?? "",
  hostingIncluded:         gv(plan,"hostingIncluded","hosting_included")   ?? "Yes",
  hostingType:             gv(plan,"hostingType","hosting_type")           ?? "Cloud Hosting",
  storageLimit:            gv(plan,"storageLimit","storage_limit")         ?? "50 GB",
  bandwidthLimit:          gv(plan,"bandwidthLimit","bandwidth_limit")     ?? "200 GB",
  freeSsl:                 gv(plan,"freeSsl","free_ssl")                   ?? "Yes",
  freeEmailAccounts:       gv(plan,"freeEmailAccounts","free_email_accounts") ?? "5",
  dailyBackup:             gv(plan,"dailyBackup","daily_backup")           ?? "Yes",
  hostingDuration:         gv(plan,"hostingDuration","hosting_duration")   ?? "12 Months",
  domainIncluded:          gv(plan,"domainIncluded","domain_included")     ?? "Yes",
  domainExtension:         gv(plan,"domainExtension","domain_extension")   ?? ".com",
  domainValidity:          gv(plan,"domainValidity","domain_validity")     ?? "1 Year",
  freeRenewal:             gv(plan,"freeRenewal","free_renewal")           ?? "Yes",
  whoisPrivacy:            gv(plan,"whoisPrivacy","whois_privacy")         ?? "Yes",
  freeMaintenance:         gv(plan,"freeMaintenance","free_maintenance")   ?? "Yes",
  maintenanceDuration:     gv(plan,"maintenanceDuration","maintenance_duration") ?? "6 Months",
  bugFixesIncluded:        gv(plan,"bugFixesIncluded","bug_fixes_included")  ?? "Yes",
  securityUpdates:         gv(plan,"securityUpdates","security_updates")     ?? "Yes",
  performanceOptimization: gv(plan,"performanceOptimization","performance_optimization") ?? "Yes",
  backupSupport:           gv(plan,"backupSupport","backup_support")         ?? "Yes",
  emailSupport:            gv(plan,"emailSupport","email_support")           ?? "Yes",
  phoneSupport:            gv(plan,"phoneSupport","phone_support")           ?? "Yes",
  whatsappSupport:         gv(plan,"whatsappSupport","whatsapp_support")     ?? "No",
  liveChat:                gv(plan,"liveChat","live_chat")                   ?? "Yes",
  prioritySupport:         gv(plan,"prioritySupport","priority_support")     ?? "No",
  dedicatedProjectManager: gv(plan,"dedicatedProjectManager","dedicated_project_manager") ?? "No",
  supportDuration:         gv(plan,"supportDuration","support_duration")     ?? "6 Months",
  responseSla:             gv(plan,"responseSla","response_sla")             ?? "24 Hours",
  sourceCode:              gv(plan,"sourceCode","source_code")               ?? "Yes",
  documentation:           plan?.documentation                               ?? "Yes",
  installationGuide:       gv(plan,"installationGuide","installation_guide") ?? "Yes",
  apiDocumentation:        gv(plan,"apiDocumentation","api_documentation")   ?? "No",
  userManual:              gv(plan,"userManual","user_manual")               ?? "Yes",
  adminManual:             gv(plan,"adminManual","admin_manual")             ?? "Yes",
  trainingSession:         gv(plan,"trainingSession","training_session")     ?? "No",
  deployment:              plan?.deployment                                  ?? "Yes",
  testingReport:           gv(plan,"testingReport","testing_report")         ?? "Yes",
  featuredBadge:           gv(plan,"featuredBadge","featured_badge")         ?? "Recommended",
  salesNotes:              gv(plan,"salesNotes","sales_notes")               ?? "",
  technicalNotes:          gv(plan,"technicalNotes","technical_notes")       ?? "",
  coverImage:              gv(plan,"coverImage","cover_image")               ?? "",
  coverImageAsset:         null as unknown,
  planDocument:            null as unknown,
  planDocumentName:        gv(plan,"planDocumentName","plan_document_name")  ?? "",
  projectId:               gv(plan,"projectId","project_id")                 ?? "",
  projectCode:             gv(plan,"projectCode","project_code")             ?? "",
  modules: (plan?.modules ?? []) as {
    title: string; duration: string; description: string;
    documentName?: string; document?: unknown;
  }[],
  includedModules: ((plan?.modules ?? []) as any[]).map((m: any) =>
    typeof m === "string" ? m : (m.title ?? "")
  ),
});

type PlanForm = ReturnType<typeof planToForm>;

/* ─── SAME form components as Add modal ────────────────────── */
function FormField({ label, value, onChange, multiline = false, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} multiline={multiline}
        keyboardType={keyboardType} placeholder={label} placeholderTextColor="#94a3b8"
        className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 ${multiline ? "min-h-[82px] py-3" : "py-3.5"}`}
      />
    </View>
  );
}

function ChoiceField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map(opt => (
            <TouchableOpacity
              key={opt} onPress={() => onChange(opt)}
              className={`rounded-full border px-3 py-2 ${value === opt ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
            >
              <Text className={`text-xs font-bold ${value === opt ? "text-orange-600" : "text-slate-600"}`}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TouchableOpacity
        onPress={() => Alert.alert(label, "Select an option",
          options.map(opt => ({ text: opt, onPress: () => onChange(opt) })))}
        className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5"
      >
        <Text className="text-sm font-semibold text-slate-800">{value}</Text>
        <Ionicons name="chevron-down" size={17} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── read-only card components ────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [plan, setPlan]         = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm]         = useState<PlanForm | null>(null);
  const [newModule, setNewModule] = useState({ title: "", duration: "", durationType: "Days", description: "", documentName: "", document: null as unknown });
  const [projectSearch, setProjectSearch] = useState("");
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch plan ── */
  const fetchPlan = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/project-plans/${id}`);
      const raw = res.data?.data ?? res.data;
      setPlan(raw);
    } catch { setPlan(null); }
    finally { setLoading(false); }
  }, [id]);

  /* ── fetch projects for selector ── */
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects?limit=1000&page=1");
      const d = res.data;
      const rows = Array.isArray(d) ? d : d?.data ?? d?.projects ?? d?.rows ?? [];
      setProjects(rows.map((p: any, i: number) => ({
        id: String(p.uuid ?? p.id ?? i),
        code: String(p.project_code ?? p.projectCode ?? p.code ?? "PRJ"),
        name: String(p.project_name ?? p.projectName ?? p.title ?? p.name ?? "Project"),
      })));
    } catch { setProjects([]); }
  }, []);

  useEffect(() => { fetchPlan(); fetchProjects(); }, [fetchPlan, fetchProjects]);

  const openEdit = () => {
    if (!plan) return;
    const f = planToForm(plan);
    setForm(f);
    setProjectSearch(f.projectId ? `${f.projectCode} - ${f.planName}` : "");
    setNewModule({ title: "", duration: "", durationType: "Days", description: "", documentName: "", document: null });
    setEditVisible(true);
  };

  const upd = <K extends keyof PlanForm>(field: K, value: PlanForm[K]) =>
    setForm(cur => cur ? { ...cur, [field]: value } : cur);

  /* ── module helpers ── */
  const addModule = () => {
    if (!form || !newModule.title.trim() || !newModule.duration.trim()) return;
    const mod = { ...newModule, title: newModule.title.trim(), duration: `${newModule.duration.trim()} ${newModule.durationType}` };
    upd("modules", [...form.modules, mod]);
    upd("includedModules", [...form.includedModules, mod.title]);
    setNewModule({ title: "", duration: "", durationType: "Days", description: "", documentName: "", document: null });
  };

  const removeModule = (index: number) => {
    if (!form) return;
    upd("modules", form.modules.filter((_, i) => i !== index));
    upd("includedModules", form.includedModules.filter((_, i) => i !== index));
  };

  /* ── document pickers ── */
  const choosePlanDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf","application/msword","application/vnd.ms-excel","text/plain"], copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) { upd("planDocument", r.assets[0]); upd("planDocumentName", r.assets[0].name); }
  };
  const chooseCoverImage = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) { upd("coverImage", r.assets[0].uri); upd("coverImageAsset", r.assets[0]); }
  };
  const chooseModuleDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf","application/msword","application/vnd.ms-excel","text/plain"], copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) setNewModule(cur => ({ ...cur, document: r.assets[0], documentName: r.assets[0].name }));
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form?.planName?.trim()) { Alert.alert("Plan name required", "Enter a name."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        planName: form.planName.trim(),
        modules: form.modules.map(({ document, ...m }) => m),
        includedModules: form.modules.map(m => m.title),
      };
      delete (payload as any).coverImageAsset;
      delete (payload as any).planDocument;

      const toFile = (asset: any) => ({ uri: asset.uri, name: asset.name || `upload-${Date.now()}`, type: asset.mimeType || "application/octet-stream" });
      const hasFile = Boolean(form.coverImageAsset || form.planDocument || form.modules.some(m => m.document));

      let body: any = payload;
      if (hasFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v != null) fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v)); });
        if (form.coverImageAsset) fd.append("cover_image", toFile(form.coverImageAsset) as any);
        if (form.planDocument)    fd.append("plan_document", toFile(form.planDocument) as any);
        form.modules.forEach(m => { if (m.document) fd.append("module_documents", toFile(m.document) as any); });
        body = fd;
      }

      await api.put(`/project-plans/${id}`, body, hasFile ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
      setEditVisible(false);
      await fetchPlan();
      Alert.alert("Saved", "Plan updated successfully.");
    } catch (err: any) {
      Alert.alert("Save failed", err?.message ?? "Please try again.");
    } finally { setSaving(false); }
  };

  /* ── delete ── */
  const handleDelete = () => {
    Alert.alert("Delete Plan", `Delete "${plan?.planName ?? plan?.plan_name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setDeleting(true);
        try { await api.delete(`/project-plans/${id}`); router.back(); }
        catch (err: any) { setDeleting(false); Alert.alert("Delete failed", err?.message ?? "Please try again."); }
      }},
    ]);
  };

  /* ── loading / error ── */
  if (loading || deleting) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ marginTop: 12, color: "#94a3b8", fontWeight: "600" }}>{deleting ? "Deleting…" : "Loading plan…"}</Text>
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

  /* derived */
  const planName  = gv(plan,"planName","plan_name") ?? "Untitled Plan";
  const planCode  = gv(plan,"planCode","plan_code");
  const status    = plan.status;
  const category  = plan.category;
  const projectName = gv(plan,"projectName","project_name") ?? plan.project?.name;
  const createdAt   = gv(plan,"createdAt","created_at");
  const modules: any[] = plan.modules ?? plan.includedModules ?? [];
  const ss = statusStyle(status);
  const activeProjects    = gv(plan,"activeProjectsUsingPlan","active_projects_using_plan")    ?? 0;
  const completedProjects = gv(plan,"completedProjectsUsingPlan","completed_projects_using_plan") ?? 0;

  const visibleProjects = projects.filter(p =>
    `${p.code} ${p.name}`.toLowerCase().includes(projectSearch.trim().toLowerCase())
  );

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
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }}>
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
            {category   ? <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" }}><Text style={{ fontSize: 11, fontWeight: "600", color: "#e2e8f0" }}>{category}</Text></View> : null}
            {projectName ? <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(249,115,22,0.2)" }}><Text style={{ fontSize: 11, fontWeight: "600", color: "#fb923c" }}>{projectName}</Text></View> : null}
          </View>
        </SafeAreaView>
      </View>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Edit / Delete buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Pressable onPress={openEdit} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 16, borderWidth: 1.5, borderColor: "#f97316", backgroundColor: "#fff" }}>
            <Ionicons name="create-outline" size={18} color="#f97316" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#f97316" }}>Edit Plan</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 16, backgroundColor: "#ef4444", shadowColor: "#ef4444", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 }}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Delete Plan</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[{ label: "Active Projects", value: activeProjects, color: "#3b82f6" }, { label: "Completed", value: completedProjects, color: "#10b981" }, { label: "Modules", value: modules.length, color: "#a855f7" }].map(s => (
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
          <Row label="Badge"      value={gv(plan,"featuredBadge","featured_badge")} />
          {gv(plan,"shortDescription","short_description") ? <View style={{ paddingTop: 12 }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Short Description</Text><Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{gv(plan,"shortDescription","short_description")}</Text></View> : null}
          {(gv(plan,"fullDescription","full_description") ?? plan.description) ? <View style={{ paddingTop: 12 }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Full Description</Text><Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>{gv(plan,"fullDescription","full_description") ?? plan.description}</Text></View> : null}
        </Card>

        <Card>
          <CardTitle title="Hosting" icon="cloud-outline" />
          <ToggleRow label="Hosting Included"    value={gv(plan,"hostingIncluded","hosting_included")} />
          <Row       label="Hosting Type"        value={gv(plan,"hostingType","hosting_type")} />
          <Row       label="Storage Limit"       value={gv(plan,"storageLimit","storage_limit")} />
          <Row       label="Bandwidth Limit"     value={gv(plan,"bandwidthLimit","bandwidth_limit")} />
          <ToggleRow label="Free SSL"            value={gv(plan,"freeSsl","free_ssl")} />
          <Row       label="Free Email Accounts" value={gv(plan,"freeEmailAccounts","free_email_accounts")} />
          <ToggleRow label="Daily Backup"        value={gv(plan,"dailyBackup","daily_backup")} />
          <Row       label="Hosting Duration"    value={gv(plan,"hostingDuration","hosting_duration")} />
        </Card>

        <Card>
          <CardTitle title="Domain" icon="globe-outline" />
          <ToggleRow label="Domain Included" value={gv(plan,"domainIncluded","domain_included")} />
          <Row       label="Extension"       value={gv(plan,"domainExtension","domain_extension")} />
          <Row       label="Validity"        value={gv(plan,"domainValidity","domain_validity")} />
          <ToggleRow label="Free Renewal"    value={gv(plan,"freeRenewal","free_renewal")} />
          <ToggleRow label="WHOIS Privacy"   value={gv(plan,"whoisPrivacy","whois_privacy")} />
        </Card>

        <Card>
          <CardTitle title="Maintenance" icon="construct-outline" />
          <ToggleRow label="Free Maintenance"         value={gv(plan,"freeMaintenance","free_maintenance")} />
          <Row       label="Duration"                 value={gv(plan,"maintenanceDuration","maintenance_duration")} />
          <ToggleRow label="Bug Fixes"                value={gv(plan,"bugFixesIncluded","bug_fixes_included")} />
          <ToggleRow label="Security Updates"         value={gv(plan,"securityUpdates","security_updates")} />
          <ToggleRow label="Performance Optimization" value={gv(plan,"performanceOptimization","performance_optimization")} />
          <ToggleRow label="Backup Support"           value={gv(plan,"backupSupport","backup_support")} />
        </Card>

        <Card>
          <CardTitle title="Support" icon="headset-outline" />
          <ToggleRow label="Email Support"             value={gv(plan,"emailSupport","email_support")} />
          <ToggleRow label="Phone Support"             value={gv(plan,"phoneSupport","phone_support")} />
          <ToggleRow label="WhatsApp Support"          value={gv(plan,"whatsappSupport","whatsapp_support")} />
          <ToggleRow label="Live Chat"                 value={gv(plan,"liveChat","live_chat")} />
          <ToggleRow label="Priority Support"          value={gv(plan,"prioritySupport","priority_support")} />
          <ToggleRow label="Dedicated Project Manager" value={gv(plan,"dedicatedProjectManager","dedicated_project_manager")} />
          <Row       label="Support Duration"          value={gv(plan,"supportDuration","support_duration")} />
          <Row       label="Response SLA"              value={gv(plan,"responseSla","response_sla")} />
        </Card>

        <Card>
          <CardTitle title="Delivery" icon="cube-outline" />
          <ToggleRow label="Source Code"        value={gv(plan,"sourceCode","source_code")} />
          <ToggleRow label="Documentation"      value={plan?.documentation} />
          <ToggleRow label="Installation Guide" value={gv(plan,"installationGuide","installation_guide")} />
          <ToggleRow label="API Documentation"  value={gv(plan,"apiDocumentation","api_documentation")} />
          <ToggleRow label="User Manual"        value={gv(plan,"userManual","user_manual")} />
          <ToggleRow label="Admin Manual"       value={gv(plan,"adminManual","admin_manual")} />
          <ToggleRow label="Training Session"   value={gv(plan,"trainingSession","training_session")} />
          <ToggleRow label="Deployment"         value={plan?.deployment} />
          <ToggleRow label="Testing Report"     value={gv(plan,"testingReport","testing_report")} />
        </Card>

        {modules.length > 0 && (
          <Card>
            <CardTitle title={`Modules (${modules.length})`} icon="grid-outline" />
            {modules.map((m: any, i: number) => {
              const title    = typeof m === "string" ? m : (m.title ?? `Module ${i + 1}`);
              const duration = typeof m === "object" ? m.duration : null;
              const desc     = typeof m === "object" ? m.description : null;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: i < modules.length - 1 ? 1 : 0, borderBottomColor: "#f8fafc" }}>
                  <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#f97316" }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>{title}</Text>
                    {duration ? <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{duration}</Text> : null}
                    {desc     ? <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 18 }}>{desc}</Text> : null}
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {/* ══ EDIT MODAL — identical form layout to Add ════════ */}
      {form && (
        <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => !saving && setEditVisible(false)}>
          <View className="flex-1 justify-end bg-black/40">
            <View className="max-h-[92%] rounded-t-[28px] bg-white px-5 pb-8 pt-5">

              {/* Header */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-black text-slate-900">Edit Project Plan</Text>
                  <Text className="mt-1 text-xs text-slate-500">Update project delivery details</Text>
                </View>
                <Pressable onPress={() => !saving && setEditVisible(false)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* ── Basic information ── */}
                <Text className="mb-3 text-sm font-black text-slate-900">Basic information</Text>

                {/* Project selector */}
                <View className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Text className="mb-1.5 text-xs font-bold text-slate-500">Select project</Text>
                  <TextInput
                    value={projectSearch} onChangeText={setProjectSearch}
                    placeholder="Search all projects by code or name"
                    placeholderTextColor="#94a3b8"
                    className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900"
                  />
                  <ScrollView nestedScrollEnabled className="max-h-40">
                    {visibleProjects.length ? visibleProjects.map(p => {
                      const selected = form.projectId === p.id;
                      return (
                        <TouchableOpacity key={p.id} onPress={() => { upd("projectId", p.id); upd("projectCode", p.code); setProjectSearch(`${p.code} - ${p.name}`); }}
                          className={`mb-2 rounded-xl border px-3 py-2.5 ${selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}>
                          <Text className={`text-xs font-bold ${selected ? "text-orange-700" : "text-slate-800"}`}>{p.code} - {p.name}</Text>
                        </TouchableOpacity>
                      );
                    }) : <Text className="px-2 py-3 text-xs text-slate-500">No projects found.</Text>}
                  </ScrollView>
                  {form.projectId ? (
                    <TouchableOpacity onPress={() => { upd("projectId", ""); upd("projectCode", ""); setProjectSearch(""); }} className="mt-1 self-start">
                      <Text className="text-xs font-bold text-rose-600">Clear project</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <FormField label="Plan name *"       value={form.planName}        onChange={v => upd("planName", v)} />
                <FormField label="Plan code"         value={form.planCode}        onChange={v => upd("planCode", v.toUpperCase())} />
                <View className="mb-3">
                  <Text className="mb-1.5 text-xs font-bold text-slate-500">Project code</Text>
                  <TextInput value={form.projectCode} editable={false} placeholder="Select a project above" placeholderTextColor="#94a3b8"
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-slate-500" />
                </View>
                <ChoiceField label="Category"         value={form.category}        options={categories} onChange={v => upd("category", v)} />
                <FormField  label="Short description" value={form.shortDescription} onChange={v => upd("shortDescription", v)} />
                <FormField  label="Full description"  value={form.fullDescription}  onChange={v => upd("fullDescription", v)} multiline />

                {/* ── Project files ── */}
                <Text className="mb-3 mt-3 text-sm font-black text-slate-900">Project files</Text>
                <TouchableOpacity onPress={choosePlanDocument} className="mb-3 flex-row items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                    <Ionicons name="cloud-upload-outline" size={21} color="#f97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-800">Upload project document</Text>
                    <Text className="mt-1 text-xs text-slate-500">PDF, DOC, XLS, TXT</Text>
                    {form.planDocumentName ? <Text className="mt-1 text-xs font-bold text-emerald-600">{form.planDocumentName}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
                <Text className="mb-1.5 text-xs font-bold text-slate-500">Cover image</Text>
                <TouchableOpacity onPress={chooseCoverImage} className="mb-3 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                  {form.coverImage
                    ? <Image source={{ uri: form.coverImage }} className="h-36 w-full" resizeMode="cover" />
                    : <View className="items-center justify-center px-4 py-8">
                        <Ionicons name="image-outline" size={28} color="#f97316" />
                        <Text className="mt-2 font-bold text-slate-700">Choose cover image</Text>
                        <Text className="mt-1 text-xs text-slate-500">JPG, PNG or WEBP</Text>
                      </View>}
                </TouchableOpacity>

                {/* ── Hosting, domain and support ── */}
                <Text className="mb-3 mt-3 text-sm font-black text-slate-900">Hosting, domain and support</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1"><ChoiceField label="Hosting included" value={form.hostingIncluded} options={["Yes","No"]} onChange={v => upd("hostingIncluded", v)} /></View>
                  <View className="flex-1"><ChoiceField label="Domain included"  value={form.domainIncluded}  options={["Yes","No"]} onChange={v => upd("domainIncluded",  v)} /></View>
                </View>
                <FormField label="Hosting type" value={form.hostingType} onChange={v => upd("hostingType", v)} />
                <View className="flex-row gap-3">
                  <View className="flex-1"><FormField label="Storage limit"    value={form.storageLimit}    onChange={v => upd("storageLimit",    v)} /></View>
                  <View className="flex-1"><FormField label="Bandwidth limit"  value={form.bandwidthLimit}  onChange={v => upd("bandwidthLimit",  v)} /></View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1"><FormField label="Domain extension" value={form.domainExtension} onChange={v => upd("domainExtension", v)} /></View>
                  <View className="flex-1"><FormField label="Response SLA"     value={form.responseSla}     onChange={v => upd("responseSla",     v)} /></View>
                </View>

                {/* ── Modules ── */}
                <Text className="mb-3 mt-3 text-sm font-black text-slate-900">Modules</Text>
                {form.modules.map((mod, idx) => (
                  <View key={`${mod.title}-${idx}`} className="mb-2 rounded-2xl border border-slate-200 p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold text-slate-900">{mod.title}</Text>
                      <TouchableOpacity onPress={() => removeModule(idx)}>
                        <Ionicons name="trash-outline" size={17} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-1 text-xs text-slate-500">{mod.duration}{mod.description ? ` - ${mod.description}` : ""}</Text>
                  </View>
                ))}
                <View className="rounded-2xl border border-dashed border-slate-300 p-3">
                  <FormField label="Module title" value={newModule.title} onChange={v => setNewModule(c => ({ ...c, title: v }))} />
                  <View className="flex-row gap-3">
                    <View className="flex-1"><FormField label="Duration" value={newModule.duration} onChange={v => setNewModule(c => ({ ...c, duration: v }))} keyboardType="numeric" /></View>
                    <View className="flex-1"><SelectField label="Duration unit" value={newModule.durationType} options={["Hours","Days","Weeks","Months","Years"]} onChange={v => setNewModule(c => ({ ...c, durationType: v }))} /></View>
                  </View>
                  <FormField label="Description" value={newModule.description} onChange={v => setNewModule(c => ({ ...c, description: v }))} multiline />
                  <TouchableOpacity onPress={chooseModuleDocument} className="mb-3 flex-row items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
                    <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                      <Ionicons name="cloud-upload-outline" size={19} color="#f97316" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800">Upload module document</Text>
                      <Text className="mt-0.5 text-xs text-slate-500">PDF, DOC, XLS, TXT</Text>
                      {newModule.documentName ? <Text className="mt-0.5 text-xs font-bold text-emerald-600">{newModule.documentName}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={17} color="#94a3b8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addModule} className="items-center rounded-xl bg-slate-800 py-3">
                    <Text className="text-xs font-bold text-white">Add module</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Status ── */}
                <Text className="mb-3 mt-3 text-sm font-black text-slate-900">Status</Text>
                <ChoiceField label="Plan status" value={form.status} options={statuses} onChange={v => upd("status", v)} />

                {/* Save */}
                <TouchableOpacity disabled={saving} onPress={handleSave} className="mb-3 mt-3 items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-60">
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text className="font-black text-white">Save Project Plan</Text>}
                </TouchableOpacity>

              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
