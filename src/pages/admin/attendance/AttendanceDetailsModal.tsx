import { Calendar, Clock, Loader2, MapPin, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../../api';
import ModalPortal from '../../../Componets/CommonComponents/ModalPortal';

export default function AttendanceDetailsModal({ member, month, year, isOpen, onClose }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && member) {
      loadAttendanceDetails();
    }
  }, [isOpen, member, month, year]);

  const loadAttendanceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/trainee-intern-attendance?trainee_intern_id=${member.trainee_intern_id}&month=${month}&year=${year}&limit=200`
      );
      setAttendanceRecords(response?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (record) => {
    const officeStart = new Date(`2024-01-01 09:30:00`);
    const officeEnd = new Date(`2024-01-01 18:00:00`);
    const workingHoursMs = 8.5 * 60 * 60 * 1000; // 8.5 hours

    let metrics = {
      working_hours: '0h 0m',
      late_entry: false,
      early_exit: false,
      overtime: '0h 0m',
    };

    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`2024-01-01 ${record.check_in_time}`);
      const checkOut = new Date(`2024-01-01 ${record.check_out_time}`);
      const diffMs = checkOut - checkIn;
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      metrics.working_hours = `${hours}h ${minutes}m`;
      metrics.late_entry = checkIn > officeStart;
      metrics.early_exit = checkOut < officeEnd;

      if (diffMs > workingHoursMs) {
        const overtimeMs = diffMs - workingHoursMs;
        const overtimeHours = Math.floor(overtimeMs / (60 * 60 * 1000));
        const overtimeMinutes = Math.floor((overtimeMs % (60 * 60 * 1000)) / (60 * 1000));
        metrics.overtime = `${overtimeHours}h ${overtimeMinutes}m`;
      }
    }

    return metrics;
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{member.trainee_name || member.full_name}</h2>
              <p className="mt-1 text-sm text-white/60">ID: {member.person_id} • {member.type}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Month/Year Info */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar size={16} />
              <span>
                {new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-3 animate-spin" /> Loading records...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-red-200">
              {error}
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
              No attendance records found for this period.
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record, idx) => {
                const metrics = calculateMetrics(record);
                const isPresent = record.attendance_status?.toLowerCase() === 'present';

                return (
                  <div
                    key={record.id || idx}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-orange-400/40 hover:bg-white/8"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              isPresent
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {record.attendance_status || 'Absent'}
                          </div>
                          <span className="text-sm text-white/40">
                            {new Date(record.attendance_date || record.date).toLocaleDateString('en', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {record.check_in_time && record.check_out_time && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock size={14} className="text-orange-400" />
                              <div>
                                <p className="text-white/40">Check In</p>
                                <p className="text-white font-semibold">{record.check_in_time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock size={14} className="text-orange-400" />
                              <div>
                                <p className="text-white/40">Check Out</p>
                                <p className="text-white font-semibold">{record.check_out_time}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {record.location && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                            <span className="text-white/60">{record.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="space-y-2 text-right">
                        <div>
                          <p className="text-xs text-white/40">Working Hours</p>
                          <p className="font-semibold text-white">{metrics.working_hours}</p>
                        </div>
                        {metrics.late_entry && (
                          <div className="text-xs text-orange-400 font-medium">⚠ Late Entry</div>
                        )}
                        {metrics.early_exit && (
                          <div className="text-xs text-orange-400 font-medium">⚠ Early Exit</div>
                        )}
                        {metrics.overtime !== '0h 0m' && (
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp size={12} className="text-emerald-400" />
                            <div>
                              <p className="text-xs text-white/40">Overtime</p>
                              <p className="text-xs font-semibold text-emerald-400">{metrics.overtime}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-full bg-orange-500 px-6 py-2 font-medium text-white transition hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
