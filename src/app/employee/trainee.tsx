import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BottomHome } from "../../components/BottomHome";
import { TopHeader } from "../../components/TopHeader";

export default function TraineeScreen() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 10 });

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
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.append("search", search);
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (employeeId) params.append("employee_id", String(employeeId));

      const { data } = await api.get(`/trainee-intern?${params}`);
      
      if (!data.success) throw new Error(data.message || "Failed");
      
      setMembers(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 1, page, limit });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load members"
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, statusFilter, employeeId]);

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

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const initials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
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
      icon: "people-outline" as const,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Trainees",
      value: String(statsData.trainees),
      icon: "book-outline" as const,
      color: "#f97316",
      bg: "#fff7ed",
    },
    {
      label: "Interns",
      value: String(statsData.interns),
      icon: "briefcase-outline" as const,
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <TopHeader
        title="Trainee & Internship"
        subtitle="Your assigned trainees"
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>
          Assigned Trainees & Interns
        </Text>
        <Text style={{ marginTop: 6, fontSize: 15, color: "#64748b" }}>
          View only the trainee and intern records assigned to you.
        </Text>

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
            flexWrap: "wrap",
            gap: 10,
            marginTop: 20,
          }}
        >
          {stats.map((s) => (
            <View
              key={s.label}
              style={{
                width: "31%",
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                padding: 14,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: s.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginTop: 10,
                }}
              >
                {s.value}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={{
            marginTop: 24,
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
                    borderRadius: 18,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    padding: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
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
                          fontWeight: "800",
                          color:
                            type.toLowerCase() === "intern"
                              ? "#7c3aed"
                              : "#ea580c",
                        }}
                      >
                        {initials(name)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {name}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}
                      >
                        {member.person_id || "No ID"} • {type}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor:
                          status.toLowerCase() === "active"
                            ? "#ecfdf5"
                            : "#f8fafc",
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
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

                  <View style={{ marginTop: 12, gap: 6 }}>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>
                      Department: {member.department || "-"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>
                      Designation: {member.designation || "-"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>
                      Manager: {member.reporting_manager || "-"}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>
                      Joining:{" "}
                      {formatDate(member.joining_date || member.created_at)}
                    </Text>
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
              Records assigned to your employee ID ({employeeId ? String(employeeId).slice(0, 8) + '...' : 'none'}) will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomHome />
    </View>
  );
}
