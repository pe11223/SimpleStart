"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, addDays, isWithinInterval, parseISO, startOfDay, endOfDay, isBefore, isAfter, differenceInCalendarDays, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Trash2, Pencil, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/lib/hooks";
import { useLanguage } from "@/lib/language-context";
import { zhCN, enUS } from "date-fns/locale";

type Event = {
  id: string;
  startDate: string; // ISO date string yyyy-MM-dd
  endDate: string;   // ISO date string yyyy-MM-dd
  title: string;
  completed?: boolean;
};

export function CalendarWidget() {
  const { t, language } = useLanguage();
  const dateLocale = language === "zh" ? zhCN : enUS;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useLocalStorage<Event[]>("simplestart-calendar-events-v2", []);
  
  // Selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Layout State
  const [showSidePanel, setShowSidePanel] = useState(false); // Default closed for compactness

  // Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Ensure we get the full grid (start of week for the 1st, end of week for the last)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  // Ensure we always have at least 6 weeks (42 days) to avoid jumping height
  // Or at least sufficient rows to cover the month.
  // startOfWeek/endOfWeek naturally provides full rows (35 or 42 days).
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Reset form
  const resetForm = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEditingEventId(null);
    setIsFormOpen(false);
  };

  const startAdding = () => {
     const isoDate = format(selectedDate, "yyyy-MM-dd");
     setEventStartDate(isoDate);
     setEventEndDate(isoDate);
     setEventTitle("");
     setEditingEventId(null);
     setIsFormOpen(true);
     if (!showSidePanel) setShowSidePanel(true);
  };

  const startEditing = (e: Event) => {
    setEventTitle(e.title);
    setEventStartDate(e.startDate);
    setEventEndDate(e.endDate);
    setEditingEventId(e.id);
    setIsFormOpen(true);
    if (!showSidePanel) setShowSidePanel(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim() || !eventStartDate || !eventEndDate) return;
    
    // Ensure start <= end
    let start = eventStartDate;
    let end = eventEndDate;
    if (start > end) {
        [start, end] = [end, start];
    }

    if (editingEventId) {
      // Update existing
      setEvents(events.map(e => e.id === editingEventId ? { ...e, title: eventTitle, startDate: start, endDate: end } : e));
    } else {
      // Create new
      const newEvent: Event = {
        id: Date.now().toString(),
        startDate: start,
        endDate: end,
        title: eventTitle,
        completed: false,
      };
      setEvents([...events, newEvent]);
    }
    resetForm();
  };

  const toggleEventStatus = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    if (editingEventId === id) resetForm();
  };

  // Helper to check if a day is within an event's range
  const isDayInEvent = (day: Date, event: Event) => {
      const s = parseISO(event.startDate);
      const e = parseISO(event.endDate);
      return isWithinInterval(day, { start: startOfDay(s), end: endOfDay(e) });
  };

  // Get all upcoming events (sorted by start date)
  const allUpcomingEvents = events
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="flex flex-col md:flex-row gap-0 h-full max-h-[500px] transition-all relative overflow-hidden">
      {/* Left: Calendar Grid */}
      <div className="min-w-[280px] flex-1 flex flex-col transition-all duration-300">
        <div className="flex items-center justify-between mb-1 md:mb-2">
            <h3 className="font-bold text-base capitalize flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-foreground/5 rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-foreground/5 rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
              
              <div className="w-px h-4 bg-foreground/10 mx-1" />
              
              <button 
                onClick={() => setShowSidePanel(!showSidePanel)}
                className={`p-1.5 rounded-full transition-colors ${showSidePanel ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-foreground/5 text-foreground/50'}`}
                title={t("toggleSidePanel")}
              >
                <LayoutTemplate className="w-4 h-4" />
              </button>
            </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-0 mb-1 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>

        {/* Calendar Grid - Gap 0 for continuous lines */}
        <div className="grid grid-cols-7 gap-x-0 gap-y-1 content-start flex-1">
            {days.map((day) => {
              // Find events active on this day
              const dayEvents = events.filter(e => isDayInEvent(day, e));
              const hasEvent = dayEvents.length > 0;
              
              // We only visualize the first 3 events
              const eventsToShow = dayEvents.slice(0, 3);

              return (
                <div key={day.toString()} className="relative w-full aspect-square">
                    {/* Background/Selection Circle (Centered) */}
                    <button
                        onClick={() => {
                            setSelectedDate(day);
                            if (!showSidePanel) setShowSidePanel(true);
                        }}
                        className={`
                            absolute inset-0 m-auto w-[90%] h-[90%] rounded-xl flex items-center justify-center font-bold transition-all duration-300 z-10
                            ${showSidePanel ? 'text-[11px]' : 'text-base md:text-lg'}
                            ${!isSameMonth(day, currentDate) ? "opacity-20" : ""}
                            ${isToday(day) ? "bg-blue-500 text-white shadow-sm" : "hover:bg-foreground/5"}
                            ${selectedDate && isSameDay(day, selectedDate) && !isToday(day) ? "bg-blue-500/20 text-blue-500 ring-1 ring-blue-500" : ""}
                        `}
                    >
                        {format(day, "d")}
                    </button>
                    
                    {/* Continuous Event Lines Layer (Behind Text, Full Width) */}
                    <div className="absolute top-[65%] left-0 w-full flex flex-col gap-[2px] pointer-events-none z-0">
                        {eventsToShow.map((event, index) => {
                            const start = parseISO(event.startDate);
                            const end = parseISO(event.endDate);
                            const isStart = isSameDay(day, start);
                            const isEnd = isSameDay(day, end);
                            const isSingleDay = isStart && isEnd;
                            
                            // Colors
                            const colors = ["bg-orange-400", "bg-green-400", "bg-purple-400"];
                            const colorClass = colors[index % colors.length];

                            // Layout Logic
                            // If start: margin left. If end: margin right.
                            // If middle: no margin.
                            // If single day: margin both sides.
                            
                            let marginClass = "mx-0"; // Default full width (middle)
                            let roundedClass = "";

                            if (isSingleDay) {
                                marginClass = "mx-2"; // Centered dot/bar
                                roundedClass = "rounded-full";
                            } else if (isStart) {
                                marginClass = "ml-2 mr-0"; // Start from center-ish to right
                                roundedClass = "rounded-l-full";
                            } else if (isEnd) {
                                marginClass = "ml-0 mr-2"; // Left to center-ish
                                roundedClass = "rounded-r-full";
                            }

                            return (
                                <div 
                                    key={event.id}
                                    className={`h-1 ${colorClass} opacity-80 ${marginClass} ${roundedClass}`}
                                />
                            );
                        })}
                    </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right: ToDo / Event List Panel */}
      <AnimatePresence mode="wait">
        {showSidePanel && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="border-t md:border-t-0 md:border-l border-foreground/10 pt-4 md:pt-0 md:pl-4 flex flex-col overflow-hidden shrink-0 w-full md:w-[260px]"
          >
            <div className="flex justify-between items-center mb-4 w-full">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {t("scheduleTodo")}
                </h3>
                <button 
                    onClick={startAdding}
                    className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-500 hover:text-white transition-colors ml-auto"
                >
                    <Plus className="w-3 h-3" /> {t("add")}
                </button>
            </div>

            {/* Add/Edit Event Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-2 bg-foreground/5 rounded-xl p-3 flex flex-col gap-2 min-w-[240px]"
                    >
                        <input
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder={t("eventTitle")}
                            className="w-full bg-background/50 rounded-lg px-2 py-1.5 text-xs outline-none border border-transparent focus:border-blue-500 transition-colors"
                            autoFocus
                        />
                        <div className="flex gap-1">
                            <div className="flex-1">
                                <label className="text-[9px] uppercase font-bold text-foreground/40 mb-0.5 block">{t("startDate")}</label>
                                <input 
                                    type="date" 
                                    value={eventStartDate}
                                    onChange={(e) => setEventStartDate(e.target.value)}
                                    className="w-full bg-background/50 rounded-lg px-1 py-1 text-[10px] outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] uppercase font-bold text-foreground/40 mb-0.5 block">{t("endDate")}</label>
                                <input 
                                    type="date" 
                                    value={eventEndDate}
                                    onChange={(e) => setEventEndDate(e.target.value)}
                                    className="w-full bg-background/50 rounded-lg px-1 py-1 text-[10px] outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                            <button onClick={resetForm} className="text-[10px] text-foreground/50 hover:text-foreground px-2 py-1">{t("cancel")}</button>
                            <button onClick={handleSaveEvent} className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded-md font-bold shadow-sm">
                              {editingEventId ? t("update") : t("confirm")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 h-full min-h-0 min-w-[240px]">
                {allUpcomingEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-foreground/20 gap-1">
                        <Circle className="w-6 h-6 opacity-20" />
                        <p className="text-xs">{t("noEvents")}</p>
                    </div>
                ) : (
                    allUpcomingEvents.map(e => {
                        const isCompleted = e.completed;
                        const start = parseISO(e.startDate);
                        const end = parseISO(e.endDate);
                        const isMultiDay = !isSameDay(start, end);

                        return (
                            <motion.div 
                                layout
                                key={e.id} 
                                className={`group flex items-start gap-2 p-2 rounded-xl transition-all ${isCompleted ? 'bg-foreground/5 opacity-50' : 'bg-card/50 hover:bg-card hover:shadow-sm border border-transparent hover:border-foreground/5'}`}
                            >
                                <button 
                                    onClick={() => toggleEventStatus(e.id)} 
                                    className={`mt-0.5 shrink-0 ${isCompleted ? 'text-green-500' : 'text-foreground/30 hover:text-blue-500'}`}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </button>
                                
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEditing(e)}>
                                    <h4 className={`text-xs font-medium leading-tight mb-0.5 ${isCompleted ? 'line-through' : ''}`}>{e.title}</h4>
                                    <div className="flex items-center gap-1 text-[9px] font-mono text-foreground/40">
                                        <span className="bg-foreground/5 px-1 rounded">
                                            {format(start, "MM/dd")}
                                        </span>
                                        {isMultiDay && (
                                            <>
                                                <span className="opacity-50">→</span>
                                                <span className="bg-foreground/5 px-1 rounded">
                                                    {format(end, "MM/dd")}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                      onClick={() => startEditing(e)}
                                      className="p-1 text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
                                  >
                                      <Pencil className="w-3 h-3" />
                                  </button>
                                  <button 
                                      onClick={() => deleteEvent(e.id)}
                                      className="p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                                  >
                                      <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}