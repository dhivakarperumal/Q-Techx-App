import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

type ServiceRequest = {
  uuid?: string;
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  service_title?: string;
  message?: string;
  status?: string;
  created_at?: string;
};

const STATUSES = [
  "All",
  "New",
  "Contacted",
  "Converted",
  "Closed",
];

const SERVICES = [
  "All",
  "Website",
  "Mobile App",
  "Web App",
  "Software",
  "Other",
];

const statusColor = (status?: string) => {
  switch (status) {
    case "New":
      return "#f59e0b";

    case "Contacted":
      return "#0ea5e9";

    case "Converted":
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
      <Text
        className="text-[9px] font-black"
        style={{ color }}
      >
        {status || "New"}
      </Text>
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
      className="mb-3 w-[48%] overflow-hidden rounded-2xl bg-white border border-orange-100"
      style={{
        shadowColor: "#f97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={["#ffffff", "#fff7ed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-4"
      >
        <View className="flex-row items-center mb-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-black">
            <Ionicons
              name={icon as any}
              size={20}
              color={color}
            />
          </View>

          <View className="ml-2 flex-1">
            <Text
              className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500"
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        </View>

        <Text className="text-[22px] font-black text-black">
          {value}
        </Text>
      </LinearGradient>
    </View>
  );
}

function ViewRequestModal({
  request,
  onClose,
  onUpdate,
  onDelete,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  if (!request) return null;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%] overflow-hidden">

          {/* Header */}
          <View className="bg-black px-5 pt-5 pb-5">
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
                    {request.service_title || "Service Request"}
                  </Text>
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

            <View className="mt-3">
              <StatusPill status={request.status} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 35,
            }}
          >

            {/* Contact */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Contact Information
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">

              {request.email && (
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color="#94a3b8"
                  />

                  <Text className="ml-3 text-sm text-slate-700 flex-1">
                    {request.email}
                  </Text>
                </View>
              )}

              {request.phone && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="call-outline"
                    size={17}
                    color="#94a3b8"
                  />

                  <Text className="ml-3 text-sm text-slate-700">
                    {request.phone}
                  </Text>
                </View>
              )}

            </View>

            {/* Service */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Service Details
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">

              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color="#f97316"
                />

                <View className="ml-3">
                  <Text className="text-[10px] text-slate-400 uppercase">
                    Service
                  </Text>

                  <Text className="text-sm font-bold text-slate-800 mt-0.5">
                    {request.service_title || "-"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Ionicons
                  name="flag-outline"
                  size={17}
                  color="#f97316"
                />

                <View className="ml-3">
                  <Text className="text-[10px] text-slate-400 uppercase">
                    Status
                  </Text>

                  <Text className="text-sm font-bold text-slate-800 mt-0.5">
                    {request.status || "New"}
                  </Text>
                </View>
              </View>

            </View>

            {/* Message */}
            {request.message && (
              <>
                <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Message
                </Text>

                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                  <Text className="text-sm text-slate-600 leading-6">
                    {request.message}
                  </Text>
                </View>
              </>
            )}

            {/* Date */}
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Request Information
            </Text>

            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4">

              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color="#94a3b8"
                />

                <View className="ml-3">
                  <Text className="text-[10px] text-slate-400 uppercase">
                    Submitted
                  </Text>

                  <Text className="text-sm font-bold text-slate-800 mt-0.5">
                    {formatDate(request.created_at)}
                  </Text>
                </View>
              </View>

            </View>

            {/* Buttons */}
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

function StatusModal({
  request,
  onClose,
  onSuccess,
}: {
  request: ServiceRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(
    request?.status || "New"
  );
  const [saving, setSaving] = useState(false);

  const saveStatus = async () => {
    if (!request?.uuid) return;

    setSaving(true);

    try {
      const { data } = await api.patch(
        `/service-requests/${request.uuid}/status`,
        { status }
      );

      if (!data.success) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      Alert.alert(
        "Success",
        "Service request status updated successfully."
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

          <View className="gap-2">

            {STATUSES.slice(1).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setStatus(item)}
                className="rounded-xl p-3 border"
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
                <View className="flex-row items-center">

                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                      backgroundColor: statusColor(item),
                    }}
                  />

                  <Text
                    className="font-semibold text-sm"
                    style={{
                      color:
                        status === item
                          ? statusColor(item)
                          : "#475569",
                    }}
                  >
                    {item}
                  </Text>

                </View>
              </TouchableOpacity>
            ))}

          </View>

          <View className="flex-row gap-3 mt-5">

            <TouchableOpacity
              onPress={onClose}
              disabled={saving}
              className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
            >
              <Text className="font-bold text-slate-600">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveStatus}
              disabled={saving}
              className="flex-1 bg-orange-500 rounded-xl py-3 items-center"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white">
                  Save
                </Text>
              )}
            </TouchableOpacity>

          </View>

        </View>
      </View>
    </Modal>
  );
}

