"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";

type DateTimePickerProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  className?: string;
  name?: string;
  required?: boolean;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Helper to convert 24h to 12h representation
function get12HourData(time24: string) {
  if (!time24) return { hour12: "12", minute: "00", ampm: "AM" };
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10) || 0;
  const minute = mStr || "00";

  let ampm = "AM";
  let h12 = h;
  if (h >= 12) {
    ampm = "PM";
    if (h > 12) {
      h12 = h - 12;
    }
  }
  if (h12 === 0) {
    h12 = 12;
  }

  return {
    hour12: String(h12).padStart(2, "0"),
    minute,
    ampm,
  };
}

// Helper to convert 12h representation back to 24h
function get24HourString(h12Str: string, mStr: string, ampmStr: string) {
  const h12 = parseInt(h12Str, 10) || 12;
  let h24 = h12;
  if (ampmStr === "PM") {
    if (h12 !== 12) {
      h24 = h12 + 12;
    }
  } else {
    if (h12 === 12) {
      h24 = 0;
    }
  }
  return `${String(h24).padStart(2, "0")}:${mStr}`;
}

export function DateTimePicker({
  value,
  defaultValue = "",
  onChange,
  className = "",
  name,
  required,
}: DateTimePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date and time
  const [datePart, timePart] = currentValue ? currentValue.split("T") : ["", ""];
  let formattedTimePart = timePart || "";
  if (formattedTimePart && formattedTimePart.length > 5) {
    formattedTimePart = formattedTimePart.slice(0, 5);
  }

  // Get current 12h values
  const { hour12: currentHour12, minute: currentMinute, ampm: currentAmpm } = get12HourData(formattedTimePart);

  // Calendar view navigation state (defaults to today or selected date)
  const [viewMonth, setViewMonth] = useState(() => {
    const initialDate = datePart ? new Date(datePart) : new Date();
    return isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth();
  });
  const [viewYear, setViewYear] = useState(() => {
    const initialDate = datePart ? new Date(datePart) : new Date();
    return isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear();
  });

  const toggleOpen = () => {
    if (!isOpen) {
      const initialDate = datePart ? new Date(datePart) : new Date();
      if (!isNaN(initialDate.getTime())) {
        setViewMonth(initialDate.getMonth());
        setViewYear(initialDate.getFullYear());
      }
    }
    setIsOpen((prev) => !prev);
  };

  // Click outside handler to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const updateValue = (newDate: string, newTime: string) => {
    let combined = "";
    if (newDate) {
      let t = newTime;
      if (!t) {
        const now = new Date();
        t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      }
      combined = `${newDate}T${t}`;
    }

    if (value === undefined) {
      setInternalValue(combined);
    }
    if (onChange) {
      onChange(combined);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(dayNum).padStart(2, "0");
    const newDate = `${viewYear}-${formattedMonth}-${formattedDay}`;
    updateValue(newDate, formattedTimePart);
  };

  const handleTimeChange = (type: "hour" | "minute" | "ampm", val: string) => {
    let h12 = currentHour12;
    let m = currentMinute;
    let am = currentAmpm;

    if (type === "hour") {
      h12 = val;
    } else if (type === "minute") {
      m = val;
    } else {
      am = val;
    }

    const time24 = get24HourString(h12, m, am);

    // Default to today if date is not selected yet
    let d = datePart;
    if (!d) {
      const now = new Date();
      d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }

    updateValue(d, time24);
  };

  const handleSelectNow = () => {
    const now = new Date();
    const formattedMonth = String(now.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(now.getDate()).padStart(2, "0");
    const newDate = `${now.getFullYear()}-${formattedMonth}-${formattedDay}`;
    const newTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    updateValue(newDate, newTime);
    setIsOpen(false);
  };

  const handleClear = () => {
    updateValue("", "");
    setIsOpen(false);
  };

  // Calendar helper functions
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const daysArray: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  // Today check
  const today = new Date();
  const todayDayNum = today.getDate();
  const isCurrentMonthYear = today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  // Current selected day number if matching display month/year
  let selectedDayNum = 0;
  if (datePart) {
    const d = new Date(datePart);
    if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
      selectedDayNum = d.getDate();
    }
  }

  // Display text in the input box
  const displayText = currentValue
    ? `${datePart} ${currentHour12}:${currentMinute} ${currentAmpm}`
    : "";

  // Hours options (01-12)
  const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  // Minutes options (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <input
          type="text"
          readOnly
          placeholder="Select date & time"
          value={displayText}
          onClick={toggleOpen}
          className={`w-full cursor-pointer rounded-[6px] border border-[#d2d2d2] bg-white pr-10 pl-3 font-semibold text-black outline-none focus:border-black hover:border-black/50 transition-all duration-200 placeholder:text-black placeholder:font-normal ${className}`}
        />
        <Calendar
          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 cursor-pointer text-[#999999] group-hover:text-black transition-colors duration-200"
          onClick={toggleOpen}
        />
      </div>

      {name && <input type="hidden" name={name} value={currentValue} required={required} />}

      <div
        className={`absolute left-0 z-50 mt-2 w-[290px] origin-top-left rounded-[12px] border border-[#e5e5e5] bg-white p-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] transition-all duration-200 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-7 items-center justify-center rounded-[6px] hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-black active:scale-95 transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-xs font-bold text-slate-800 tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-7 items-center justify-center rounded-[6px] hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-black active:scale-95 transition-all"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {WEEK_DAYS.map((day, idx) => (
            <div key={`${day}-${idx}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {/* Pad first week */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Render actual days */}
          {daysArray.map((day) => {
            const isSelected = day === selectedDayNum;
            const isTodayDay = isCurrentMonthYear && day === todayDayNum;
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`flex size-7 items-center justify-center rounded-[6px] text-xs font-semibold relative active:scale-95 transition-all duration-100 ${
                  isSelected
                    ? "bg-black text-white shadow-sm font-bold"
                    : isTodayDay
                    ? "border-2 border-black text-black hover:bg-slate-50"
                    : "hover:bg-slate-50 hover:text-black text-slate-800"
                }`}
              >
                {day}
                {isTodayDay && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>

        {/* Time Selector */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="size-3.5" />
            <span className="text-[11px] font-bold text-slate-700">Time</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-[8px] border border-slate-100">
            <select
              value={currentHour12}
              onChange={(e) => handleTimeChange("hour", e.target.value)}
              className="h-7 w-[46px] rounded-[6px] bg-white border-0 px-1 text-center text-xs font-bold text-slate-800 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {hours12.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-slate-400">:</span>
            <select
              value={currentMinute}
              onChange={(e) => handleTimeChange("minute", e.target.value)}
              className="h-7 w-[46px] rounded-[6px] bg-white border-0 px-1 text-center text-xs font-bold text-slate-800 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={currentAmpm}
              onChange={(e) => handleTimeChange("ampm", e.target.value)}
              className="h-7 w-[46px] rounded-[6px] bg-white border-0 px-1 text-center text-xs font-bold text-slate-800 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleClear}
            className="font-bold text-slate-400 hover:text-red-500 transition-colors duration-150"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectNow}
              className="font-bold text-slate-600 hover:text-black transition-colors duration-150 px-2 py-1 hover:bg-slate-50 rounded-[6px]"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-black text-white hover:bg-slate-800 rounded-[6px] font-bold shadow-sm active:scale-95 transition-all duration-100"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
