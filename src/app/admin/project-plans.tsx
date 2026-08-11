import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../api";
import { AdminBottomBar } from "../../components/admin-bottom-bar";

type ProjectPlan = {
  id: string | number;
  planName: string;
  planCode?: string;
  category?: string;
  status?: string;
  shortDescription?: string;
  activeProjectsUsingPlan?: number;
};

const extractPlans = (responseData: any): any[] => {
  const payload = responseData?.data ?? responseData;
  if (Array.isArray(payload)) return payload;
  return payload?.plans || payload?.rows || payload?.results || [];
};

const mapPlan = (plan: any, index: number): ProjectPlan => ({
  id: plan.id ?? plan.uuid ?? index,
  planName: String(plan.planName || plan.plan_name || plan.name || "Untitled plan"),
  planCode: plan.planCode || plan.plan_code,
  category: plan.category || "Website",
  status: plan.status || "Draft",
  shortDescription: plan.shortDescription || plan.short_description || plan.description,
  activeProjectsUsingPlan: Number(plan.activeProjectsUsingPlan ?? plan.active_projects_using_plan ?? 0) || 0,
});

const statusColor = (status: string) => {
  if (status === "Active") return { text: "#15803d", background: "#dcfce7" };
  if (status === "Inactive") return { text: "#be123c", background: "#ffe4e6" };
  return { text: "#b45309", background: "#fef3c7" };
};

export default function ProjectPlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [category, setCategory] = useState("Website");

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
  }, [fetchPlans]);

  const activeCount = useMemo(() => plans.filter((plan) => plan.status === "Active").length, [plans]);

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setPlanName("");
    setPlanCode("");
    setCategory("Website");
  };

  const createPlan = async () => {
    if (!planName.trim()) {
      Alert.alert("Plan name required", "Enter a name for this project plan.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/project-plans", {
        planName: planName.trim(),
        planCode: planCode.trim() || `PLAN-${String(plans.length + 1).padStart(3, "0")}`,
        category,
        status: "Draft",
        includedModules: [],
        technologyStack: [],
        modules: [],
      });
      const created = response.data?.data || response.data;
      setPlans((current) => [mapPlan(created, Date.now()), ...current]);
      closeModal();
      Alert.alert("Plan created", "The new project plan was saved as a draft.");
    } catch (requestError: any) {
      Alert.alert("Could not create plan", requestError?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-5 pb-4 pt-12">
        <View className="flex-row items-center">
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="arrow-back" size={20} color="#334155" />
          </Pressable>
          <View>
            <Text className="text-xl font-black text-slate-900">Project Plans</Text>
            <Text className="mt-0.5 text-xs text-slate-500">{plans.length} plans, {activeCount} active</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityLabel="Add project plan" onPress={() => setModalVisible(true)} className="h-11 w-11 items-center justify-center rounded-full bg-orange-500 shadow-sm">
          <Ionicons name="add" size={25} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32 pt-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPlans(true)} tintColor="#f97316" />}
      >
        {loading ? (
          <View className="items-center py-16"><ActivityIndicator size="large" color="#f97316" /><Text className="mt-3 text-sm text-slate-500">Loading project plans...</Text></View>
        ) : error ? (
          <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><Text className="font-semibold text-rose-700">{error}</Text><TouchableOpacity onPress={() => fetchPlans()} className="mt-3 self-start rounded-xl bg-rose-600 px-4 py-2"><Text className="font-bold text-white">Try again</Text></TouchableOpacity></View>
        ) : plans.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16"><View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-orange-50"><Ionicons name="layers-outline" size={30} color="#f97316" /></View><Text className="text-lg font-black text-slate-900">No project plans yet</Text><Text className="mt-2 text-center text-sm text-slate-500">Create your first plan using the plus button.</Text></View>
        ) : (
          plans.map((plan) => {
            const colors = statusColor(plan.status || "Draft");
            return (
              <View key={String(plan.id)} className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <View className="flex-row items-start">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"><Ionicons name="layers-outline" size={24} color="#2563eb" /></View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3"><Text className="flex-1 text-base font-black text-slate-900">{plan.planName}</Text><Text className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: colors.text, backgroundColor: colors.background }}>{plan.status}</Text></View>
                    <Text className="mt-1 text-xs font-semibold text-slate-400">{plan.planCode || "No plan code"} - {plan.category}</Text>
                    {plan.shortDescription ? <Text className="mt-2 text-sm leading-5 text-slate-500" numberOfLines={2}>{plan.shortDescription}</Text> : null}
                    <View className="mt-3 flex-row items-center"><Ionicons name="folder-open-outline" size={14} color="#94a3b8" /><Text className="ml-1 text-xs text-slate-500">{plan.activeProjectsUsingPlan} active projects</Text></View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <AdminBottomBar />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between"><Text className="text-xl font-black text-slate-900">Add Project Plan</Text><Pressable accessibilityLabel="Close" onPress={closeModal} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Ionicons name="close" size={20} color="#64748b" /></Pressable></View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Plan name</Text>
            <TextInput value={planName} onChangeText={setPlanName} placeholder="e.g. Business Website" placeholderTextColor="#94a3b8" className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900" />
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Plan code</Text>
            <TextInput value={planCode} onChangeText={setPlanCode} autoCapitalize="characters" placeholder="Optional, e.g. PLAN-001" placeholderTextColor="#94a3b8" className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900" />
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6"><View className="flex-row gap-2">{["Website", "Web Application", "Mobile Application", "ERP", "CRM"].map((item) => <TouchableOpacity key={item} onPress={() => setCategory(item)} className={`rounded-full border px-4 py-2.5 ${category === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}><Text className={`text-xs font-bold ${category === item ? "text-orange-600" : "text-slate-600"}`}>{item}</Text></TouchableOpacity>)}</View></ScrollView>
            <TouchableOpacity disabled={saving} onPress={createPlan} className="items-center rounded-2xl bg-orange-500 py-4 disabled:opacity-60">{saving ? <ActivityIndicator color="#fff" /> : <Text className="font-black text-white">Create Draft Plan</Text>}</TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