export default function AdminServiceRequestsScreen() {
  const router = useRouter();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");

  const [statusDropdownOpen, setStatusDropdownOpen] =
    useState(false);

  const [serviceDropdownOpen, setServiceDropdownOpen] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequest | null>(null);

  const [statusRequest, setStatusRequest] =
    useState<ServiceRequest | null>(null);

  const fetchRequests = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const { data } = await api.get("/service-requests");

        if (data.success === false) {
          throw new Error(
            data.message || "Failed to load requests"
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

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim();

    return requests.filter((request) => {

      const matchesSearch =
        !query ||
        request.name
          ?.toLowerCase()
          .includes(query) ||
        request.email
          ?.toLowerCase()
          .includes(query) ||
        request.phone
          ?.toLowerCase()
          .includes(query) ||
        request.service_title
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        (request.status || "New") === statusFilter;

      const matchesService =
        serviceFilter === "All" ||
        request.service_title === serviceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesService
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    serviceFilter,
  ]);

  const total = requests.length;

  const newCount = requests.filter(
    (r) => (r.status || "New") === "New"
  ).length;

  const contactedCount = requests.filter(
    (r) => r.status === "Contacted"
  ).length;

  const convertedCount = requests.filter(
    (r) => r.status === "Converted"
  ).length;

  const deleteRequest = (request: ServiceRequest) => {
    Alert.alert(
      "Delete Request",
      `Are you sure you want to delete the request from "${request.name}"?`,
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
                `/service-requests/${request.uuid}`
              );

              setSelectedRequest(null);

              Alert.alert(
                "Deleted",
                "Service request deleted successfully."
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

      {/* Header */}
      <View
        className="flex-row items-center bg-white border-b border-slate-100"
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-[38px] h-[38px] rounded-xl bg-slate-100 items-center justify-center mr-3"
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#0f172a"
          />
        </Pressable>

        <View>
          <Text className="text-[18px] font-extrabold text-slate-900">
            Service Requests
          </Text>

          <Text className="text-[10px] text-slate-400 mt-0.5">
            Manage customer requests
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
            onRefresh={() => fetchRequests(true)}
            tintColor="#f97316"
          />
        }
      >

        {/* Stats */}
        <View className="flex-row flex-wrap justify-between mb-6">

          <StatCard
            label="Total Requests"
            value={total}
            color="#3b82f6"
            icon="document-text-outline"
          />

          <StatCard
            label="New"
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
            label="Converted"
            value={convertedCount}
            color="#10b981"
            icon="checkmark-circle-outline"
          />

        </View>

        {/* Search */}
        <View className="bg-white border border-slate-200 rounded-2xl flex-row items-center px-4 py-2 shadow-sm mb-3">

          <Ionicons
            name="search"
            size={17}
            color="#94a3b8"
          />

          <TextInput
            placeholder="Search by name, email, phone..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            className="flex-1 ml-2 text-sm font-medium text-slate-800"
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

        {/* Filters */}
        <View className="flex-row gap-3 mb-6">

          {/* Status */}
          <View className="flex-1">

            <TouchableOpacity
              onPress={() => {
                setStatusDropdownOpen(true);
                setServiceDropdownOpen(false);
              }}
              className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
            >
              <Text className="text-xs font-medium text-slate-700">
                {statusFilter}
              </Text>

              <Ionicons
                name="chevron-down"
                size={15}
                color="#64748b"
              />
            </TouchableOpacity>

          </View>

          {/* Service */}
          <View className="flex-1">

            <TouchableOpacity
              onPress={() => {
                setServiceDropdownOpen(true);
                setStatusDropdownOpen(false);
              }}
              className="h-11 bg-white border border-slate-200 rounded-xl px-3 flex-row items-center justify-between"
            >
              <Text
                className="text-xs font-medium text-slate-700"
                numberOfLines={1}
              >
                {serviceFilter}
              </Text>

              <Ionicons
                name="chevron-down"
                size={15}
                color="#64748b"
              />
            </TouchableOpacity>

          </View>

        </View>

        {/* Status Dropdown */}
        <Modal
          visible={statusDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setStatusDropdownOpen(false)
          }
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setStatusDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >

              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Status
              </Text>

              {STATUSES.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setStatusFilter(item);
                    setStatusDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${
                      statusFilter === item
                        ? "font-bold text-orange-500"
                        : "text-slate-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

            </Pressable>
          </Pressable>
        </Modal>

        {/* Service Dropdown */}
        <Modal
          visible={serviceDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setServiceDropdownOpen(false)
          }
        >
          <Pressable
            className="flex-1 bg-black/40 justify-center px-8"
            onPress={() => setServiceDropdownOpen(false)}
          >
            <Pressable
              className="bg-white rounded-2xl overflow-hidden"
              onPress={(e) => e.stopPropagation()}
            >

              <Text className="px-5 py-4 text-base font-bold text-slate-900 border-b border-slate-100">
                Select Service
              </Text>

              {SERVICES.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setServiceFilter(item);
                    setServiceDropdownOpen(false);
                  }}
                  className="px-5 py-4 border-b border-slate-100"
                >
                  <Text
                    className={`text-sm ${
                      serviceFilter === item
                        ? "font-bold text-orange-500"
                        : "text-slate-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

            </Pressable>
          </Pressable>
        </Modal>

        {/* List title */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-800 font-bold text-sm">
            Service Requests ({filteredRequests.length})
          </Text>
        </View>

        {/* Loading */}
        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator
              size="large"
              color="#f97316"
            />

            <Text className="text-slate-400 text-sm mt-3">
              Loading requests...
            </Text>
          </View>
        ) : filteredRequests.length === 0 ? (

          <View className="items-center py-12">

            <View className="w-16 h-16 rounded-2xl bg-orange-50 items-center justify-center mb-3">
              <Ionicons
                name="document-text-outline"
                size={28}
                color="#f97316"
              />
            </View>

            <Text className="text-slate-800 font-bold">
              No requests found
            </Text>

            <Text className="text-slate-400 text-xs mt-1">
              Try changing your search or filters.
            </Text>

          </View>

        ) : (

          filteredRequests.map((request, index) => (

            <TouchableOpacity
              key={request.uuid || request.id || index}
              activeOpacity={0.9}
              onPress={() =>
                setSelectedRequest(request)
              }
              className="bg-white rounded-[24px] p-4 mb-4 border border-slate-100 shadow-sm"
            >

              {/* Name + status */}
              <View className="flex-row items-start justify-between">

                <View className="flex-row items-center flex-1">

                  <View className="w-11 h-11 rounded-2xl bg-orange-50 items-center justify-center">
                    <Text className="text-orange-600 font-black text-sm">
                      {getInitials(request.name)}
                    </Text>
                  </View>

                  <View className="ml-3 flex-1">

                    <View className="flex-row items-center">

                      <Text
                        className="text-slate-900 font-bold text-[15px] flex-shrink"
                        numberOfLines={1}
                      >
                        {request.name || "Unknown"}
                      </Text>

                      <View className="ml-2">
                        <StatusPill
                          status={request.status || "New"}
                        />
                      </View>

                    </View>

                    {request.service_title && (
                      <Text
                        className="text-orange-500 text-[10px] font-bold mt-1"
                        numberOfLines={1}
                      >
                        {request.service_title}
                      </Text>
                    )}

                  </View>

                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#cbd5e1"
                />

              </View>

              {/* Contact */}
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

              {request.phone && (
                <View className="flex-row items-center mt-2">

                  <Ionicons
                    name="call-outline"
                    size={13}
                    color="#94a3b8"
                  />

                  <Text className="text-slate-500 text-xs ml-2">
                    {request.phone}
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
                    {formatDate(request.created_at)}
                  </Text>

                </View>

                <Text className="text-orange-500 text-[10px] font-bold">
                  View Details
                </Text>

              </View>

            </TouchableOpacity>

          ))
        )}

      </ScrollView>

      {/* View Details */}
      <ViewRequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdate={() => {
          setStatusRequest(selectedRequest);
          setSelectedRequest(null);
        }}
        onDelete={() => {
          if (selectedRequest) {
            deleteRequest(selectedRequest);
          }
        }}
      />

      {/* Update Status */}
      <StatusModal
        request={statusRequest}
        onClose={() => setStatusRequest(null)}
        onSuccess={() => fetchRequests(true)}
      />

    </SafeAreaView>
  );
}