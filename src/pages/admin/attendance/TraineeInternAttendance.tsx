import { CalendarDays, Eye, GraduationCap, LayoutGrid, List, Loader2, PlusCircle, Search, UserCheck, UserRoundCheck, UserRoundX, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../../../api';
import AttendanceDetailsModal from './AttendanceDetailsModal';
import AttendanceModal from './AttendanceModal';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#1a1d24',
    border: `1px solid ${state.isFocused ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: 'none',
    outline: 'none',
    minHeight: '42px',
    height: '42px',
    borderRadius: '12px',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 12px',
    fontSize: '13px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#fff',
    fontSize: '13px',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'rgba(255,255,255,.35)',
    fontSize: '13px',
  }),
  input: (provided) => ({
    ...provided,
    color: '#fff',
    fontSize: '13px',
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
    fontSize: '13px',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13px',
    padding: '8px 14px',
    backgroundColor: state.isSelected
      ? '#f97316'
      : state.isFocused
        ? 'rgba(249,115,22,.15)'
        : '#1a1d24',
    color: '#fff',
    cursor: 'pointer',
    ':active': {
      backgroundColor: '#ea580c',
    },
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

const today = new Date();
const defaultMonth = today.getMonth() + 1;
const defaultYear = today.getFullYear();

export default function TraineeInternAttendancePage() {
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, summaryRes] = await Promise.all([
        api.get('/trainee-intern?limit=200'),
        api.get(`/trainee-intern-attendance/summary?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      setMembers(membersRes?.data?.data || []);
      setSummary(summaryRes?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load trainee/intern attendance');
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(() => {
    const baseCards = summary.length
      ? summary
      : (members || []).map((member) => ({ 
          trainee_intern_id: member.uuid, 
          trainee_name: member.full_name, 
          person_id: member.person_id, 
          type: member.type,
          status: member.status,
          present_days: 0, 
          absent_days: 0 
        }));
    
    const term = searchTerm.trim().toLowerCase();
    const filtered = baseCards.filter((person) => {
      const matchesSearch = !term || `${person.trainee_name || person.full_name || ''} ${person.person_id || ''} ${person.type || ''}`.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' || (person.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesType = typeFilter === 'All' || (person.type || '').toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesType;
    });

    return filtered;
  }, [summary, members, searchTerm, statusFilter, typeFilter]);

  const aggregateStats = useMemo(() => {
    const totals = {
      traineePresent: 0,
      traineeAbsent: 0,
      internPresent: 0,
      internAbsent: 0,
    };

    summary.forEach((person) => {
      const type = (person.type || '').toLowerCase();
      const present = Number(person.present_days || 0);
      const absent = Number(person.absent_days || 0);

      if (type === 'trainee') {
        totals.traineePresent += present;
        totals.traineeAbsent += absent;
      } else if (type === 'intern') {
        totals.internPresent += present;
        totals.internAbsent += absent;
      }
    });

    return totals;
  }, [summary]);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
              <GraduationCap size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Dashboard</h1>
              <p className="text-white/40 text-xs mt-0.5">
                {loading ? 'Loading…' : `${summary.length} attendance records`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm min-w-[160px]">
              <CalendarDays size={16} className="text-orange-400" />
              <Select
                value={{ value: selectedMonth, label: new Date(2024, selectedMonth - 1).toLocaleString('en', { month: 'long' }) }}
                onChange={(option) => setSelectedMonth(Number(option.value))}
                options={Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Date(2024, index).toLocaleString('en', { month: 'long' }) }))}
                styles={{ ...customSelectStyles, control: (base, state) => ({ ...customSelectStyles.control(base, state), minHeight: '38px', backgroundColor: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer' }) }}
                isSearchable={false}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm min-w-[120px]">
              <CalendarDays size={16} className="text-orange-400" />
              <Select
                value={{ value: selectedYear, label: selectedYear.toString() }}
                onChange={(option) => setSelectedYear(Number(option.value))}
                options={[selectedYear - 1, selectedYear, selectedYear + 1].map(year => ({ value: year, label: year.toString() }))}
                styles={{ ...customSelectStyles, control: (base, state) => ({ ...customSelectStyles.control(base, state), minHeight: '38px', backgroundColor: 'transparent', border: 'none', boxShadow: 'none', cursor: 'pointer' }) }}
                isSearchable={false}
                className="flex-1"
              />
            </div>
            <button onClick={() => setIsAttendanceModalOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 font-medium text-white transition hover:bg-orange-600">
              <PlusCircle size={16} /> Add Attendance
            </button>
            <div className="flex items-center rounded-full border border-white/10 bg-white/10 p-1">
              <button onClick={() => setViewMode('table')} className={`rounded-full p-2 transition ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`} title="Table view"><List size={16} /></button>
              <button onClick={() => setViewMode('card')} className={`rounded-full p-2 transition ${viewMode === 'card' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`} title="Card view"><LayoutGrid size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1b1a1d] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <UserCheck size={22} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-white">{aggregateStats.traineePresent}</p>
            <p className="mt-1 text-sm text-white/50">Trainee Present</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1b1a1d] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
            <UserX size={22} className="text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-white">{aggregateStats.traineeAbsent}</p>
            <p className="mt-1 text-sm text-white/50">Trainee Absent</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1b1a1d] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <UserCheck size={22} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-white">{aggregateStats.internPresent}</p>
            <p className="mt-1 text-sm text-white/50">Intern Present</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1b1a1d] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
            <UserX size={22} className="text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-white">{aggregateStats.internAbsent}</p>
            <p className="mt-1 text-sm text-white/50">Intern Absent</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-[#0f172a]/70 p-10">
          <Loader2 className="mr-3 animate-spin" /> Loading attendance details...
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Filters Section */}
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3">
                {/* Status Filter */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Active', 'Completed', 'On Leave', 'Inactive'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          statusFilter === status
                            ? 'bg-orange-500 text-white'
                            : 'border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Trainee', 'Intern'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          typeFilter === type
                            ? 'bg-orange-500 text-white'
                            : 'border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-[300px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID..."
                  className="w-full rounded-xl border border-white/10 bg-[#1a1d24] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-orange-500/60"
                />
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f172a]/70">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Person ID</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Present</th>
                    <th className="px-4 py-3 text-left">Absent</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {cards.length === 0 ? (
                    <tr><td colSpan="8" className="px-4 py-8 text-center text-white/60">No trainee or intern records found.</td></tr>
                  ) : cards.map((person, idx) => (
                    <tr key={person.trainee_intern_id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/60">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{person.trainee_name || person.full_name}</td>
                      <td className="px-4 py-3 text-white/60">{person.type || 'Trainee / Intern'}</td>
                      <td className="px-4 py-3 text-white/60">{person.person_id || 'TI'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          (person.status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}>
                          {person.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-400">{person.present_days || 0}</td>
                      <td className="px-4 py-3 text-rose-400">{person.absent_days || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedMember(person);
                            setIsDetailsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 px-3 py-2 text-orange-300 transition hover:bg-orange-400/10"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-white/10 bg-[#0f172a]/70 p-10 text-center text-white/60">No trainee or intern records found.</div>
              ) : cards.map((person) => (
                <div key={person.trainee_intern_id} className="rounded-3xl border border-white/10 bg-[#0f172a]/70 p-5 shadow-lg shadow-black/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/40">{person.person_id || 'TI'}</p>
                      <h3 className="mt-1 text-lg font-semibold">{person.trainee_name || person.full_name}</h3>
                      <p className="text-sm text-white/60">{person.type || 'Trainee / Intern'}</p>
                    </div>
                    <div className={`rounded-full p-2 ${Number(person.present_days || 0) > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/60 text-slate-300'}`}>
                      {Number(person.present_days || 0) > 0 ? <UserRoundCheck size={18} /> : <UserRoundX size={18} />}
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-white/40">Present Days</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-400">{person.present_days || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-white/40">Absent Days</p>
                      <p className="mt-1 text-xl font-semibold text-rose-400">{person.absent_days || 0}</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                      (person.status || '').toLowerCase() === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-orange-500/15 text-orange-400'
                    }`}>
                      {person.status || 'Active'}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-white/60 font-medium">ID: {person.trainee_intern_id}</span>
                    <button
                      onClick={() => {
                        setSelectedMember(person);
                        setIsDetailsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 px-3 py-2 text-orange-300 transition hover:bg-orange-400/10"
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Attendance Modal */}
      {isAttendanceModalOpen && (
        <AttendanceModal
          members={members}
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          onSaved={() => {
            setIsAttendanceModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* Attendance Details Modal */}
      {isDetailsModalOpen && selectedMember && (
        <AttendanceDetailsModal
          member={selectedMember}
          month={selectedMonth}
          year={selectedYear}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}
