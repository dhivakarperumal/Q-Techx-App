import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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

type ProjectPlan = {
  id: string | number;
  planName: string;
  planCode?: string;
  category?: string;
  status?: string;
  shortDescription?: string;
  activeProjectsUsingPlan?: number;
  projectId?: string | number;
  projectName?: string;
  createdAt?: string | number;
  raw?: Record<string, any>;
};

type ProjectOption = { id: string; code: string; name: string };

const extractPlans = (responseData: any): any[] => {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  return payload?.plans || payload?.rows || payload?.results || [];
};

const mapPlan = (plan: any, index: number): ProjectPlan => ({
  id: plan.id ?? plan.uuid ?? index,
  planName: String(
    plan.planName || plan.plan_name || plan.name || "Untitled plan",
  ),
  planCode: plan.planCode || plan.plan_code,
  category: plan.category || "Website",
  status: plan.status || "Draft",
  shortDescription:
    plan.shortDescription || plan.short_description || plan.description,
  activeProjectsUsingPlan:
    Number(
      plan.activeProjectsUsingPlan ?? plan.active_projects_using_plan ?? 0,
    ) || 0,
  projectId: plan.projectId ?? plan.project_id,
  projectName:
    plan.projectName ||
    plan.project_name ||
    plan.project?.project_name ||
    plan.project?.name,
  createdAt:
    plan.createdAt || plan.created_at || plan.created_on || plan.created,
  raw: plan,
});

