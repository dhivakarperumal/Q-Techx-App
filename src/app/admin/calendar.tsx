import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = "August 2025";
const START_DAY = 5;
const TOTAL_DAYS = 31;
const today = 8;

const holidays = [{ date: 15 }, { date: 19 }];

const events = [
  { date: "Aug 5",  title: "Team Stand-up",      time: "10:00 AM", icon: "people-outline" as const,    color: "#2563eb", bg: "#eff6ff" },
  { date: "Aug 12", title: "Performance Review",  time: "2:00 PM",  icon: "analytics-outline" as const, color: "#7c3aed", bg: "#f5f3ff" },
  { date: "Aug 15", title: "Independence Day",    time: "Holiday",  icon: "flag-outline" as const,      color: "#ea580c", bg: "#fff7ed" },
  { date: "Aug 22", title: "Training Session",    time: "11:00 AM", icon: "school-outline" as const,    color: "#16a34a", bg: "#f0fdf4" },
];

export default function AdminCalendarScreen() {
  const router = useRouter();
  const holidayDates = holidays.map((h) => h.date);
  const cells: (number | null)[] = [
    ...Array(START_DAY).fill(null),
    ...Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1),
  ];

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
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Calendar</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Month Calendar */}
        <View style={{
          borderRadius: 22, backgroundColor: "#fff",
          borderWidth: 1, borderColor: "#e2e8f0", padding: 16,
          shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 12 }}>
            {MONTH}
          </Text>

          {/* Day headers */}
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            {DAYS.map((d) => (
              <Text key={d} style={{
                flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700",
                color: d === "Sun" ? "#ef4444" : "#94a3b8",
              }}>
                {d}
              </Text>
            ))}
          </View>

          {/* Date cells */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((day, idx) => {
              const isToday   = day === today;
              const isHoliday = day !== null && holidayDates.includes(day);
              const isSunday  = idx % 7 === 0 && day !== null;
              return (
                <View key={idx} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 }}>
                  {day !== null && (
                    <View style={{
                      width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
                      backgroundColor: isToday ? "#2563eb" : isHoliday ? "#fef3c7" : "transparent",
                    }}>
                      <Text style={{
                        fontSize: 13, fontWeight: isToday ? "800" : "500",
                        color: isToday ? "#fff" : isHoliday ? "#d97706" : isSunday ? "#ef4444" : "#334155",
                      }}>
                        {day}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: "row", marginTop: 12, gap: 16, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb" }} />
              <Text style={{ fontSize: 11, color: "#64748b" }}>Today</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fef3c7" }} />
              <Text style={{ fontSize: 11, color: "#64748b" }}>Holiday</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Events */}
        <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
          Upcoming Events
        </Text>
        <View style={{ gap: 10 }}>
          {events.map((ev) => (
            <View key={ev.title} style={{
              flexDirection: "row", alignItems: "center", borderRadius: 16,
              backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 14,
            }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: ev.bg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={ev.icon} size={22} color={ev.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{ev.title}</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{ev.date} · {ev.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
