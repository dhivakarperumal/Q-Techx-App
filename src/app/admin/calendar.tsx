import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Modal, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import api from "../../api"; // Assuming api is at src/api.js

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EVENT_TYPES = ['Meeting', 'Holiday', 'Office Event', 'Project Deadline', 'Interview'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES   = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];
const REMINDERS  = ['At time of event', '10 min before', '30 min before', '1 hour before', '1 day before'];

const EVENT_TYPE_COLORS: Record<string, string> = {
  Meeting: '#ef4444', Holiday: '#22c55e', Leave: '#8b5cf6',
  Birthday: '#ec4899', Anniversary: '#d946ef', 'Client Meeting': '#6366f1',
  Training: '#10b981', 'Office Event': '#1e3a8a', 'Project Deadline': '#a855f7',
  Reminder: '#f97316', Interview: '#eab308', Other: '#64748b',
};

const defaultForm = {
  title: '', eventType: 'Meeting', description: '',
  startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD'),
  startTime: '09:00', endTime: '10:00', allDay: false,
  priority: 'Medium', status: 'Scheduled', location: '', meetingLink: '',
  project: '', color: '', reminder: '30 min before',
  participants: [] as any[], departments: [] as string[], teams: [] as string[],
  externalGuests: false, guestEmailAddresses: [] as string[], attendanceRequired: true,
  organizerName: '', organizerDepartment: '', createdBy: '',
  organizerContactNumber: '', organizerEmail: '', attachments: [] as string[], notes: '',
  reason: '', meetingPurpose: '', interviewPerson: '',
};