const formatCreatedAt = (value?: string | number) => {
  if (!value) return "Created just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `Created ${String(value)}`;
  return `Created ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

const extractProjects = (responseData: any): any[] => {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  return payload?.projects || payload?.rows || payload?.results || [];
};

const mapProject = (project: any, index: number): ProjectOption => ({
  id: String(project.uuid ?? project.id ?? index),
  code: String(
    project.project_code ?? project.projectCode ?? project.code ?? "PRJ",
  ),
  name: String(
    project.project_name ??
      project.projectName ??
      project.title ??
      project.name ??
      "Untitled project",
  ),
});

const statusColor = (status: string) => {
  if (status === "Active") return { text: "#15803d", background: "#dcfce7" };
  if (status === "Inactive") return { text: "#be123c", background: "#ffe4e6" };
  return { text: "#b45309", background: "#fef3c7" };
};

const createEmptyForm = () => ({
  planName: "",
  planCode: "",
  category: "Website",
  shortDescription: "",
  fullDescription: "",
  hostingIncluded: "Yes",
  hostingType: "Cloud Hosting",
  storageLimit: "50 GB",
  bandwidthLimit: "200 GB",
  freeSsl: "Yes",
  freeEmailAccounts: "5",
  dailyBackup: "Yes",
  hostingDuration: "12 Months",
  domainIncluded: "Yes",
  domainExtension: ".com",
  domainValidity: "1 Year",
  freeRenewal: "Yes",
  whoisPrivacy: "Yes",
  freeMaintenance: "Yes",
  maintenanceDuration: "6 Months",
  bugFixesIncluded: "Yes",
  securityUpdates: "Yes",
  performanceOptimization: "Yes",
  backupSupport: "Yes",
  emailSupport: "Yes",
  phoneSupport: "Yes",
  whatsappSupport: "No",
  liveChat: "Yes",
  prioritySupport: "No",
  dedicatedProjectManager: "No",
  supportDuration: "6 Months",
  responseSla: "24 Hours",
  sourceCode: "Yes",
  documentation: "Yes",
  installationGuide: "Yes",
  apiDocumentation: "No",
  userManual: "Yes",
  adminManual: "Yes",
  trainingSession: "No",
  deployment: "Yes",
  testingReport: "Yes",
  featuredBadge: "Recommended",
  status: "Active",
  coverImage: "",
  coverImageAsset: null as unknown,
  planDocument: null as unknown,
  planDocumentName: "",
  newTech: "",
  newModuleTitle: "",
  newModuleDuration: "",
  newModuleDurationType: "Days",
  newModuleDescription: "",
  newModuleDocumentName: "",
  salesNotes: "",
  technicalNotes: "",
  includedModules: [] as string[],
  modules: [] as {
    title: string;
    duration: string;
    description: string;
    documentName?: string;
    document?: unknown;
  }[],
  activeProjectsUsingPlan: 0,
  completedProjectsUsingPlan: 0,
  createdBy: "Admin",
  projectId: "",
  projectCode: "",
});

type PlanForm = ReturnType<typeof createEmptyForm>;
const categories = [
  "Website",
  "Web Application",
  "Mobile Application",
  "ERP",
  "CRM",
  "SaaS",
  "E-commerce",
];
const statuses = ["Draft", "Active", "Inactive"];
const generatePlanCode = (plans: ProjectPlan[]) => {
  const highestNumber = plans.reduce((highest, plan) => {
    const code = String(plan.planCode || "")
      .trim()
      .toUpperCase();
    const match = code.match(/^PLAN-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `PLAN-${String(highestNumber + 1).padStart(3, "0")}`;
};

function FormField({
  label,
  value,
  onChange,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor="#94a3b8"
        className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 ${multiline ? "min-h-[82px] py-3" : "py-3.5"}`}
      />
    </View>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              className={`rounded-full border px-3 py-2 ${value === option ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
            >
              <Text
                className={`text-xs font-bold ${value === option ? "text-orange-600" : "text-slate-600"}`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            label,
            "Select an option",
            options.map((option) => ({
              text: option,
              onPress: () => onChange(option),
            })),
          )
        }
        className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5"
      >
        <Text className="text-sm font-semibold text-slate-800">{value}</Text>
        <Ionicons name="chevron-down" size={17} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

export default function ProjectPlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PlanForm>(createEmptyForm);
  const [newModule, setNewModule] = useState({
    title: "",
    duration: "",
    durationType: "Days",
    description: "",
    documentName: "",
    document: null as unknown,
  });
  const [projectSearch, setProjectSearch] = useState("");

  const fetchPlans = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get("/project-plans");
      setPlans(extractPlans(response.data).map(mapPlan));
      setError("");
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to load project plans.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    api
      .get("/projects?limit=1000&page=1")
      .then((response) => {
        setProjects(extractProjects(response.data).map(mapProject));
      })
      .catch(() => setProjects([]));
  }, [fetchPlans]);

  const activeCount = useMemo(
    () => plans.filter((plan) => plan.status === "Active").length,
    [plans],
  );

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setEditPlanId(null);
    setForm(createEmptyForm());
    setNewModule({
      title: "",
      duration: "",
      durationType: "Days",
      description: "",
      documentName: "",
      document: null,
    });
    setProjectSearch("");
  };

  const openCreateModal = () => {
    setEditPlanId(null);
    setForm({ ...createEmptyForm(), planCode: generatePlanCode(plans) });
    setModalVisible(true);
  };

  const openEditModal = (plan: ProjectPlan) => {
    const raw = plan.raw || {};
    const gv = (camel: string, snake: string) => raw?.[camel] ?? raw?.[snake];
    const pForm: PlanForm = {
      ...createEmptyForm(),
      planName: gv("planName", "plan_name") ?? "",
      planCode: gv("planCode", "plan_code") ?? "",
      category: raw?.category ?? "Website",
      status: raw?.status ?? "Draft",
      shortDescription: gv("shortDescription", "short_description") ?? "",
      fullDescription:
        gv("fullDescription", "full_description") ?? raw?.description ?? "",
      hostingIncluded: gv("hostingIncluded", "hosting_included") ?? "Yes",
      hostingType: gv("hostingType", "hosting_type") ?? "Cloud Hosting",
      storageLimit: gv("storageLimit", "storage_limit") ?? "50 GB",
      bandwidthLimit: gv("bandwidthLimit", "bandwidth_limit") ?? "200 GB",
      freeSsl: gv("freeSsl", "free_ssl") ?? "Yes",
      freeEmailAccounts: gv("freeEmailAccounts", "free_email_accounts") ?? "5",
      dailyBackup: gv("dailyBackup", "daily_backup") ?? "Yes",
      hostingDuration: gv("hostingDuration", "hosting_duration") ?? "12 Months",
      domainIncluded: gv("domainIncluded", "domain_included") ?? "Yes",
      domainExtension: gv("domainExtension", "domain_extension") ?? ".com",
      domainValidity: gv("domainValidity", "domain_validity") ?? "1 Year",
      freeRenewal: gv("freeRenewal", "free_renewal") ?? "Yes",
      whoisPrivacy: gv("whoisPrivacy", "whois_privacy") ?? "Yes",
      freeMaintenance: gv("freeMaintenance", "free_maintenance") ?? "Yes",
      maintenanceDuration:
        gv("maintenanceDuration", "maintenance_duration") ?? "6 Months",
      bugFixesIncluded: gv("bugFixesIncluded", "bug_fixes_included") ?? "Yes",
      securityUpdates: gv("securityUpdates", "security_updates") ?? "Yes",
      performanceOptimization:
        gv("performanceOptimization", "performance_optimization") ?? "Yes",
      backupSupport: gv("backupSupport", "backup_support") ?? "Yes",
      emailSupport: gv("emailSupport", "email_support") ?? "Yes",
      phoneSupport: gv("phoneSupport", "phone_support") ?? "Yes",
      whatsappSupport: gv("whatsappSupport", "whatsapp_support") ?? "No",
      liveChat: gv("liveChat", "live_chat") ?? "Yes",
      prioritySupport: gv("prioritySupport", "priority_support") ?? "No",
      dedicatedProjectManager:
        gv("dedicatedProjectManager", "dedicated_project_manager") ?? "No",
      supportDuration: gv("supportDuration", "support_duration") ?? "6 Months",
      responseSla: gv("responseSla", "response_sla") ?? "24 Hours",
      sourceCode: gv("sourceCode", "source_code") ?? "Yes",
      documentation: raw?.documentation ?? "Yes",
      installationGuide: gv("installationGuide", "installation_guide") ?? "Yes",
      apiDocumentation: gv("apiDocumentation", "api_documentation") ?? "No",
      userManual: gv("userManual", "user_manual") ?? "Yes",
      adminManual: gv("adminManual", "admin_manual") ?? "Yes",
      trainingSession: gv("trainingSession", "training_session") ?? "No",
      deployment: raw?.deployment ?? "Yes",
      testingReport: gv("testingReport", "testing_report") ?? "Yes",
      featuredBadge: gv("featuredBadge", "featured_badge") ?? "Recommended",
      salesNotes: gv("salesNotes", "sales_notes") ?? "",
      technicalNotes: gv("technicalNotes", "technical_notes") ?? "",
      coverImage: gv("coverImage", "cover_image") ?? "",
      planDocumentName: gv("planDocumentName", "plan_document_name") ?? "",
      projectId: gv("projectId", "project_id") ?? "",
      projectCode: gv("projectCode", "project_code") ?? "",
      modules: (raw?.modules ?? []) as any[],
      includedModules: ((raw?.modules ?? []) as any[]).map((m: any) =>
        typeof m === "string" ? m : (m.title ?? ""),
      ),
    };

    setEditPlanId(plan.id);
    setForm(pForm);
    setProjectSearch(
      pForm.projectId ? `${pForm.projectCode} - ${pForm.planName}` : "",
    );
    setModalVisible(true);
  };

  const updateForm = <K extends keyof PlanForm>(field: K, value: PlanForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const addModule = () => {
    if (!newModule.title.trim() || !newModule.duration.trim()) return;
    updateForm("modules", [
      ...form.modules,
      {
        ...newModule,
        title: newModule.title.trim(),
        duration: `${newModule.duration.trim()} ${newModule.durationType}`,
      },
    ]);
    updateForm("includedModules", [
      ...form.includedModules,
      newModule.title.trim(),
    ]);
    setNewModule({
      title: "",
      duration: "",
      durationType: "Days",
      description: "",
      documentName: "",
      document: null,
    });
  };

  const chooseModuleDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.ms-excel",
        "text/plain",
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setNewModule((current) => ({
        ...current,
        document: result.assets[0],
        documentName: result.assets[0].name,
      }));
    }
  };

  const choosePlanDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.ms-excel",
        "text/plain",
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      updateForm("planDocument", result.assets[0]);
      updateForm("planDocumentName", result.assets[0].name);
    }
  };

  const chooseCoverImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      updateForm("coverImage", result.assets[0].uri);
      updateForm("coverImageAsset", result.assets[0]);
    }
  };

  const visibleProjects = projects.filter((project) =>
    `${project.code} ${project.name}`
      .toLowerCase()
      .includes(projectSearch.trim().toLowerCase()),
  );

  const savePlan = async () => {
    if (!form.planName.trim()) {
      Alert.alert("Plan name required", "Enter a name for this project plan.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        planName: form.planName.trim(),
        planCode: form.planCode.trim() || generatePlanCode(plans),
        modules: form.modules.map(({ document, ...module }) => module),
        includedModules: form.modules.map((module) => module.title),
        status: form.status || "Draft",
      };
      delete (payload as any).coverImageAsset;
      delete (payload as any).planDocument;

      const toUploadFile = (asset: any) => ({
        uri: asset.uri,
        name: asset.name || `upload-${Date.now()}`,
        type: asset.mimeType || asset.type || "application/octet-stream",
      });

      const hasFile = Boolean(
        form.coverImageAsset ||
        form.planDocument ||
        form.modules.some((module) => Boolean(module.document)),
      );
      let requestBody: FormData | typeof payload = payload;
      if (hasFile) {
        const multipart = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          multipart.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          );
        });
        if (form.coverImageAsset) {
          multipart.append(
            "cover_image",
            toUploadFile(form.coverImageAsset) as any,
          );
        }
        if (form.planDocument) {
          multipart.append(
            "plan_document",
            toUploadFile(form.planDocument) as any,
          );
        }
        form.modules.forEach((module) => {
          if (module.document) {
            multipart.append(
              "module_documents",
              toUploadFile(module.document) as any,
            );
          }
        });
        requestBody = multipart;
      }

      if (editPlanId) {
        await api.put(
          `/project-plans/${editPlanId}`,
          requestBody,
          hasFile
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined,
        );
        Alert.alert("Plan updated", "The project plan was saved successfully.");
      } else {
        await api.post(
          "/project-plans",
          requestBody,
          hasFile
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined,
        );
        Alert.alert(
          "Plan created",
          "The new project plan was saved successfully.",
        );
      }

      closeModal();
      fetchPlans(true);
    } catch (requestError: any) {
      Alert.alert(
        `Could not ${editPlanId ? "update" : "create"} plan`,
        requestError?.data?.message ||
          requestError?.data?.data?.message ||
          requestError?.message ||
          "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const duplicatePlan = async (plan: ProjectPlan) => {
    const source = { ...(plan.raw || {}) };
    delete source.id;
    delete source.uuid;
    delete source.createdAt;
    delete source.created_at;
    delete source.updatedAt;
    delete source.updated_at;
    delete source.coverImageAsset;
    delete source.planDocument;

    const duplicatePayload = {
      ...source,
      planName: `${plan.planName} Copy`,
      planCode: generatePlanCode(plans),
      status: "Draft",
      activeProjectsUsingPlan: 0,
      completedProjectsUsingPlan: 0,
    };

    try {
      const response = await api.post("/project-plans", duplicatePayload);
      const created = response.data?.data || response.data;
      setPlans((current) => [
        mapPlan(
          {
            ...created,
            createdAt:
              created.createdAt ||
              created.created_at ||
              new Date().toISOString(),
          },
          Date.now(),
        ),
        ...current,
      ]);
      Alert.alert(
        "Plan duplicated",
        `${duplicatePayload.planName} was created as a draft.`,
      );
    } catch (requestError: any) {
      Alert.alert(
        "Could not duplicate plan",
        requestError?.message || "Please try again.",
      );
    }
  };

  const deletePlan = (plan: ProjectPlan) => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.planName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/project-plans/${plan.id}`);
              setPlans((curr) => curr.filter((p) => p.id !== plan.id));
            } catch (err: any) {
              Alert.alert("Delete failed", err?.message || "Please try again");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
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
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Project Plans</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-[140px] pt-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPlans(true)}
            tintColor="#f97316"
          />
        }
      >
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="mt-3 text-sm text-slate-500">
              Loading project plans...
            </Text>
          </View>
        ) : error ? (
          <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <Text className="font-semibold text-rose-700">{error}</Text>
            <TouchableOpacity
              onPress={() => fetchPlans()}
              className="mt-3 self-start rounded-xl bg-rose-600 px-4 py-2"
            >
              <Text className="font-bold text-white">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Ionicons name="layers-outline" size={30} color="#f97316" />
            </View>
            <Text className="text-lg font-black text-slate-900">
              No project plans yet
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              Create your first plan using the plus button.
            </Text>
          </View>
        ) : (
          plans.map((plan) => {
            const colors = statusColor(plan.status || "Draft");
            return (
              <TouchableOpacity
                key={String(plan.id)}
                activeOpacity={0.88}
                onPress={() =>
                  router.push(`/admin/plan-detail/${plan.id}` as any)
                }
                className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <View className="flex-row items-start">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <Ionicons name="layers-outline" size={24} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text className="flex-1 text-base font-black text-slate-900">
                        {plan.planName}
                      </Text>
                      <Text
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{
                          color: colors.text,
                          backgroundColor: colors.background,
                        }}
                      >
                        {plan.status}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs font-semibold text-slate-400">
                      {plan.planCode || "No plan code"} - {plan.category}
                    </Text>
                    {plan.projectName ? (
                      <Text className="mt-1 text-xs font-semibold text-blue-600">
                        Project: {plan.projectName}
                      </Text>
                    ) : null}
                    <View className="mt-2 flex-row items-center">
                      <Ionicons name="time-outline" size={13} color="#94a3b8" />
                      <Text className="ml-1 text-xs text-slate-400">
                        {formatCreatedAt(plan.createdAt)}
                      </Text>
                    </View>
                    {plan.shortDescription ? (
                      <Text
                        className="mt-2 text-sm leading-5 text-slate-500"
                        numberOfLines={2}
                      >
                        {plan.shortDescription}
                      </Text>
                    ) : null}
                    <View className="mt-3 flex-row items-center">
                      <Ionicons
                        name="folder-open-outline"
                        size={14}
                        color="#94a3b8"
                      />
                      <Text className="ml-1 text-xs text-slate-500">
                        {plan.activeProjectsUsingPlan} active projects
                      </Text>
                    </View>
                    <View className="mt-3 flex-row flex-wrap items-center gap-2">
                      <TouchableOpacity
                        accessibilityLabel={`View ${plan.planName}`}
                        onPress={() =>
                          router.push(`/admin/plan-detail/${plan.id}` as any)
                        }
                        className="flex-row items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"
                      >
                        <Ionicons
                          name="eye-outline"
                          size={15}
                          color="#2563eb"
                        />
                        <Text className="ml-1.5 text-xs font-bold text-blue-700">
                          View Details
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel={`Edit ${plan.planName}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openEditModal(plan);
                        }}
                        className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <Ionicons
                          name="create-outline"
                          size={15}
                          color="#475569"
                        />
                        <Text className="ml-1.5 text-xs font-bold text-slate-700">
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel={`Duplicate ${plan.planName}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          duplicatePlan(plan);
                        }}
                        className="flex-row items-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-2"
                      >
                        <Ionicons
                          name="copy-outline"
                          size={15}
                          color="#ea580c"
                        />
                        <Text className="ml-1.5 text-xs font-bold text-orange-700">
                          Duplicate
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel={`Delete ${plan.planName}`}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          deletePlan(plan);
                        }}
                        className="flex-row items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color="#dc2626"
                        />
                        <Text className="ml-1.5 text-xs font-bold text-red-700">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View className="absolute bottom-20 right-5 z-10">
        <TouchableOpacity
          accessibilityLabel="Add project plan"
          onPress={openCreateModal}
          className="h-20 w-20 items-center justify-center rounded-full bg-orange-500 shadow-xl"
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-[28px] bg-white overflow-hidden">
            <View className="bg-black px-5 pb-6 pt-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-black text-orange-500">
                  {editPlanId ? "Edit Project Plan" : "Add Project Plan"}
                </Text>
                <Text className="mt-1 text-xs text-white">
                  {editPlanId
                    ? "Update project delivery details"
                    : "Configure project delivery details"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={closeModal}
                className="h-9 w-9 items-center justify-center rounded-full bg-orange-100"
              >
                <Ionicons name="close" size={20} color="#f97316" />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            >
              <Text className="mb-3 text-sm font-black text-slate-900">
                Basic information
              </Text>
              <View className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Text className="mb-1.5 text-xs font-bold text-slate-500">
                  Select project
                </Text>
                <TextInput
                  value={projectSearch}
                  onChangeText={setProjectSearch}
                  placeholder="Search all projects by code or name"
                  placeholderTextColor="#94a3b8"
                  className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900"
                />
                <ScrollView nestedScrollEnabled className="max-h-40">
                  {visibleProjects.length ? (
                    visibleProjects.map((project) => {
                      const selected = form.projectId === project.id;
                      return (
                        <TouchableOpacity
                          key={project.id}
                          onPress={() => {
                            updateForm("projectId", project.id);
                            updateForm("projectCode", project.code);
                            setProjectSearch(
                              `${project.code} - ${project.name}`,
                            );
                          }}
                          className={`mb-2 rounded-xl border px-3 py-2.5 ${selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
                        >
                          <Text
                            className={`text-xs font-bold ${selected ? "text-orange-700" : "text-slate-800"}`}
                          >
                            {project.code} - {project.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text className="px-2 py-3 text-xs text-slate-500">
                      No projects found.
                    </Text>
                  )}
                </ScrollView>
                {form.projectId ? (
                  <TouchableOpacity
                    onPress={() => {
                      updateForm("projectId", "");
                      updateForm("projectCode", "");
                      setProjectSearch("");
                    }}
                    className="mt-1 self-start"
                  >
                    <Text className="text-xs font-bold text-rose-600">
                      Clear project
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <FormField
                label="Plan name *"
                value={form.planName}
                onChange={(value) => updateForm("planName", value)}
              />
              <FormField
                label="Plan code"
                value={form.planCode}
                onChange={(value) =>
                  updateForm("planCode", value.toUpperCase())
                }
              />
              <View className="mb-3">
                <Text className="mb-1.5 text-xs font-bold text-slate-500">
                  Project code
                </Text>
                <TextInput
                  value={form.projectCode}
                  editable={false}
                  placeholder="Select a project above"
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-slate-500"
                />
              </View>
              <ChoiceField
                label="Category"
                value={form.category}
                options={categories}
                onChange={(value) => updateForm("category", value)}
              />
              <FormField
                label="Short description"
                value={form.shortDescription}
                onChange={(value) => updateForm("shortDescription", value)}
              />
              <FormField
                label="Full description"
                value={form.fullDescription}
                onChange={(value) => updateForm("fullDescription", value)}
                multiline
              />

              <Text className="mb-3 mt-3 text-sm font-black text-slate-900">
                Project files
              </Text>
              <TouchableOpacity
                onPress={choosePlanDocument}
                className="mb-3 flex-row items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Ionicons
                    name="cloud-upload-outline"
                    size={21}
                    color="#f97316"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-800">
                    Upload project document
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    PDF, DOC, XLS, TXT
                  </Text>
                  {form.planDocumentName ? (
                    <Text className="mt-1 text-xs font-bold text-emerald-600">
                      {form.planDocumentName}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
              <Text className="mb-1.5 text-xs font-bold text-slate-500">
                Cover image
              </Text>
              <TouchableOpacity
                onPress={chooseCoverImage}
                className="mb-3 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50"
              >
                {form.coverImage ? (
                  <Image
                    source={{ uri: form.coverImage }}
                    className="h-36 w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="items-center justify-center px-4 py-8">
                    <Ionicons name="image-outline" size={28} color="#f97316" />
                    <Text className="mt-2 font-bold text-slate-700">
                      Choose cover image
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      JPG, PNG or WEBP
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text className="mb-3 mt-3 text-sm font-black text-slate-900">
                Hosting, domain and support
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <ChoiceField
                    label="Hosting included"
                    value={form.hostingIncluded}
                    options={["Yes", "No"]}
                    onChange={(value) => updateForm("hostingIncluded", value)}
                  />
                </View>
                <View className="flex-1">
                  <ChoiceField
                    label="Domain included"
                    value={form.domainIncluded}
                    options={["Yes", "No"]}
                    onChange={(value) => updateForm("domainIncluded", value)}
                  />
                </View>
              </View>
              <FormField
                label="Hosting type"
                value={form.hostingType}
                onChange={(value) => updateForm("hostingType", value)}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField
                    label="Storage limit"
                    value={form.storageLimit}
                    onChange={(value) => updateForm("storageLimit", value)}
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Bandwidth limit"
                    value={form.bandwidthLimit}
                    onChange={(value) => updateForm("bandwidthLimit", value)}
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField
                    label="Domain extension"
                    value={form.domainExtension}
                    onChange={(value) => updateForm("domainExtension", value)}
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Response SLA"
                    value={form.responseSla}
                    onChange={(value) => updateForm("responseSla", value)}
                  />
                </View>
              </View>

              <Text className="mb-3 mt-3 text-sm font-black text-slate-900">
                Modules
              </Text>
              {form.modules.map((module, index) => (
                <View
                  key={`${module.title}-${index}`}
                  className="mb-2 rounded-2xl border border-slate-200 p-3"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-slate-900">
                      {module.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setForm((current) => ({
                          ...current,
                          modules: current.modules.filter(
                            (_, moduleIndex) => moduleIndex !== index,
                          ),
                          includedModules: current.includedModules.filter(
                            (item) => item !== module.title,
                          ),
                        }))
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="mt-1 text-xs text-slate-500">
                    {module.duration}
                    {module.description ? ` - ${module.description}` : ""}
                  </Text>
                </View>
              ))}
              <View className="rounded-2xl border border-dashed border-slate-300 p-3">
                <FormField
                  label="Module title"
                  value={newModule.title}
                  onChange={(value) =>
                    setNewModule((current) => ({ ...current, title: value }))
                  }
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <FormField
                      label="Duration"
                      value={newModule.duration}
                      onChange={(value) =>
                        setNewModule((current) => ({
                          ...current,
                          duration: value,
                        }))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <SelectField
                      label="Duration unit"
                      value={newModule.durationType}
                      options={["Hours", "Days", "Weeks", "Months", "Years"]}
                      onChange={(value) =>
                        setNewModule((current) => ({
                          ...current,
                          durationType: value,
                        }))
                      }
                    />
                  </View>
                </View>
                <FormField
                  label="Description"
                  value={newModule.description}
                  onChange={(value) =>
                    setNewModule((current) => ({
                      ...current,
                      description: value,
                    }))
                  }
                  multiline
                />
                <TouchableOpacity
                  onPress={chooseModuleDocument}
                  className="mb-3 flex-row items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3"
                >
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={19}
                      color="#f97316"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-800">
                      Upload module document
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      PDF, DOC, XLS, TXT
                    </Text>
                    {newModule.documentName ? (
                      <Text className="mt-0.5 text-xs font-bold text-emerald-600">
                        {newModule.documentName}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addModule}
                  className="items-center rounded-xl bg-slate-800 py-3"
                >
                  <Text className="text-xs font-bold text-white">
                    Add module
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="mb-3 mt-3 text-sm font-black text-slate-900">
                Status
              </Text>
              <ChoiceField
                label="Plan status"
                value={form.status}
                options={statuses}
                onChange={(value) => updateForm("status", value)}
              />
              <TouchableOpacity
                disabled={saving}
                onPress={savePlan}
                className="mb-3 mt-3 items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-60"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-black text-white">
                    {editPlanId ? "Save Changes" : "Save Project Plan"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </Modal>
      </SafeAreaView>
  );
}
