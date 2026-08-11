import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import api from "../api";

type Client = Record<string, any>;
type Props = {
  visible: boolean;
  client?: Client | null;
  onClose: () => void;
  onSaved: () => void;
};
const CLIENT_STATUSES = [
  "Lead",
  "Prospect",
  "Active",
  "Inactive",
  "Converted",
  "Closed",
];
const SERVICE_TYPES = ["Website", "Mobile App", "Web App", "Software", "Other"];
const FOLLOW_UP_STATUSES = [
  "Pending",
  "Follow Up",
  "Completed",
  "Rescheduled",
  "Cancelled",
];
const emptyForm = {
  company_name: "",
  client_name: "",
  email: "",
  phone_number: "",
  contact_person: "",
  client_status: "Lead",
  service_type: "",
  custom_service_type: "",
  business_name: "",
  business_type: "",
  requirement: "",
  notes_summary: "",
  follow_up_date: "",
  follow_up_time: "",
  next_follow_up_date: "",
  discussion_summary: "",
  follow_up_status: "Pending",
  reminder: false,
};
const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-sm text-slate-900";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TextInput
        className={inputClass}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  onPress,
  placeholder = "YYYY-MM-DD",
  icon = "calendar-outline",
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
      >
        <Text
          className={`text-sm ${value ? "text-slate-900" : "text-slate-400"}`}
        >
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={18} color="#f97316" />
      </Pressable>
    </View>
  );
}

