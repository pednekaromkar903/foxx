"use client";

import { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { X, Calendar as CalendarIcon, Plus, Loader2, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const EVENT_TYPES = [
  { value: "GOAL_REVIEW", label: "Goal Review", color: "#3B82F6" },
  { value: "INNOVATION", label: "Innovation", color: "#06B6D4" },
  { value: "MEETING", label: "Meeting", color: "#64748B" },
  { value: "REMINDER", label: "Reminder", color: "#8B5CF6" },
  { value: "DEADLINE", label: "Deadline", color: "#EF4444" },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEvenData, setNewEventData] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    type: "REMINDER",
    description: ""
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/calendar");
      setEvents(res.data.map((e: any) => ({
        ...e, 
        start: new Date(e.date), 
        end: new Date(e.date),
      })));
    } catch (e) { 
      console.error(e); 
      toast.error("Failed to load events");
    } finally { setLoading(false); }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dateTime = new Date(`${newEvenData.date}T${newEvenData.time}`);
      const res = await api.post("/calendar", {
        ...newEvenData,
        date: dateTime.toISOString()
      });
      
      const newEvent = {
        ...res.data,
        start: dateTime,
        end: dateTime
      };
      
      setEvents(prev => [...prev, newEvent]);
      setShowAddModal(false);
      setNewEventData({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        type: "REMINDER",
        description: ""
      });
      toast.success(`✅ Reminder added for ${format(dateTime, "PPP")}`);
    } catch (err) {
      toast.error("Failed to add reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar?id=${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvent(null);
      toast.success("Reminder removed");
    } catch (err) {
      toast.error("Failed to remove reminder");
    }
  };

  const eventStyleGetter = (event: any) => {
    const typeInfo = EVENT_TYPES.find(t => t.value === event.type) || EVENT_TYPES[0];
    
    return {
      style: {
        backgroundColor: typeInfo.color,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        padding: "2px 5px"
      }
    };
  };

  const handleSelectSlot = ({ start }: any) => {
    setNewEventData(prev => ({ ...prev, date: format(start, "yyyy-MM-dd") }));
    setShowAddModal(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Schedule and key milestones</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-primary bg-[#0066FF] hover:bg-blue-700 flex items-center gap-2">
            <Plus size={16} /> Add Reminder
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        {EVENT_TYPES.map(t => (
          <div key={t.value} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} /> 
            <span className="text-xs font-semibold text-slate-600">{t.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
      ) : (
        <div className="card p-6 min-h-[600px] border-slate-200 shadow-sm bg-white">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            onSelectEvent={setSelectedEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={["month", "agenda"]}
            eventPropGetter={eventStyleGetter}
            className="font-sans"
          />
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay z-50">
          <div className="modal-content max-w-md animate-in zoom-in-95 duration-200">
            <div className="modal-header border-b p-4">
              <h3 className="text-lg font-bold">Add New Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddEvent}>
              <div className="modal-body p-6 space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input 
                    required 
                    className="input" 
                    placeholder="e.g. Review Q2 goals with team"
                    value={newEvenData.title}
                    onChange={e => setNewEventData({...newEvenData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input 
                      type="date" 
                      required 
                      className="input"
                      value={newEvenData.date}
                      onChange={e => setNewEventData({...newEvenData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label">Time</label>
                    <input 
                      type="time" 
                      className="input"
                      value={newEvenData.time}
                      onChange={e => setNewEventData({...newEvenData, time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select 
                    className="input"
                    value={newEvenData.type}
                    onChange={e => setNewEventData({...newEvenData, type: e.target.value})}
                  >
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <textarea 
                    className="input h-24 resize-none" 
                    maxLength={200}
                    placeholder="Add more details..."
                    value={newEvenData.description}
                    onChange={e => setNewEventData({...newEvenData, description: e.target.value})}
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">{newEvenData.description.length}/200</div>
                </div>
              </div>
              <div className="modal-footer p-4 bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary bg-[#0066FF] flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedEvent && (
        <div className="modal-overlay z-50">
          <div className="modal-content max-w-md animate-in zoom-in-95 duration-200">
            <div className="modal-header bg-[#0066FF] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CalendarIcon size={20} />
                <h3 className="font-bold">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)}><X size={20}/></button>
            </div>
            <div className="modal-body p-6 space-y-4">
              <p className="text-sm text-slate-500 font-medium">{format(selectedEvent.start, "PPPP 'at' p")}</p>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-slate-700">{selectedEvent.description || "No description provided."}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="badge badge-blue">{selectedEvent.type.replace(/_/g, ' ')}</span>
                {selectedEvent.userId && (
                  <button 
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

