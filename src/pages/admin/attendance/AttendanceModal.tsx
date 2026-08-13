import { Loader2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../../../api';
import ModalPortal from '../../../Componets/CommonComponents/ModalPortal';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#1a1d24',
    border: `1px solid ${state.isFocused ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: 'none',
    outline: 'none',
    minHeight: '42px',
    borderRadius: '12px',
    cursor: 'pointer',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 12px',
    fontSize: '14px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#fff',
    fontSize: '14px',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'rgba(255,255,255,.35)',
    fontSize: '14px',
  }),
  input: (provided) => ({
    ...provided,
    color: '#fff',
    fontSize: '14px',
    margin: 0,
    padding: 0,
  }),
  menu: (provided) => ({
    ...provided,
    background: '#1a1d24',
    borderRadius: '12px',
    overflow: 'hidden',
  }),
  menuList: (provided) => ({
    ...provided,
    padding: 0,
    fontSize: '14px',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '14px',
    padding: '8px 14px',
    backgroundColor: state.isSelected
      ? '#f97316'
      : state.isFocused
        ? 'rgba(249,115,22,.15)'
        : '#1a1d24',
    color: '#fff',
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#888',
    padding: '6px',
  }),
};

export default function AttendanceModal({ members, isOpen, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    trainee_intern_id: null,
    attendance_date: new Date().toISOString().split('T')[0],
    attendance_status: 'present',
    check_in_time: '09:30',
    check_out_time: '18:00',
    location: '',
  });

  const memberOptions = useMemo(() => {
    return (members || []).map((m) => ({
      value: m.uuid,
      label: `${m.full_name} (${m.person_id}) - ${m.type}`,
    }));
  }, [members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (option) => {
    setFormData((prev) => ({ ...prev, trainee_intern_id: option?.value || null }));
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => ({ ...prev, attendance_status: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trainee_intern_id) {
      setError('Please select a trainee/intern');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/trainee-intern-attendance', {
        trainee_intern_id: formData.trainee_intern_id,
        attendance_date: formData.attendance_date,
        attendance_status: formData.attendance_status,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        location: formData.location,
      });
      setFormData({
        trainee_intern_id: null,
        attendance_date: new Date().toISOString().split('T')[0],
        attendance_status: 'present',
        check_in_time: '09:30',
        check_out_time: '18:00',
        location: '',
      });
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Add Attendance</h2>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Trainee/Intern Select */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Trainee / Intern</label>
              <Select
                value={
                  formData.trainee_intern_id
                    ? memberOptions.find((o) => o.value === formData.trainee_intern_id)
                    : null
                }
                onChange={handleSelectChange}
                options={memberOptions}
                styles={customSelectStyles}
                isSearchable
                placeholder="Select a trainee or intern..."
                className="text-white"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Date</label>
              <input
                type="date"
                name="attendance_date"
                value={formData.attendance_date}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-[#1a1d24] px-4 py-2 text-white outline-none transition focus:border-orange-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <div className="flex gap-3">
                {['present', 'absent', 'leave'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`flex-1 rounded-xl px-4 py-2 font-medium transition ${
                      formData.attendance_status === status
                        ? 'bg-orange-500 text-white'
                        : 'border border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Check In Time */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Check In Time</label>
              <input
                type="time"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-[#1a1d24] px-4 py-2 text-white outline-none transition focus:border-orange-500"
              />
            </div>

            {/* Check Out Time */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Check Out Time</label>
              <input
                type="time"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-[#1a1d24] px-4 py-2 text-white outline-none transition focus:border-orange-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Office, Remote"
                className="w-full rounded-xl border border-white/10 bg-[#1a1d24] px-4 py-2 text-white placeholder:text-white/30 outline-none transition focus:border-orange-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Saving...' : 'Add Attendance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
