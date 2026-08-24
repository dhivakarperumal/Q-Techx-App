import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api";

type ContactRequest = {
  uuid?: string;
  id?: string | number;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: string;
  admin_notes?: string;
  created_at?: string;
};

const STATUSES = [
  "All",
  "New",
  "Contacted",
  "In Progress",
  "Resolved",
  "Closed",
];

const statusColor = (status?: string) => {
  switch (status) {
    case "New":
      return "#f59e0b";

    case "Contacted":
      return "#0ea5e9";

    case "In Progress":
      return "#8b5cf6";

    case "Resolved":
      return "#10b981";

    case "Closed":
      return "#64748b";

    default:
      return "#f97316";
  }
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name?: string) => {
  if (!name) return "??";

  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0] || "")
      .join("")
      .toUpperCase() || "??"
  );
};

function StatusPill({ status }: { status?: string }) {
  const color = statusColor(status);

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{
        backgroundColor: `${color}18`,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        />

        <Text
          className="text-[9px] font-black"
          style={{ color }}
        >
          {status || "New"}
        </Text>
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View
      className="w-[48%] mb-3 rounded-2xl overflow-hidden bg-white border border-orange-100"
      style={{
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="p-4">

        <View className="flex-row items-center mb-3">

          <View className="w-10 h-10 rounded-xl bg-black items-center justify-center">
            <Ionicons
              name={icon as any}
              size={20}
              color={color}
            />
          </View>

          <Text
            className="ml-2 flex-1 text-[10px] font-bold uppercase tracking-[0.5px] text-slate-500"
            numberOfLines={2}
          >
            {label}
          </Text>

        </View>

        <Text className="text-[23px] font-black text-black">
          {value}
        </Text>

      </View>
    </View>
  );
}

/* =========================================================
   VIEW CONTACT REQUEST
========================================================= */

function ViewContactModal({
  request,
  onClose,
  onUpdate,
  onDelete,
}: {
  request: ContactRequest | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  if (!request) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">

        <View className="bg-white rounded-t-3xl max-h-[92%]">

          {/* Header */}
          <View className="bg-black rounded-t-3xl px-5 pt-5 pb-5">

            <View className="flex-row items-center justify-between">

              <View className="flex-row items-center flex-1">

                <View className="w-12 h-12 rounded-2xl bg-orange-500 items-center justify-center">
                  <Text className="text-white font-black text-base">
                    {getInitials(request.name)}
                  </Text>
                </View>

                <View className="ml-3 flex-1">

                  <Text
                    className="text-white text-lg font-black"
                    numberOfLines={1}
                  >
                    {request.name || "Unknown"}
                  </Text>

                  <Text
                    className="text-orange-300 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {request.subject || "General Inquiry"}
                  </Text>

                  <View className="mt-2">
                    <StatusPill
                      status={request.status || "New"}
                    />
                  </View>

                </View>

              </View>

              <Pressable onPress={onClose}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color="#f97316"
                />
              </Pressable>

            </View>

          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 35,
            }}
          >

            {/* Contact Actions */}
            <View className="flex-row gap-3 mb-5">

              {request.email && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Email",
                      request.email
                    )
                  }
                  className="flex-1 bg-blue-50 border border-blue-100 rounded-xl py-3 items-center"
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#3b82f6"
                  />

                  <Text className="text-blue-600 text-[10px] font-bold mt-1">
                    Email
                  </Text>
                </TouchableOpacity>
              )}

              {(request.mobile || request.phone) && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Phone",
                      request.mobile || request.phone
                    )
                  }
                  className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl py-3 items-center"
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="#10b981"
                  />

                  <Text className="text-emerald-600 text-[10px] font-bold mt-1">
                    Call
                  </Text>
                </TouchableOpacity>
              )}

            </View>

            {/* Sender Information */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Sender Information
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">

              <View className="flex-row items-center">

                <Ionicons
                  name="mail-outline"
                  size={17}
                  color="#94a3b8"
                />

                <View className="ml-3 flex-1">

                  <Text className="text-[10px] uppercase text-slate-400">
                    Email Address
                  </Text>

                  <Text className="text-sm font-semibold text-slate-700 mt-0.5">
                    {request.email || "-"}
                  </Text>

                </View>

              </View>

              <View className="border-t border-slate-200 mt-3 pt-3 flex-row items-center">

                <Ionicons
                  name="call-outline"
                  size={17}
                  color="#94a3b8"
                />

                <View className="ml-3 flex-1">

                  <Text className="text-[10px] uppercase text-slate-400">
                    Mobile Number
                  </Text>

                  <Text className="text-sm font-semibold text-slate-700 mt-0.5">
                    {request.mobile ||
                      request.phone ||
                      "-"}
                  </Text>

                </View>

              </View>

            </View>

            {/* Subject */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Subject / Topic
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">

              <Text className="text-sm font-bold text-slate-800">
                {request.subject || "General Inquiry"}
              </Text>

            </View>

            {/* Message */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Message
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">

              <Text className="text-sm text-slate-600 leading-6">
                {request.message ||
                  "No message provided."}
              </Text>

            </View>

            {/* Admin Notes */}
            {request.admin_notes && (
              <>
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Internal Admin Notes
                </Text>

                <View className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5">

                  <Text className="text-orange-700 text-xs leading-5">
                    {request.admin_notes}
                  </Text>

                </View>
              </>
            )}

            {/* Metadata */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Submission Details
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">

              <View className="flex-row items-center justify-between">

                <Text className="text-xs text-slate-400">
                  Status
                </Text>

                <StatusPill
                  status={request.status || "New"}
                />

              </View>

              <View className="flex-row items-center justify-between border-t border-slate-200 mt-3 pt-3">

                <Text className="text-xs text-slate-400">
                  Submitted
                </Text>

                <Text className="text-xs font-semibold text-slate-700">
                  {formatDateTime(request.created_at)}
                </Text>

              </View>

              <View className="flex-row items-center justify-between border-t border-slate-200 mt-3 pt-3">

                <Text className="text-xs text-slate-400">
                  Identifier
                </Text>

                <Text
                  className="text-[9px] text-slate-500"
                  numberOfLines={1}
                >
                  {request.uuid || "-"}
                </Text>

              </View>

            </View>

            {/* Bottom Actions */}
            <View className="flex-row gap-3 mt-6">

              <TouchableOpacity
                onPress={onUpdate}
                className="flex-1 bg-orange-500 rounded-xl py-3.5 items-center"
              >
                <Text className="text-white font-bold">
                  Update Status
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onDelete}
                className="w-14 bg-rose-50 rounded-xl items-center justify-center"
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#e11d48"
                />
              </TouchableOpacity>

            </View>

          </ScrollView>

        </View>

      </View>
    </Modal>
  );
}

/* =========================================================
   STATUS MODAL
========================================================= */

function StatusModal({
  request,
  onClose,
  onSuccess,
}: {
  request: ContactRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(
    request?.status || "New"
  );

  const [adminNotes, setAdminNotes] = useState(
    request?.admin_notes || ""
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(request?.status || "New");
    setAdminNotes(request?.admin_notes || "");
  }, [request]);

  const saveStatus = async () => {
    if (!request?.uuid) return;

    setSaving(true);

    try {

      const { data } = await api.patch(
        `/contacts/${request.uuid}/status`,
        {
          status,
          admin_notes: adminNotes,
        }
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      Alert.alert(
        "Success",
        "Contact request updated successfully."
      );

      onSuccess();
      onClose();

    } catch (error: any) {

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update status."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={Boolean(request)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-5">

        <View className="bg-white w-full rounded-3xl p-5">

          <View className="flex-row items-center justify-between mb-5">

            <View>

              <Text className="text-xl font-black text-slate-900">
                Update Status
              </Text>

              <Text className="text-xs text-slate-400 mt-1">
                {request?.name}
              </Text>

            </View>

            <Pressable onPress={onClose}>
              <Ionicons
                name="close-circle"
                size={26}
                color="#94a3b8"
              />
            </Pressable>

          </View>

          <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Select Status
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-5">

            {STATUSES.slice(1).map((item) => (

              <TouchableOpacity
                key={item}
                onPress={() => setStatus(item)}
                className="px-3 py-2.5 rounded-xl border"
                style={{
                  backgroundColor:
                    status === item
                      ? `${statusColor(item)}15`
                      : "#fff",

                  borderColor:
                    status === item
                      ? statusColor(item)
                      : "#e2e8f0",
                }}
              >

                <Text
                  className="text-xs font-semibold"
                  style={{
                    color:
                      status === item
                        ? statusColor(item)
                        : "#64748b",
                  }}
                >
                  {item}
                </Text>

              </TouchableOpacity>

            ))}

          </View>

          <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Internal Follow-Up Notes
          </Text>

          <TextInput
            value={adminNotes}
            onChangeText={setAdminNotes}
            placeholder="Add follow-up notes, call logs, resolution details..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 mb-5"
          />

          <View className="flex-row gap-3">

            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 bg-slate-100 rounded-xl py-3.5 items-center"
            >
              <Text className="font-bold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveStatus}
              disabled={saving}
              className="flex-1 bg-orange-500 rounded-xl py-3.5 items-center"
            >

              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">
                  Save Changes
                </Text>
              )}

            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ContactRequestsScreen() {

  const router = useRouter();

  const [requests, setRequests] = useState<ContactRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<ContactRequest | null>(null);

  const [statusRequest, setStatusRequest] =
    useState<ContactRequest | null>(null);

  /* Fetch */
  const fetchRequests = useCallback(
    async (refresh = false) => {

      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {

        const { data } =
          await api.get("/contacts");

        if (data.success === false) {
          throw new Error(
            data.message ||
              "Failed to load contact requests"
          );
        }

        setRequests(data.data || []);

      } catch (error: any) {

        Alert.alert(
          "Unable to load requests",
          error?.response?.data?.message ||
            error?.message ||
            "Please try again."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }
    },
    []
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* Search + Filter */
  const filteredRequests = useMemo(() => {

    const term =
      search.trim().toLowerCase();

    return requests.filter((request) => {

      const matchesSearch =
        !term ||
        [
          request.name,
          request.email,
          request.mobile,
          request.phone,
          request.subject,
          request.message,
          request.admin_notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "All" ||
        (request.status || "New")
          .toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  }, [
    requests,
    search,
    statusFilter,
  ]);

  /* Stats */
  const total = requests.length;

  const newCount = requests.filter(
    (r) => (r.status || "New") === "New"
  ).length;

  const contactedCount = requests.filter(
    (r) => r.status === "Contacted"
  ).length;

  const resolvedCount = requests.filter(
    (r) =>
      r.status === "Resolved" ||
      r.status === "Closed"
  ).length;

  /* Delete */
  const deleteRequest = (
    request: ContactRequest
  ) => {

    Alert.alert(
      "Delete Contact Request",
      `Are you sure you want to delete the inquiry from "${request.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {

            try {

              await api.delete(
                `/contacts/${request.uuid}`
              );

              setSelectedRequest(null);

              Alert.alert(
                "Deleted",
                "Contact request deleted successfully."
              );

              fetchRequests(true);

            } catch (error: any) {

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Failed to delete request."
              );

            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <View className="flex-row items-center px-4 py-4 bg-white border-b border-slate-100">

        <Pressable
          onPress={() => router.back()}
          className="w-[40px] h-[40px] rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#0f172a"
          />
        </Pressable>

        <View className="flex-1">

          <Text className="text-[19px] font-extrabold text-slate-900">
            Contact Requests
          </Text>

          <Text className="text-[10px] text-slate-400 mt-0.5">
            Manage customer inquiries
          </Text>

        </View>

      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              fetchRequests(true)
            }
            tintColor="#f97316"
          />
        }
      >

        {/* =================================================
            STATS
        ================================================= */}

        <View className="flex-row flex-wrap justify-between mb-5">

          <StatCard
            label="Total Inquiries"
            value={total}
            color="#3b82f6"
            icon="mail-outline"
          />

          <StatCard
            label="New Requests"
            value={newCount}
            color="#f59e0b"
            icon="chatbubble-outline"
          />

          <StatCard
            label="Contacted"
            value={contactedCount}
            color="#0ea5e9"
            icon="call-outline"
          />

          <StatCard
            label="Resolved / Closed"
            value={resolvedCount}
            color="#10b981"
            icon="checkmark-circle-outline"
          />

        </View>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 mb-3">

          <Ionicons
            name="search"
            size={17}
            color="#94a3b8"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, email, phone..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 text-sm text-slate-800"
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
            >
              <Ionicons
                name="close-circle"
                size={17}
                color="#cbd5e1"
              />
            </TouchableOpacity>
          )}

        </View>

        {/* =================================================
            FILTER
        ================================================= */}

        <TouchableOpacity
          onPress={() =>
            setFilterOpen(true)
          }
          className="h-11 bg-white border border-slate-200 rounded-xl px-4 flex-row items-center justify-between mb-6"
        >

          <View className="flex-row items-center">

            <Ionicons
              name="filter-outline"
              size={16}
              color="#64748b"
            />

            <Text className="ml-2 text-xs font-semibold text-slate-700">
              {statusFilter === "All"
                ? "All Status"
                : statusFilter}
            </Text>

          </View>

          <Ionicons
            name="chevron-down"
            size={15}
            color="#64748b"
          />

        </TouchableOpacity>

        {/* =================================================
            FILTER MODAL
        ================================================= */}

        <Modal
          visible={filterOpen}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setFilterOpen(false)
          }
        >

          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() =>
              setFilterOpen(false)
            }
          >

            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) =>
                e.stopPropagation()
              }
            >

              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Filter by Status
              </Text>

              {STATUSES.map((item) => (

                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setStatusFilter(item);
                    setFilterOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >

                  <View className="flex-row items-center">

                    {item !== "All" && (
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-3"
                        style={{
                          backgroundColor:
                            statusColor(item),
                        }}
                      />
                    )}

                    <Text
                      className={`text-sm ${
                        statusFilter === item
                          ? "font-bold text-orange-500"
                          : "text-slate-700"
                      }`}
                    >
                      {item}
                    </Text>

                  </View>

                </TouchableOpacity>

              ))}

            </Pressable>

          </Pressable>

        </Modal>

        {/* =================================================
            LIST TITLE
        ================================================= */}

        <Text className="text-slate-800 font-bold text-sm mb-4">
          Contact Requests ({filteredRequests.length})
        </Text>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <View className="items-center py-12">

            <ActivityIndicator
              size="large"
              color="#f97316"
            />

            <Text className="text-slate-400 text-sm mt-3">
              Loading contact requests...
            </Text>

          </View>

        ) : filteredRequests.length === 0 ? (

          /* EMPTY */
          <View className="items-center py-12">

            <View className="w-16 h-16 rounded-2xl bg-orange-50 items-center justify-center mb-3">

              <Ionicons
                name="mail-outline"
                size={28}
                color="#f97316"
              />

            </View>

            <Text className="text-slate-800 font-bold">
              No contact requests found
            </Text>

            <Text className="text-slate-400 text-xs mt-1 text-center">
              Try changing your search or filter.
            </Text>

          </View>

        ) : (

          /* =================================================
             REQUEST CARDS
          ================================================= */

          filteredRequests.map(
            (request, index) => (

              <TouchableOpacity
                key={
                  request.uuid ||
                  request.id ||
                  index
                }
                activeOpacity={0.9}
                onPress={() =>
                  setSelectedRequest(request)
                }
                className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
              >

                {/* Header */}
                <View className="flex-row items-start justify-between">

                  <View className="flex-row items-center flex-1">

                    <View className="w-11 h-11 rounded-2xl bg-orange-50 items-center justify-center">

                      <Text className="text-orange-600 font-black text-sm">
                        {getInitials(
                          request.name
                        )}
                      </Text>

                    </View>

                    <View className="ml-3 flex-1">

                      <View className="flex-row items-center">

                        <Text
                          className="text-slate-900 font-bold text-[15px]"
                          numberOfLines={1}
                        >
                          {request.name ||
                            "Unknown"}
                        </Text>

                        <View className="ml-2">
                          <StatusPill
                            status={
                              request.status ||
                              "New"
                            }
                          />
                        </View>

                      </View>

                      <Text
                        className="text-orange-500 text-[10px] font-bold mt-1"
                        numberOfLines={1}
                      >
                        {request.subject ||
                          "General Inquiry"}
                      </Text>

                    </View>

                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#cbd5e1"
                  />

                </View>

                {/* Email */}
                {request.email && (
                  <View className="flex-row items-center mt-4">

                    <Ionicons
                      name="mail-outline"
                      size={13}
                      color="#94a3b8"
                    />

                    <Text
                      className="text-slate-500 text-xs ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {request.email}
                    </Text>

                  </View>
                )}

                {/* Phone */}
                {(request.mobile ||
                  request.phone) && (
                  <View className="flex-row items-center mt-2">

                    <Ionicons
                      name="call-outline"
                      size={13}
                      color="#94a3b8"
                    />

                    <Text className="text-slate-500 text-xs ml-2">
                      {request.mobile ||
                        request.phone}
                    </Text>

                  </View>
                )}

                {/* Message */}
                {request.message && (
                  <Text
                    className="text-slate-500 text-xs mt-3 leading-5"
                    numberOfLines={2}
                  >
                    {request.message}
                  </Text>
                )}

                {/* Footer */}
                <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100">

                  <View className="flex-row items-center">

                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#94a3b8"
                    />

                    <Text className="text-slate-400 text-[10px] ml-1">
                      {formatDate(
                        request.created_at
                      )}
                    </Text>

                  </View>

                  <Text className="text-orange-500 text-[10px] font-bold">
                    View Details
                  </Text>

                </View>

              </TouchableOpacity>

            )
          )

        )}

      </ScrollView>

      {/* =================================================
          VIEW MODAL
      ================================================= */}

      <ViewContactModal
        request={selectedRequest}
        onClose={() =>
          setSelectedRequest(null)
        }
        onUpdate={() => {

          setStatusRequest(
            selectedRequest
          );

          setSelectedRequest(null);

        }}
        onDelete={() => {

          if (selectedRequest) {
            deleteRequest(
              selectedRequest
            );
          }

        }}
      />

      {/* =================================================
          STATUS MODAL
      ================================================= */}

      <StatusModal
        request={statusRequest}
        onClose={() =>
          setStatusRequest(null)
        }
        onSuccess={() =>
          fetchRequests(true)
        }
      />

    </SafeAreaView>
  );
}