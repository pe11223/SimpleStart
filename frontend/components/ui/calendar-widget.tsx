"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, addDays, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "@/lib/hooks";
import { useLanguage } from "@/lib/language-context";
import { zhCN, enUS } from "date-fns/locale";

type Event = {
  id: string;
  date: string; // ISO date string yyyy-MM-dd
  title: string;
  completed?: boolean;
};

export function CalendarWidget() {
  const { t, language } = useLanguage();
  const dateLocale = language === "zh" ? zhCN : enUS;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useLocalStorage<Event[]>("gemini-calendar-events", []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;
    const newEvent: Event = {
      id: Date.now().toString(),
      date: format(selectedDate, "yyyy-MM-dd"),
      title: newEventTitle,
      completed: false,
    };
    setEvents([...events, newEvent]);
    setNewEventTitle("");
    setIsAddingEvent(false);
  };

  const toggleEventStatus = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  // Get upcoming events (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingEvents = events.filter(e => {
    const eventDate = parseISO(e.date);
    return isWithinInterval(eventDate, { start: today, end: nextWeek }) && !e.completed;
  }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5); // Limit to 5

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg capitalize">{format(currentDate, "MMMM yyyy", { locale: dateLocale })}</h3>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-foreground/5 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-foreground/5 rounded-full"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium opacity-50">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 content-start">
        {days.map((day) => {
          const dayEvents = events.filter(e => e.date === format(day, "yyyy-MM-dd"));
          return (
            <button
              key={day.toString()}
              onClick={() => {
                setSelectedDate(day);
                setIsAddingEvent(false);
              }}
              className={`
                relative aspect-square rounded-lg flex items-center justify-center text-sm transition-colors
                ${!isSameMonth(day, currentDate) ? "opacity-20" : ""}
                ${isToday(day) ? "bg-blue-500 text-white font-bold" : "hover:bg-foreground/5"}
                ${selectedDate && isSameDay(day, selectedDate) ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : ""}
              `}
            >
              {format(day, "d")}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date View */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 border-t border-foreground/10 pt-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold opacity-50">{format(selectedDate, "MMM d, yyyy", { locale: dateLocale })}</span>
              <button 
                onClick={() => setIsAddingEvent(true)}
                className="p-1 hover:bg-foreground/5 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingEvent ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={t("addEvent") + "..."}
                  className="flex-1 bg-foreground/5 rounded-lg px-2 py-1 text-sm outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                />
                <button onClick={handleAddEvent} className="text-blue-500 text-xs font-bold">{t("add")}</button>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {selectedDateEvents.length === 0 && !isAddingEvent ? (
                <p className="text-xs opacity-40 italic text-center py-2">{t("noEvents")}</p>
              ) : (
                selectedDateEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm bg-foreground/5 p-2 rounded-lg group">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button onClick={() => toggleEventStatus(e.id)} className="text-foreground/50 hover:text-blue-500 transition-colors">
                        {e.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <span className={`truncate ${e.completed ? 'line-through opacity-50' : ''}`}>{e.title}</span>
                    </div>
                    <button 
                      onClick={() => deleteEvent(e.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Upcoming Events (Always visible if no date selected or at bottom) */}
      {!selectedDate && upcomingEvents.length > 0 && (
         <div className="mt-4 border-t border-foreground/10 pt-4">
            <h4 className="text-xs font-bold opacity-50 mb-2 flex items-center gap-1">
               <Clock className="w-3 h-3" /> {t("upcomingEvents")}
            </h4>
            <div className="flex flex-col gap-2">
               {upcomingEvents.map(e => (
                 <div key={e.id} className="flex items-center gap-2 text-sm bg-foreground/5 p-2 rounded-lg">
                    <span className="text-xs font-mono bg-foreground/10 px-1 rounded text-foreground/70">
                       {format(parseISO(e.date), "MM/dd")}
                    </span>
                    <span className="truncate">{e.title}</span>
                 </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
