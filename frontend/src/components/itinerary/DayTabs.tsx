import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import { ItineraryDay } from '../../types';
import { formatDate } from '../../utils/formatters';

interface DayTabsProps {
  days: ItineraryDay[];
  selectedDayId: string | 'all';
  onSelectDay: (dayId: string | 'all') => void;
}

export const DayTabs: React.FC<DayTabsProps> = ({
  days,
  selectedDayId,
  onSelectDay,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {/* View All Days Tab */}
      <button
        type="button"
        onClick={() => onSelectDay('all')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
          selectedDayId === 'all'
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>All Days ({days.length})</span>
      </button>

      {/* Individual Day Tabs */}
      {days.map((day) => {
        const isSelected = selectedDayId === day.id;
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onSelectDay(day.id)}
            className={`flex flex-col items-start px-4 py-2 rounded-xl text-left whitespace-nowrap transition-all border min-w-[130px] ${
              isSelected
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between w-full gap-2">
              <span className={`font-bold text-xs ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                Day {day.day_number}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                {formatDate(day.date)}
              </span>
            </div>
            <span
              className={`text-[11px] truncate max-w-[140px] mt-0.5 ${
                isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'
              }`}
            >
              {day.theme}
            </span>
          </button>
        );
      })}
    </div>
  );
};