function ChoiceRow({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((item) => (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            className={`rounded-full border px-3 py-2 ${value === item ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white"}`}
          >
            <Text
              className={`text-xs font-bold ${value === item ? "text-orange-600" : "text-slate-500"}`}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ClientFormModal({
  visible,
  client,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<any>(emptyForm);
  const [files, setFiles] = useState<
    { uri: string; name: string; type: string; documentType: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [datePickerField, setDatePickerField] = useState<
    "follow_up_date" | "next_follow_up_date" | null
  >(null);
  const [timePickerField, setTimePickerField] = useState<
    "follow_up_time" | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const set = (key: string, value: unknown) =>
    setForm((current: any) => ({ ...current, [key]: value }));

  const openDatePicker = (field: "follow_up_date" | "next_follow_up_date") => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setTimePickerField("follow_up_time");
    setShowTimePicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setShowDatePicker(false);
      setDatePickerField(null);
      return;
    }

    const chosenDate = selectedDate ?? new Date();
    const isoDate = `${chosenDate.getFullYear()}-${String(chosenDate.getMonth() + 1).padStart(2, "0")}-${String(chosenDate.getDate()).padStart(2, "0")}`;

    if (datePickerField === "follow_up_date") {
      set("follow_up_date", isoDate);
    }

    if (datePickerField === "next_follow_up_date") {
      set("next_follow_up_date", isoDate);
    }

    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    const shouldClose = event?.type === "set" || event?.type === "dismissed";

    if (event?.type === "dismissed") {
      setShowTimePicker(false);
      setTimePickerField(null);
      return;
    }

    if (event?.type === "set" && selectedTime) {
      const chosenTime = selectedTime ?? new Date();
      const timeValue = `${String(chosenTime.getHours()).padStart(2, "0")}:${String(chosenTime.getMinutes()).padStart(2, "0")}`;
      set("follow_up_time", timeValue);
    }

    if (shouldClose) {
      setShowTimePicker(false);
      setTimePickerField(null);
    }
  };

  const parseDateValue = (value: string) => {
    if (!value) return new Date();

    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const parseTimeValue = (value: string) => {
    if (!value) return new Date();

    const [hours = "0", minutes = "0"] = value.split(":");
    const parsed = new Date();
    parsed.setHours(Number(hours), Number(minutes), 0, 0);
    return parsed;
  };

  useEffect(() => {
    if (!visible) return;
    setFiles([]);
    setForm(
      client
        ? {
            ...emptyForm,
            ...client,
            custom_service_type: SERVICE_TYPES.includes(client.service_type)
              ? ""
              : client.service_type || "",
            follow_up_date: client.follow_up_date?.slice(0, 10) || "",
            next_follow_up_date: client.next_follow_up_date?.slice(0, 10) || "",
            reminder: !!client.reminder,
          }
        : emptyForm,
    );
  }, [visible, client]);

  const chooseFile = async (documentType: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const file = result.assets[0];
      setFiles((current) => [
        ...current.filter((item) => item.documentType !== documentType),
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
          documentType,
        },
      ]);
    }
  };

  const submit = async () => {
    if (!form.client_name.trim())
      return Alert.alert("Required field", "Client name is required.");
    if (!form.service_type.trim())
      return Alert.alert("Required field", "Service type is required.");
    if (form.service_type === "Other" && !form.custom_service_type.trim())
      return Alert.alert(
        "Required field",
        "Please enter a custom service type.",
      );
    setSaving(true);
    try {
      const payload = {
        ...form,
        service_type:
          form.service_type === "Other"
            ? form.custom_service_type.trim()
            : form.service_type,
      };
      delete payload.custom_service_type;
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") payload[key] = null;
      });
      const response = client
        ? await api.put(`/clients/${client.uuid}`, payload)
        : await api.post("/clients", payload);
      const clientUuid = client?.uuid || response.data?.data?.uuid;
      for (const file of files) {
        const body = new FormData();
        body.append("document", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as unknown as Blob);
        body.append("document_type", file.documentType);
        body.append("document_name", file.name.replace(/\.[^.]+$/, ""));
        await api.post(`/clients/${clientUuid}/documents`, body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      Alert.alert(
        "Success",
        client
          ? "Client updated successfully."
          : "Client created successfully.",
      );
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to save client",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/25">
        <View className="max-h-[92%] rounded-t-[32px] border border-slate-200 bg-[#f8fafc] shadow-2xl">
          <View className="items-center pt-3">
            <View className="h-1.5 w-14 rounded-full bg-slate-300" />
          </View>
          <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 pb-4 pt-4 rounded-t-[32px]">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-black text-slate-900">
                {client ? "Edit Client" : "Add Client"}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Complete the client profile and follow-up details.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"
            >
              <Ionicons name="close" size={20} color="#475569" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 3,
              paddingTop: 16,
              paddingBottom: 36,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
              <Text className="mb-4 text-base font-black text-slate-900">
                Client Details
              </Text>
              <Field
                label="Client Name *"
                value={form.client_name}
                onChange={(value) => set("client_name", value)}
                placeholder="e.g. Arjun Mehta"
              />
              <Field
                label="Company Name"
                value={form.company_name}
                onChange={(value) => set("company_name", value)}
                placeholder="Enter company name"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(value) => set("email", value)}
                placeholder="name@example.com"
              />
              <Field
                label="Phone Number"
                value={form.phone_number}
                onChange={(value) => set("phone_number", value)}
                placeholder="Enter phone number"
              />
              <Field
                label="Contact Person"
                value={form.contact_person}
                onChange={(value) => set("contact_person", value)}
                placeholder="Enter contact person"
              />
              <ChoiceRow
                label="Client Status"
                values={CLIENT_STATUSES}
                value={form.client_status}
                onChange={(value) => set("client_status", value)}
              />
              <ChoiceRow
                label="Service Type *"
                values={SERVICE_TYPES}
                value={form.service_type}
                onChange={(value) => set("service_type", value)}
              />
              {form.service_type === "Other" && (
                <Field
                  label="Custom Service Type *"
                  value={form.custom_service_type}
                  onChange={(value) => set("custom_service_type", value)}
                />
              )}
              <Field
                label="Business Name"
                value={form.business_name}
                onChange={(value) => set("business_name", value)}
                placeholder="Enter business name"
              />
              <Field
                label="Business Type"
                value={form.business_type}
                onChange={(value) => set("business_type", value)}
                placeholder="e.g. Retail, IT, Consulting"
              />
              <Field
                label="Requirement"
                value={form.requirement}
                onChange={(value) => set("requirement", value)}
                multiline
                placeholder="Describe the requirement"
              />
              <Field
                label="Notes / Summary"
                value={form.notes_summary}
                onChange={(value) => set("notes_summary", value)}
                multiline
                placeholder="Add notes or summary"
              />
            </View>
            <View className="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
              <Text className="mb-4 text-base font-black text-slate-900">
                Follow-up Scheduling
              </Text>
              <DateField
                label="Follow-up Date"
                value={form.follow_up_date}
                onPress={() => openDatePicker("follow_up_date")}
                placeholder="YYYY-MM-DD"
              />
              <DateField
                label="Follow-up Time"
                value={form.follow_up_time}
                onPress={openTimePicker}
                placeholder="HH:MM"
                icon="time-outline"
              />
              <DateField
                label="Next Follow-up Date"
                value={form.next_follow_up_date}
                onPress={() => openDatePicker("next_follow_up_date")}
                placeholder="YYYY-MM-DD"
              />
              <Field
                label="Next Follow-up Time (HH:MM)"
                value={form.next_follow_up_time}
                onChange={(value) => set("next_follow_up_time", value)}
                placeholder="HH:MM"
              />
              <ChoiceRow
                label="Follow-up Status"
                values={FOLLOW_UP_STATUSES}
                value={form.follow_up_status}
                onChange={(value) => set("follow_up_status", value)}
              />
              {showDatePicker && datePickerField ? (
                <View className="mb-3">
                  <DateTimePicker
                    value={parseDateValue(form[datePickerField] || "")}
                    mode="date"
                    display="default"
                    onChange={handleDatePickerChange}
                  />
                </View>
              ) : null}
              {showTimePicker && timePickerField ? (
                <View className="mb-3">
                  <DateTimePicker
                    value={parseTimeValue(form[timePickerField] || "")}
                    mode="time"
                    display="default"
                    is24Hour={true}
                    onChange={handleTimePickerChange}
                  />
                </View>
              ) : null}
              <Pressable
                onPress={() => set("reminder", !form.reminder)}
                className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <View>
                  <Text className="font-bold text-slate-700">Reminder</Text>
                  <Text className="mt-1 text-xs text-slate-400">
                    Get notified for this follow-up
                  </Text>
                </View>
                <Ionicons
                  name={form.reminder ? "toggle" : "toggle-outline"}
                  size={32}
                  color={form.reminder ? "#f97316" : "#94a3b8"}
                />
              </Pressable>
              <Field
                label="Discussion Summary"
                value={form.discussion_summary}
                onChange={(value) => set("discussion_summary", value)}
                multiline
                placeholder="Add discussion notes"
              />
            </View>
            <View className="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
              <Text className="mb-1 text-base font-black text-slate-900">
                Attach Documents
              </Text>
              <Text className="mb-4 text-xs text-slate-500">
                PDF, DOC, DOCX, XLS, XLSX up to 10 MB.
              </Text>
              {["Requirement Document", "Project Quotation"].map(
                (documentType) => {
                  const file = files.find(
                    (item) => item.documentType === documentType,
                  );
                  return (
                    <Pressable
                      key={documentType}
                      onPress={() => chooseFile(documentType)}
                      className="mb-3 flex-row items-center rounded-2xl border border-dashed border-slate-300 p-4"
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={23}
                        color="#f97316"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-bold text-slate-700">
                          {documentType}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-400">
                          {file?.name || "Tap to select a file"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94a3b8"
                      />
                    </Pressable>
                  );
                },
              )}
            </View>
            <Pressable
              disabled={saving}
              onPress={submit}
              className="mt-6 items-center rounded-2xl bg-orange-500 py-4 shadow-lg"
            >
              <Text className="font-black text-white">
                {saving
                  ? "Saving..."
                  : client
                    ? "Update Client"
                    : "Save Client"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
