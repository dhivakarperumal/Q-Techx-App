import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Modal, Switch, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import api from "../../api"; // Assuming api is at src/api.js
import { FAB } from "../../components/FAB";

dayjs.extend(isSameOrAfter);

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

const getEmployeeFullName = (emp: any) => {
  if (!emp) return '';
  if (typeof emp === 'string') return emp;
  return emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_code || '';
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
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showEmpSelector, setShowEmpSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setIsLoading(true);
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
      setRefreshing(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(c => ({ ...c, [name]: value }));
  };

  const handleToggleParticipant = (empObj: any) => {
    setFormData(c => {
      const parts = c.participants || [];
      const empName = getEmployeeFullName(empObj);
      const exists = parts.some((p: any) => typeof p === 'object' ? p.user_id === empObj.employee_id : p === empName);
      if (exists) {
        return { ...c, participants: parts.filter((p: any) => typeof p === 'object' ? p.user_id !== empObj.employee_id : p !== empName) };
      }
      const newParticipant = {
        user_id: empObj.employee_id,
        name: empName,
        email: empObj.email || '',
        phone: empObj.phone_number || empObj.phone || '',
        role: empObj.role || ''
      };
      return { ...c, participants: [...parts, newParticipant] };
    });
  };

  const handleRemoveParticipant = (p: any) => {
    setFormData(c => ({ 
      ...c, 
      participants: (c.participants || []).filter((x: any) => typeof x === 'object' && typeof p === 'object' ? x.user_id !== p.user_id : x !== p) 
    }));
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
  
  const displayedEvents = selectedDate
    ? events.filter(ev => dayjs(ev.startDate).isSame(selectedDate, 'day'))
    : events.filter(ev => dayjs(ev.startDate).valueOf() >= dayjs().startOf('day').valueOf());

  const sortedEvents = displayedEvents.sort((a, b) => dayjs(`${a.startDate} ${a.startTime || '00:00'}`).valueOf() - dayjs(`${b.startDate} ${b.startTime || '00:00'}`).valueOf());
  const finalEvents = selectedDate ? sortedEvents : sortedEvents.slice(0, 10);

  const groupedEvents = finalEvents.reduce((acc: any, ev) => {
    const dateStr = dayjs(ev.startDate).format('dddd, MMMM D, YYYY');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(ev);
    return acc;
  }, {});

  const monthStart = currentDate.startOf('month');
  const monthEnd = currentDate.endOf('month');
  const startDay = monthStart.day();
  const daysInMonth = monthEnd.date();
  
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#F8740E" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#f97316" />}>
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
                
                const isSelected = selectedDate && selectedDate.isSame(dStr, 'day');
                
                const dayEvents = events.filter(ev => {
                  const s = dayjs(ev.startDate).valueOf(), e = dayjs(ev.endDate).valueOf(), d = dayjs(dStr).startOf('day').valueOf();
                  return d >= s && d <= e;
                });
                
                return (
                  <TouchableOpacity 
                    key={idx} 
                    activeOpacity={0.7}
                    onPress={() => {
                      if (day !== null) {
                        const d = currentDate.date(day);
                        if (selectedDate && selectedDate.isSame(d, 'day')) {
                          setSelectedDate(null); // deselect
                        } else {
                          setSelectedDate(d);
                        }
                      }
                    }}
                    style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 }}
                  >
                    {day !== null && (
                      <View style={{ 
                        width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", 
                        backgroundColor: isToday ? "#f97316" : "transparent",
                        borderWidth: isSelected ? 2 : 0, borderColor: isSelected ? "#F8740E" : "transparent"
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: isToday ? "800" : "500", color: isToday ? "#fff" : isSelected ? "#F8740E" : isSunday ? "#ef4444" : "#334155" }}>
                          {day}
                        </Text>
                        {dayEvents.length > 0 && !isToday && (
                           <View style={{ position: 'absolute', bottom: 2, flexDirection: "row", gap: 2 }}>
                             {dayEvents.slice(0, 3).map((ev, i) => (
                               <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: EVENT_TYPE_COLORS[ev.eventType] || "#3b82f6" }} />
                             ))}
                           </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Dynamic Legend */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 16, gap: 12, paddingHorizontal: 4 }}>
              {Object.keys(EVENT_TYPE_COLORS).map(type => (
                <View key={type} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EVENT_TYPE_COLORS[type] }} />
                  <Text style={{ fontSize: 11, color: "#64748b", fontWeight: "500" }}>{type}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Grouped Upcoming Events */}
          <Text style={{ marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#94a3b8" }}>
            {selectedDate ? `Events on ${selectedDate.format('MMMM D, YYYY')}` : 'Upcoming Events'}
          </Text>
          <View style={{ gap: 20 }}>
            {Object.keys(groupedEvents).length === 0 ? (
              <Text style={{ textAlign: "center", color: "#94a3b8", marginVertical: 20 }}>
                {selectedDate ? "No events scheduled for this day." : "No upcoming events."}
              </Text>
            ) : Object.keys(groupedEvents).map(dateStr => (
              <View key={dateStr}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 10 }}>{dateStr}</Text>
                <View style={{ gap: 10 }}>
                  {groupedEvents[dateStr].map((ev: any) => {
                    const color = ev.color || EVENT_TYPE_COLORS[ev.eventType] || '#3b82f6';
                    return (
                      <TouchableOpacity 
                        key={ev._id || Math.random().toString()} 
                        onPress={() => setSelectedEvent(ev)}
                        style={{ flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: color, borderLeftWidth: 4, borderLeftColor: color, padding: 14 }}

                      >
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>{ev.title}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name="time-outline" size={12} color="#94a3b8" />
                              <Text style={{ fontSize: 12, color: "#64748b" }}>{ev.allDay ? 'All Day' : `${ev.startTime || '--:--'} - ${ev.endTime || '--:--'}`}</Text>
                            </View>
                            {ev.location && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="location-outline" size={12} color="#94a3b8" />
                                <Text style={{ fontSize: 12, color: "#64748b" }} numberOfLines={1}>{ev.location}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: `${color}20` }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: color }}>{ev.eventType}</Text>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Event Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top"]}>
          <View style={{ backgroundColor: "#000", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={{ width: 48, height: 6, backgroundColor: "#334155", borderRadius: 3, alignSelf: "center", marginBottom: 16 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "bold" }}>New Event</Text>
                <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>Add a new calendar event</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ backgroundColor: "#ffedd5", padding: 8, borderRadius: 20 }}>
                <Ionicons name="close" size={20} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Title *</Text>
            <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.title} onChangeText={t => handleFieldChange("title", t)} placeholder="Event Title" />
            
            <CustomSelect label="Event Type *" value={formData.eventType} options={EVENT_TYPES} onSelect={(v: string) => handleFieldChange("eventType", v)} />
            
            {formData.eventType === 'Meeting' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.startDate} onChangeText={t => handleFieldChange("startDate", t)} placeholder="YYYY-MM-DD" />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Meeting Link</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.meetingLink} onChangeText={t => handleFieldChange("meetingLink", t)} placeholder="https://" autoCapitalize="none" />
                
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
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Meeting Purpose</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 60 }} multiline value={formData.meetingPurpose} onChangeText={t => handleFieldChange("meetingPurpose", t)} placeholder="Purpose..." />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Notes</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 60 }} multiline value={formData.notes} onChangeText={t => handleFieldChange("notes", t)} placeholder="Notes..." />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Participants</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {(formData.participants || []).map((p: any, i: number) => {
                    const displayName = typeof p === 'object' ? p.name : p;
                    return (
                      <View key={typeof p === 'object' ? p.user_id : `${p}-${i}`} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(248, 116, 14, 0.15)", borderColor: "rgba(248, 116, 14, 0.3)", borderWidth: 1, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 }}>
                        <Text style={{ color: "#F8740E", fontSize: 12, fontWeight: "500", marginRight: 6 }}>{displayName}</Text>
                        <TouchableOpacity onPress={() => handleRemoveParticipant(p)}>
                          <Ionicons name="close-circle" size={16} color="rgba(248, 116, 14, 0.6)" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  <TouchableOpacity onPress={() => setShowEmpSelector(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(248, 116, 14, 0.15)", borderColor: "rgba(248, 116, 14, 0.4)", borderWidth: 1, borderStyle: "dashed", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 }}>
                    <Ionicons name="add" size={14} color="#F8740E" />
                    <Text style={{ color: "#F8740E", fontSize: 12, fontWeight: "600" }}>Add Employee</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {formData.eventType === 'Holiday' && (
              <>
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
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Reason</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.reason} onChangeText={t => handleFieldChange("reason", t)} placeholder="Holiday reason" />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Description</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 60 }} multiline value={formData.description} onChangeText={t => handleFieldChange("description", t)} placeholder="Description..." />
              </>
            )}

            {formData.eventType === 'Office Event' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.startDate} onChangeText={t => handleFieldChange("startDate", t)} placeholder="YYYY-MM-DD" />
                
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
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Description</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 60 }} multiline value={formData.description} onChangeText={t => handleFieldChange("description", t)} placeholder="Description..." />
              </>
            )}

            {formData.eventType === 'Interview' && (
              <>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Person Name</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.interviewPerson} onChangeText={t => handleFieldChange("interviewPerson", t)} placeholder="Name of interviewee" />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.startDate} onChangeText={t => handleFieldChange("startDate", t)} placeholder="YYYY-MM-DD" />
                
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
              </>
            )}

            {formData.eventType === 'Project Deadline' && (
              <>
                <CustomSelect label="Project" value={formData.project} options={projects.map(p => p.project_name)} onSelect={(v: string) => handleFieldChange("project", v)} />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Date *</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.startDate} onChangeText={t => handleFieldChange("startDate", t)} placeholder="YYYY-MM-DD" />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Deadline Time</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12 }} value={formData.endTime} onChangeText={t => handleFieldChange("endTime", t)} placeholder="HH:MM" />
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Description</Text>
                <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, backgroundColor: "#fff", marginBottom: 12, minHeight: 60 }} multiline value={formData.description} onChangeText={t => handleFieldChange("description", t)} placeholder="Description..." />
              </>
            )}

            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: "#F8740E", padding: 16, borderRadius: 12, alignItems: "center", opacity: isSubmitting ? 0.7 : 1, marginTop: 12 }}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Event</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>

        {/* Employee Selector Modal */}
        <Modal visible={showEmpSelector} animationType="fade" transparent={true} onRequestClose={() => setShowEmpSelector(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "70%", padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>Select Employees</Text>
                <TouchableOpacity onPress={() => setShowEmpSelector(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {employees.map((emp: any, i: number) => {
                  const name = getEmployeeFullName(emp);
                  if (!name) return null;
                  const isSel = (formData.participants || []).some((p: any) => typeof p === 'object' ? p.user_id === emp.employee_id : p === name);
                  return (
                    <TouchableOpacity 
                      key={emp.employee_id || `${name}-${i}`} 
                      onPress={() => handleToggleParticipant(emp)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: isSel ? "#F8740E" : "#cbd5e1", backgroundColor: isSel ? "#F8740E" : "transparent", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        {isSel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text style={{ fontSize: 14, color: isSel ? "#F8740E" : "#334155", fontWeight: isSel ? "600" : "400" }}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* View Event Details Modal */}
      {selectedEvent && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedEvent(null)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            <View style={{ backgroundColor: "#000", paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 }}>
              <View style={{ width: 48, height: 6, backgroundColor: "#334155", borderRadius: 3, alignSelf: "center", marginBottom: 16 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "bold" }}>Event Details</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedEvent(null)} style={{ backgroundColor: "#ffedd5", padding: 8, borderRadius: 20 }}>
                  <Ionicons name="close" size={20} color="#f97316" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={{ marginBottom: 24 }}>
                <View style={{ alignSelf: "flex-start", backgroundColor: `${selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.eventType] || '#3b82f6'}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 }}>
                  <Text style={{ color: selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.eventType] || '#3b82f6', fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{selectedEvent.eventType}</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a", marginBottom: 16 }}>{selectedEvent.title}</Text>
                
                <View style={{ gap: 12, backgroundColor: "#f8fafc", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <Ionicons name="calendar-outline" size={20} color="#64748b" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>Date</Text>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "#334155", marginTop: 2 }}>{dayjs(selectedEvent.startDate).format('dddd, MMMM D, YYYY')}</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
                  
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <Ionicons name="time-outline" size={20} color="#64748b" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>Time</Text>
                      <Text style={{ fontSize: 15, fontWeight: "500", color: "#334155", marginTop: 2 }}>{selectedEvent.allDay ? 'All Day' : `${selectedEvent.startTime || '--:--'} – ${selectedEvent.endTime || '--:--'}`}</Text>
                    </View>
                  </View>

                  {selectedEvent.location && (
                    <>
                      <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <Ionicons name="location-outline" size={20} color="#64748b" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>Location</Text>
                          <Text style={{ fontSize: 15, fontWeight: "500", color: "#334155", marginTop: 2 }}>{selectedEvent.location}</Text>
                        </View>
                      </View>
                    </>
                  )}
                  
                  {selectedEvent.meetingLink && (
                    <>
                      <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                        <Ionicons name="link-outline" size={20} color="#64748b" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase" }}>Meeting Link</Text>
                          <Text style={{ fontSize: 15, fontWeight: "500", color: "#2563eb", marginTop: 2 }}>{selectedEvent.meetingLink}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {(selectedEvent.description || selectedEvent.notes || selectedEvent.meetingPurpose) && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>Information</Text>
                  <View style={{ backgroundColor: "#f8fafc", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", gap: 16 }}>
                    {selectedEvent.description && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Description</Text>
                        <Text style={{ fontSize: 14, color: "#334155" }}>{selectedEvent.description}</Text>
                      </View>
                    )}
                    {selectedEvent.meetingPurpose && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Meeting Purpose</Text>
                        <Text style={{ fontSize: 14, color: "#334155" }}>{selectedEvent.meetingPurpose}</Text>
                      </View>
                    )}
                    {selectedEvent.notes && (
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Notes</Text>
                        <Text style={{ fontSize: 14, color: "#334155" }}>{selectedEvent.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>Participants</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {selectedEvent.participants.map((p: any, i: number) => {
                      const displayName = typeof p === 'object' ? p.name : p;
                      return (
                        <View key={i} style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" }}>
                          <Text style={{ fontSize: 13, fontWeight: "500", color: "#334155" }}>{displayName}</Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
      <FAB onPress={() => { setFormData(defaultForm); setShowModal(true); }} style={{ bottom: 32 }} />
    </SafeAreaView>
  );
}
