import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";

const attendanceDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const currentTime = () => {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

type TraineeTask = { uuid: string; task_name?: string; description?: string };
type TaskAssignment = {
  uuid?: string;
  trainee_name?: string;
  task_name?: string;
  assigned_date?: string;
  due_date?: string;
  status?: string;
  progress?: number;
  daily_report?: string;
};

function TaskMasterModal({
  visible,
  employeeId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  employeeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [documentFile, setDocumentFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setDocumentFile(result.assets[0]);
      }
    } catch {
      Alert.alert("Document error", "Unable to pick the document right now.");
    }
  };

  const closeModal = () => {
    setTaskName("");
    setDescription("");
    setDocumentFile(null);
    onClose();
  };

  const save = async () => {
    if (!taskName.trim())
      return Alert.alert("Required field", "Please enter a task name.");

    setSaving(true);
    try {
      const body = new FormData();
      body.append("task_name", taskName.trim());
      body.append("name", taskName.trim());
      body.append("description", description.trim());
      body.append("task_description", description.trim());
      if (employeeId) body.append("employee_id", employeeId);

      if (documentFile) {
        body.append("document", {
          uri: documentFile.uri,
          name: documentFile.name || "task-document",
          type: documentFile.mimeType || "application/octet-stream",
        } as unknown as Blob);
      }

      await api.post("/trainee-tasks", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Saved", "Task created successfully.");
      setTaskName("");
      setDescription("");
      setDocumentFile(null);
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to create task",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(15, 23, 42, 0.22)",
          paddingBottom: 0,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(148, 163, 184, 0.18)",
            paddingBottom: 18,
            overflow: "hidden"
          }}
        >
          <View
            style={{
              backgroundColor: "#111827",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              paddingHorizontal: 20,
              paddingVertical: 18,
              backgroundColor: "#000",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#f97316" }}>
              Add New Task
            </Text>
            <Pressable
              onPress={closeModal}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#1e293b",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#f97316" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 20,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Task Name *
              </Text>
              <TextInput
                value={taskName}
                onChangeText={setTaskName}
                placeholder="Enter task name"
                placeholderTextColor="#9ca3af"
                style={{
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#dbe3ee",
                  color: "#0f172a",
                  paddingHorizontal: 16,
                  fontSize: 16,
                }}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={5}
                style={{
                  minHeight: 110,
                  maxHeight: 170,
                  borderRadius: 14,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#dbe3ee",
                  color: "#0f172a",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  textAlignVertical: "top",
                  fontSize: 16,
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Upload Document
              </Text>
              <Pressable
                onPress={pickDocument}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#d1d5db",
                  backgroundColor: "#f8fafc",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: documentFile ? "#0f172a" : "#9ca3af",
                    fontSize: 16,
                  }}
                >
                  {documentFile
                    ? documentFile.name
                    : "Choose PDF, DOC, image or ZIP"}
                </Text>
                <View
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderRadius: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                  }}
                >
                  <Ionicons
                    name="document-attach-outline"
                    size={18}
                    color="#334155"
                  />
                </View>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Pressable
                onPress={closeModal}
                style={{
                  minWidth: 120,
                  paddingVertical: 15,
                  paddingHorizontal: 24,
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#dbe3ee",
                }}
              >
                <Text
                  style={{
                    color: "#0f172a",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={save}
                disabled={saving}
                style={{
                  minWidth: 150,
                  paddingVertical: 15,
                  paddingHorizontal: 24,
                  borderRadius: 14,
                  backgroundColor: saving ? "#f59e0b" : "#f97316",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {saving ? "Saving..." : "Save Task"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TaskAssignmentModal({
  visible,
  employeeId,
  members,
  tasks,
  onClose,
  onSaved,
}: {
  visible: boolean;
  employeeId: string | null;
  members: any[];
  tasks: TraineeTask[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taskUuid, setTaskUuid] = useState("");
  const [memberUuid, setMemberUuid] = useState("");
  const [assignedDate, setAssignedDate] = useState(attendanceDate());
  const [assignedTime, setAssignedTime] = useState(currentTime());
  const [dueDate, setDueDate] = useState(attendanceDate());
  const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
  const [showAssignedTimePicker, setShowAssignedTimePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const closeModal = () => {
    setTaskUuid("");
    setMemberUuid("");
    setAssignedDate(attendanceDate());
    setAssignedTime(currentTime());
    setDueDate(attendanceDate());
    setShowAssignedDatePicker(false);
    setShowDueDatePicker(false);
    onClose();
  };

  const formatDateValue = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatTimeValue = (date: Date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const save = async () => {
    if (!taskUuid || !memberUuid || !assignedDate)
      return Alert.alert(
        "Required fields",
        "Select a task, trainee/intern, and assigned date.",
      );
    setSaving(true);
    try {
      const body = new FormData();
      body.append("trainee_task_uuid", taskUuid);
      body.append("trainee_intern_uuid", memberUuid);
      body.append("assigned_date", assignedDate);
      body.append("assigned_time", assignedTime);
      body.append("due_date", dueDate);
      if (employeeId) body.append("employee_id", employeeId);
      await api.post("/trainee-task-assignments", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Assigned", "Task assigned successfully.");
      onSaved();
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Unable to assign task",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(15, 23, 42, 0.22)",
          paddingBottom: 0,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(148, 163, 184, 0.18)",
            paddingHorizontal: 0,
            paddingBottom: 22,
            maxHeight: "90%",
            overflow: "hidden"
          }}
        >
          <View
            style={{
              backgroundColor: "#111827",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              paddingHorizontal: 20,
              paddingVertical: 18,
              backgroundColor: "#000",
            }}
          >
            <View>
              <Text
                style={{
                  color: "#f97316",
                  fontSize: 24,
                  fontWeight: "800",
                }}
              >
                Assign Task
              </Text>
              <Text style={{ fontSize: 14, color: "#cbd5e1", marginTop: 4 }}>
                Assign work to trainees
              </Text>
            </View>
            <Pressable
              onPress={closeModal}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#1e293b",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#f97316" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 20,
            }}
          >
            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Select Task *
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {tasks.map((task) => {
                  const selected = taskUuid === task.uuid;
                  return (
                    <Pressable
                      key={task.uuid}
                      onPress={() => setTaskUuid(task.uuid)}
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        backgroundColor: selected ? "#fff7ed" : "#fff",
                        borderColor: selected ? "#f97316" : "#dbe3ee",
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? "#ea580c" : "#334155",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {task.task_name || "Untitled task"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Select Trainee / Intern *
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {members.map((member) => {
                  const selected =
                    memberUuid === String(member.uuid || member.id);
                  return (
                    <Pressable
                      key={String(member.id || member.uuid)}
                      onPress={() =>
                        setMemberUuid(String(member.uuid || member.id))
                      }
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderWidth: 1,
                        backgroundColor: selected ? "#ecfdf5" : "#fff",
                        borderColor: selected ? "#22c55e" : "#dbe3ee",
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? "#15803d" : "#334155",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {member.full_name || member.name || "Unnamed member"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  Assigned Date *
                </Text>
                <Pressable
                  onPress={() => setShowAssignedDatePicker(true)}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#dbe3ee",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={{
                      color: assignedDate ? "#0f172a" : "#9ca3af",
                      fontSize: 15,
                    }}
                  >
                    {assignedDate || "YYYY-MM-DD"}
                  </Text>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "#fff7ed",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#f97316"
                    />
                  </View>
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  Time
                </Text>
                <Pressable
                  onPress={() => setShowAssignedTimePicker(true)}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#dbe3ee",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={{
                      color: assignedTime ? "#0f172a" : "#9ca3af",
                      fontSize: 15,
                    }}
                  >
                    {assignedTime || "HH:MM"}
                  </Text>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: "#fff7ed",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color="#f97316" />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#334155",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Due Date
              </Text>
              <Pressable
                onPress={() => setShowDueDatePicker(true)}
                style={{
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#dbe3ee",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                }}
              >
                <Text
                  style={{
                    color: dueDate ? "#0f172a" : "#9ca3af",
                    fontSize: 15,
                  }}
                >
                  {dueDate || "YYYY-MM-DD"}
                </Text>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#fff7ed",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color="#f97316" />
                </View>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                paddingHorizontal: 0,
              }}
            >
              <Pressable
                onPress={closeModal}
                style={{
                  minWidth: 120,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#dbe3ee",
                }}
              >
                <Text
                  style={{
                    color: "#0f172a",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={save}
                style={{
                  minWidth: 150,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 14,
                  backgroundColor: saving ? "#f59e0b" : "#f97316",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {saving ? "Assigning..." : "Assign Task"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {showAssignedDatePicker ? (
            <DateTimePicker
              value={new Date(assignedDate || attendanceDate())}
              mode="date"
              display="default"
              accentColor="#f97316"
              onChange={(_, selectedDate) => {
                setShowAssignedDatePicker(false);
                if (selectedDate)
                  setAssignedDate(formatDateValue(selectedDate));
              }}
            />
          ) : null}

          {showDueDatePicker ? (
            <DateTimePicker
              value={dueDate ? new Date(dueDate) : new Date()}
              mode="date"
              display="default"
              accentColor="#f97316"
              onChange={(_, selectedDate) => {
                setShowDueDatePicker(false);
                if (selectedDate) setDueDate(formatDateValue(selectedDate));
              }}
            />
          ) : null}

          {showAssignedTimePicker ? (
            <DateTimePicker
              value={(() => {
                try {
                  const now = new Date();
                  if (assignedTime) {
                    const parts = assignedTime.split(":").map(Number);
                    if (
                      parts.length >= 2 &&
                      !Number.isNaN(parts[0]) &&
                      !Number.isNaN(parts[1])
                    ) {
                      now.setHours(parts[0], parts[1], 0, 0);
                    }
                  }
                  return now;
                } catch {
                  return new Date();
                }
              })()}
              mode="time"
              display="default"
              is24Hour={true}
              accentColor="#f97316"
              onChange={(_, selectedTime) => {
                setShowAssignedTimePicker(false);
                if (selectedTime)
                  setAssignedTime(formatTimeValue(selectedTime));
              }}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export default function TraineeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page] = useState(1);
  const [limit] = useState(10);

  const [tasks, setTasks] = useState<TraineeTask[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [taskVisible, setTaskVisible] = useState(false);
  const [taskAssignmentVisible, setTaskAssignmentVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  const [statsData, setStatsData] = useState({
    total: 0,
    active: 0,
    trainees: 0,
    interns: 0,
  });

  const getEmployeeReference = (authUser: any) => {
    if (!authUser) return null;
    const values = [
      authUser.employee_id,
      authUser.employeeId,
      authUser.user_id,
      authUser.userId,
      authUser.uuid,
      authUser.id,
      authUser._id,
      authUser.employee?.employee_id,
      authUser.employee?.id,
      authUser.employee?.uuid,
    ]
      .filter(Boolean)
      .map(String);
    return values.find((value) => value.length > 20) || values[0] || null;
  };

  const employeeId = getEmployeeReference(user);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (employeeId) params.append("employee_id", String(employeeId));

      const { data } = await api.get(`/trainee-intern?${params}`);

      if (!data.success) throw new Error(data.message || "Failed");

      setMembers(data.data || []);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Failed to load members",
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, employeeId]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "500", page: "1" });
      if (employeeId) params.append("employee_id", String(employeeId));

      const { data } = await api.get(`/trainee-intern?${params}`);
      if (!data.success) return;

      const all = data.data || [];
      setStatsData({
        total: data.pagination?.total ?? all.length,
        active: all.filter((c: any) => c.status === "Active").length,
        trainees: all.filter((c: any) => c.type === "Trainee").length,
        interns: all.filter((c: any) => c.type === "Intern").length,
      });
    } catch {
      /* silent */
    }
  }, [employeeId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const loadTasks = useCallback(async () => {
    try {
      // Fetch tasks, assignments, and all trainees for this employee to do strict local filtering
      const [tasksRes, assignmentsRes, membersRes] = await Promise.all([
        api.get("/trainee-tasks"),
        api.get("/trainee-task-assignments"),
        api.get(`/trainee-intern?limit=500&employee_id=${employeeId || ""}`),
      ]);

      const myTrainees = membersRes.data?.data || [];
      const myTraineeIds = new Set(
        myTrainees.map((m: any) => String(m.uuid || m.id)),
      );

      const taskData = tasksRes.data?.data ?? tasksRes.data;
      const allTasks = Array.isArray(taskData)
        ? taskData
        : taskData?.tasks || [];
      // Strictly filter tasks created by this employee
      const filteredTasks = employeeId
        ? allTasks.filter(
            (t: any) =>
              String(t.employee_id) === String(employeeId) ||
              String(t.created_by) === String(employeeId),
          )
        : allTasks;
      setTasks(filteredTasks);

      const assignData = assignmentsRes.data?.data ?? assignmentsRes.data;
      const allAssignments = Array.isArray(assignData)
        ? assignData
        : assignData?.assignments || [];
      // Strictly filter assignments for trainees that belong to this employee
      const filteredAssignments = employeeId
        ? allAssignments.filter(
            (a: any) =>
              String(a.employee_id) === String(employeeId) ||
              String(a.assigned_by) === String(employeeId),
          )
        : allAssignments;
      setTaskAssignments(filteredAssignments);
    } catch (err) {
      // silent
    }
  }, [employeeId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const initials = (name: string) => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stats = [
    {
      label: "Assigned",
      value: String(statsData.total),
      sub: "Total",
      icon: "people",
      subColor: "text-orange-500",
    },
    {
      label: "Trainees",
      value: String(statsData.trainees),
      sub: "Active",
      icon: "book",
      subColor: "text-blue-500",
    },
    {
      label: "Interns",
      value: String(statsData.interns),
      sub: "Active",
      icon: "briefcase",
      subColor: "text-emerald-500",
    },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#f8fafc",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
          Trainee & Internship
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
      

        {error ? (
          <View
            style={{
              marginTop: 18,
              backgroundColor: "#fff7ed",
              borderWidth: 1,
              borderColor: "#fed7aa",
              borderRadius: 16,
              padding: 14,
            }}
          >
            <Text style={{ color: "#9a4d00", fontWeight: "600" }}>{error}</Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {stats.map((s, idx) => (
            <View
              key={idx}
              className="w-[32%] overflow-hidden rounded-2xl bg-white border border-orange-100"
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
                style={{ paddingHorizontal: 8, paddingVertical: 12 }}
              >
                <View className="flex-col items-start mb-2">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-black mb-2">
                    <Ionicons name={s.icon as any} size={16} color="#f97316" />
                  </View>
                  <Text className="text-[10px] font-bold uppercase tracking-[0.5px] text-gray-500" numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
                <View className="flex-col items-start">
                  <Text className="text-xl font-black text-black">
                    {s.value}
                  </Text>
                  <Text className={`text-[9px] font-bold ${s.subColor || "text-gray-400"}`}>
                    {s.sub}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>


        <Text
          style={{
            marginTop: 20,
            marginBottom: 12,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Assigned Records
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#f97316" />
            <Text style={{ marginTop: 10, color: "#64748b" }}>
              Loading assigned trainees...
            </Text>
          </View>
        ) : members.length ? (
          <View style={{ gap: 12 }}>
            {members.map((member, index) => {
              const name = member.full_name || member.name || "Unnamed";
              const type = String(member.type || "Trainee");
              const status = String(member.status || "Active");

              return (
                <View
                  key={`${member.id || member.uuid || index}`}
                  style={{
                    borderRadius: 20,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#f1f5f9",
                    padding: 18,
                    shadowColor: "#94a3b8",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        backgroundColor:
                          type.toLowerCase() === "intern"
                            ? "#f5f3ff"
                            : "#fff7ed",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color:
                            type.toLowerCase() === "intern"
                              ? "#7c3aed"
                              : "#ea580c",
                        }}
                      >
                        {initials(name)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {name}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                      >
                        {member.person_id || "No ID"} • {type}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor:
                          status.toLowerCase() === "active"
                            ? "#d1fae5"
                            : "#f1f5f9",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color:
                            status.toLowerCase() === "active"
                              ? "#059669"
                              : "#475569",
                        }}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Department</Text>
                      <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700" }}>{member.department || "-"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Designation</Text>
                      <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700" }}>{member.designation || "-"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Manager</Text>
                      <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700" }}>{member.reporting_manager || "-"}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>Joining Date</Text>
                      <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700" }}>{formatDate(member.joining_date || member.created_at)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              marginTop: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              backgroundColor: "#fff",
              padding: 28,
              alignItems: "center",
            }}
          >
            <Ionicons name="school-outline" size={36} color="#cbd5e1" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 15,
                fontWeight: "700",
                color: "#334155",
              }}
            >
              No assigned trainees or interns found
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Records assigned to your employee ID (
              {employeeId ? String(employeeId).slice(0, 8) + "..." : "none"})
              will appear here.
            </Text>
          </View>
        )}

        <Text
          style={{
            marginTop: 32,
            marginBottom: 12,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Active Task Assignments
        </Text>

        {taskAssignments.length ? (
          <View style={{ gap: 12 }}>
            {taskAssignments.map((assignment, index) => (
              <View
                key={assignment.uuid || index}
                style={{
                  borderRadius: 20,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  padding: 18,
                  shadowColor: "#94a3b8",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, flexDirection: "row" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff7ed", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Ionicons name="document-text" size={22} color="#f97316" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {assignment.task_name || "Untitled task"}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: "#64748b", marginTop: 2, fontWeight: "600" }}
                      >
                        Assigned to:{" "}
                        <Text style={{ color: "#334155", fontWeight: "700" }}>{assignment.trainee_name || "Trainee / Intern"}</Text>
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#fff7ed",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: "#ea580c",
                      }}
                    >
                      {assignment.status || "Pending"}
                    </Text>
                  </View>
                </View>
                
                <View style={{ height: 1, backgroundColor: "#f1f5f9", marginVertical: 14 }} />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: "#64748b", marginLeft: 6, fontWeight: "600" }}>
                      {assignment.assigned_date?.slice?.(0, 10) || "-"} {assignment.assigned_time || ""}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Ionicons name="pie-chart" size={14} color="#f97316" style={{ marginRight: 6 }} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#ea580c",
                      }}
                    >
                      {assignment.progress || 0}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              marginTop: 4,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderStyle: "dashed",
              backgroundColor: "#fff",
              padding: 28,
              alignItems: "center",
            }}
          >
            <Ionicons name="list-outline" size={36} color="#cbd5e1" />
            <Text
              style={{
                marginTop: 12,
                fontSize: 15,
                fontWeight: "700",
                color: "#334155",
              }}
            >
              No active task assignments
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Tasks you assign to your trainees will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
      <TaskMasterModal
        visible={taskVisible}
        employeeId={employeeId}
        onClose={() => setTaskVisible(false)}
        onSaved={loadTasks}
      />
      <TaskAssignmentModal
        visible={taskAssignmentVisible}
        employeeId={employeeId}
        members={members}
        tasks={tasks.filter(
          (t) =>
            !taskAssignments.some(
              (a) =>
                String(a.trainee_task_uuid || a.task_name) ===
                String(t.uuid || t.task_name),
            ),
        )}
        onClose={() => setTaskAssignmentVisible(false)}
        onSaved={loadTasks}
      />

      {/* FAB Menu */}
      <View style={{ position: "absolute", bottom: 24, right: 24, alignItems: "flex-end", zIndex: 100 }}>
        {fabMenuVisible && (
          <View style={{ gap: 14, marginBottom: 16 }}>
            <Pressable 
              onPress={() => { setTaskVisible(true); setFabMenuVisible(false); }} 
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}
            >
              <Text style={{ backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, overflow: "hidden", fontWeight: "700", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, color: "#334155" }}>Add Task</Text>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <Ionicons name="add" size={24} color="#f97316" />
              </View>
            </Pressable>
            <Pressable 
              onPress={() => { setTaskAssignmentVisible(true); setFabMenuVisible(false); }} 
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}
            >
              <Text style={{ backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, overflow: "hidden", fontWeight: "700", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, color: "#334155" }}>Assign Task</Text>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <Ionicons name="person-add" size={20} color="#f97316" />
              </View>
            </Pressable>
          </View>
        )}
        <Pressable 
          onPress={() => setFabMenuVisible(!fabMenuVisible)}
          style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", elevation: 5, shadowColor: "#f97316", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 }}
        >
          <Ionicons name={fabMenuVisible ? "close" : "add"} size={32} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