const CustomSelect = ({ label, value, options, onSelect }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity 
        onPress={() => setOpen(!open)}
        style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between" }}
      >
        <Text style={{ color: value ? "#0f172a" : "#94a3b8" }}>{value || "Select..."}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
      </TouchableOpacity>
      {open && (
        <View style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, backgroundColor: "#fff", marginTop: 4, maxHeight: 150 }}>
          <ScrollView nestedScrollEnabled>
            {options.map((opt: string, i: number) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => { onSelect(opt); setOpen(false); }}
                style={{ padding: 12, borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: "#f1f5f9" }}
              >
                <Text style={{ color: "#0f172a" }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function AdminCalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, empRes, projRes] = await Promise.all([
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: { data: [] } })),
        api.get('/projects?limit=100&page=1').catch(() => ({ data: { data: [] } }))
      ]);
      setEvents(eventsRes.data || []);
      setEmployees(Array.isArray(empRes.data?.data) ? empRes.data.data : []);
      setProjects(Array.isArray(projRes.data?.data) ? projRes.data.data : projRes.data || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load calendar data.");
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = currentDate.startOf('month');
  const monthEnd = currentDate.endOf('month');
  const startDay = monthStart.day();
  const daysInMonth = monthEnd.date();
  
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handleFieldChange = (name: string, value: any) => {
    setFormData(c => ({ ...c, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.eventType || !formData.startDate || !formData.endDate) {
      Alert.alert('Error', 'Please complete required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        color: formData.color || EVENT_TYPE_COLORS[formData.eventType] || '#3b82f6',
        createdDate: dayjs().format('YYYY-MM-DD'),
        updatedDate: dayjs().format('YYYY-MM-DD'),
      };
      
      const res = await api.post('/events', payload);
      setEvents(c => [res.data, ...c]);
      setShowModal(false);
      Alert.alert("Success", "Event created successfully.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const upcomingEvents = events
    .filter(ev => dayjs(ev.startDate).valueOf() >= dayjs().startOf('day').valueOf())
    .sort((a, b) => dayjs(`${a.startDate} ${a.startTime || '00:00'}`).valueOf() - dayjs(`${b.startDate} ${b.startTime || '00:00'}`).valueOf())
    .slice(0, 10);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      {/* ── Back Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>Calendar</Text>
        </View>
        <TouchableOpacity onPress={() => { setFormData(defaultForm); setShowModal(true); }} style={{ backgroundColor: "#F8740E", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Event</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#F8740E" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Month Calendar */}
          <View style={{ borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <TouchableOpacity onPress={() => setCurrentDate(currentDate.subtract(1, 'month'))}>
                <Ionicons name="chevron-back" size={20} color="#64748b" />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                {currentDate.format('MMMM YYYY')}
              </Text>
              <TouchableOpacity onPress={() => setCurrentDate(currentDate.add(1, 'month'))}>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              {DAYS.map((d) => (
                <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: d === "Sun" ? "#ef4444" : "#94a3b8" }}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {cells.map((day, idx) => {
                const isToday = day === dayjs().date() && currentDate.isSame(dayjs(), 'month');
                const isSunday = idx % 7 === 0 && day !== null;
                const dStr = currentDate.date(day || 1).format('YYYY-MM-DD');
                
                const dayEvents = events.filter(ev => {
                  const s = dayjs(ev.startDate).valueOf(), e = dayjs(ev.endDate).valueOf(), d = dayjs(dStr).startOf('day').valueOf();
                  return d >= s && d <= e;
                });
                
                const hasHoliday = dayEvents.some(e => e.eventType === 'Holiday');

                return (
                  <View key={idx} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 }}>
                    {day !== null && (
                      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? "#2563eb" : hasHoliday ? "#fef3c7" : "transparent" }}>
                        <Text style={{ fontSize: 13, fontWeight: isToday ? "800" : "500", color: isToday ? "#fff" : hasHoliday ? "#d97706" : isSunday ? "#ef4444" : "#334155" }}>
                          {day}
                        </Text>
                        {dayEvents.length > 0 && !isToday && !hasHoliday && (
                           <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: EVENT_TYPE_COLORS[dayEvents[0].eventType] || "#F8740E" }} />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            
            <View style={{ flexDirection: "row", marginTop: 12, gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb" }} /><Text style={{ fontSize: 11, color: "#64748b" }}>Today</Text></View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fef3c7" }} /><Text style={{ fontSize: 11, color: "#64748b" }}>Holiday</Text></View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} /><Text style={{ fontSize: 11, color: "#64748b" }}>Meeting</Text></View>
            </View>
          </View>

          <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
            Upcoming Events
          </Text>
          <View style={{ gap: 10 }}>
            {upcomingEvents.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#94a3b8", marginVertical: 20 }}>No upcoming events.</Text>
            ) : upcomingEvents.map((ev) => {
              const color = ev.color || EVENT_TYPE_COLORS[ev.eventType] || '#3b82f6';
              return (
              <View key={ev._id || Math.random().toString()} style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 4, borderLeftColor: color, padding: 14 }}>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{ev.title}</Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{dayjs(ev.startDate).format('MMM D')} · {ev.startTime || '--:--'} - {ev.endTime || '--:--'}</Text>
                  {ev.location && <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>📍 {ev.location}</Text>}
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: `${color}20` }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: color }}>{ev.eventType}</Text>
                </View>
              </View>
            )})}
          </View>
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>New Event</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Title *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.title} onChangeText={t => handleFieldChange("title", t)} placeholder="Event Title" />
            
            <CustomSelect label="Event Type *" value={formData.eventType} options={EVENT_TYPES} onSelect={(v: string) => handleFieldChange("eventType", v)} />
            
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Start Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff" }} value={formData.startDate} onChangeText={t => handleFieldChange("startDate", t)} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>End Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff" }} value={formData.endDate} onChangeText={t => handleFieldChange("endDate", t)} placeholder="YYYY-MM-DD" />
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>All Day Event</Text>
              <Switch value={formData.allDay} onValueChange={v => handleFieldChange("allDay", v)} trackColor={{ true: "#F8740E", false: "#cbd5e1" }} />
            </View>

            {!formData.allDay && (
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Start Time</Text>
                  <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff" }} value={formData.startTime} onChangeText={t => handleFieldChange("startTime", t)} placeholder="HH:MM" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>End Time</Text>
                  <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff" }} value={formData.endTime} onChangeText={t => handleFieldChange("endTime", t)} placeholder="HH:MM" />
                </View>
              </View>
            )}

            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Description</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 80 }} multiline value={formData.description} onChangeText={t => handleFieldChange("description", t)} placeholder="Event description..." />
            
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Location</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.location} onChangeText={t => handleFieldChange("location", t)} placeholder="Office, Room, etc." />

            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Meeting Link</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.meetingLink} onChangeText={t => handleFieldChange("meetingLink", t)} placeholder="https://zoom.us/..." autoCapitalize="none" />
            
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Organizer Name</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.organizerName} onChangeText={t => handleFieldChange("organizerName", t)} placeholder="Name" />
            
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Organizer Contact Number</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.organizerContactNumber} onChangeText={t => handleFieldChange("organizerContactNumber", t)} placeholder="Contact" keyboardType="phone-pad" />
            
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Organizer Email</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.organizerEmail} onChangeText={t => handleFieldChange("organizerEmail", t)} placeholder="Email" keyboardType="email-address" />
            
            <CustomSelect label="Priority" value={formData.priority} options={PRIORITIES} onSelect={(v: string) => handleFieldChange("priority", v)} />
            <CustomSelect label="Status" value={formData.status} options={STATUSES} onSelect={(v: string) => handleFieldChange("status", v)} />
            <CustomSelect label="Reminder" value={formData.reminder} options={REMINDERS} onSelect={(v: string) => handleFieldChange("reminder", v)} />

            <CustomSelect label="Project" value={formData.project} options={projects.map(p => p.project_name)} onSelect={(v: string) => handleFieldChange("project", v)} />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>Allow External Guests</Text>
              <Switch value={formData.externalGuests} onValueChange={v => handleFieldChange("externalGuests", v)} trackColor={{ true: "#F8740E", false: "#cbd5e1" }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: 12, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>Attendance Required</Text>
              <Switch value={formData.attendanceRequired} onValueChange={v => handleFieldChange("attendanceRequired", v)} trackColor={{ true: "#F8740E", false: "#cbd5e1" }} />
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: "#F8740E", padding: 16, borderRadius: 12, alignItems: "center", opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Event</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
