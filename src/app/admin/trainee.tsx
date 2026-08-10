import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const programs = [
  { title: "React Native Development",  duration: "3 Months", status: "Ongoing",   statusColor: "#2563eb", statusBg: "#eff6ff", progress: 65,  progressColor: "#2563eb", icon: "phone-portrait-outline" as const, iconBg: "#eff6ff", iconColor: "#2563eb" },
  { title: "UI/UX Design Fundamentals", duration: "6 Weeks",  status: "Completed", statusColor: "#16a34a", statusBg: "#f0fdf4", progress: 100, progressColor: "#16a34a", icon: "color-palette-outline" as const,   iconBg: "#f0fdf4", iconColor: "#16a34a" },
  { title: "Cloud & DevOps Internship", duration: "6 Months", status: "Upcoming",  statusColor: "#ea580c", statusBg: "#fff7ed", progress: 0,   progressColor: "#ea580c", icon: "cloud-outline" as const,           iconBg: "#fff7ed", iconColor: "#ea580c" },
];

const internships = [
  { role: "Frontend Developer Intern", company: "Q Techx", period: "Jan 2025 – Apr 2025",  icon: "briefcase-outline" as const,     color: "#7c3aed", bg: "#f5f3ff" },
  { role: "Mobile App Intern",         company: "Q Techx", period: "May 2025 – Present",    icon: "phone-portrait-outline" as const, color: "#2563eb", bg: "#eff6ff" },
];

const stats = [
  { label: "Programs",    value: "3",   icon: "book-outline" as const,             color: "#2563eb", bg: "#eff6ff" },
  { label: "Completed",   value: "1",   icon: "checkmark-circle-outline" as const, color: "#16a34a", bg: "#f0fdf4" },
  { label: "Certificates",value: "2",   icon: "ribbon-outline" as const,           color: "#7c3aed", bg: "#f5f3ff" },
  { label: "Hours",       value: "120", icon: "time-outline" as const,             color: "#ea580c", bg: "#fff7ed" },
];

export default function AdminTraineeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      {/* ── Back Header ── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: "#fff",
        borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: "#f1f5f9",
            alignItems: "center", justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Trainee & Internship</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Stats Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
          {stats.map((s) => (
            <View key={s.label} style={{
              width: "47.5%", borderRadius: 16, backgroundColor: "#fff",
              borderWidth: 1, borderColor: "#e2e8f0", padding: 14,
            }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: s.bg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a", marginTop: 10 }}>{s.value}</Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Training Programs */}
        <Text style={{ marginTop: 16, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
          Training Programs
        </Text>
        <View style={{ gap: 12 }}>
          {programs.map((prog) => (
            <View key={prog.title} style={{
              borderRadius: 18, backgroundColor: "#fff",
              borderWidth: 1, borderColor: "#e2e8f0", padding: 16, elevation: 1,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: prog.iconBg, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={prog.icon} size={22} color={prog.iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{prog.title}</Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Duration: {prog.duration}</Text>
                </View>
                <View style={{ backgroundColor: prog.statusBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: prog.statusColor }}>{prog.status}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: "#64748b" }}>Progress</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: prog.progressColor }}>{prog.progress}%</Text>
                </View>
                <View style={{ height: 7, borderRadius: 10, backgroundColor: "#f1f5f9" }}>
                  <View style={{ height: 7, borderRadius: 10, backgroundColor: prog.progressColor, width: `${prog.progress}%` }} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Internship Experience */}
        <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
          Internship Experience
        </Text>
        <View style={{ gap: 10 }}>
          {internships.map((intern) => (
            <View key={intern.role} style={{
              flexDirection: "row", alignItems: "center", borderRadius: 16,
              backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 14,
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: intern.bg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={intern.icon} size={22} color={intern.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{intern.role}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{intern.company} · {intern.period}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
