'use client';

import React from 'react';
import { WeekDay } from '@/types/wetland.types';

interface DayOfWeekSelectorProps {
    weekDays: WeekDay[];
    onDayClick: (id: number) => void;
    disabled?: boolean;
    maxSelection: number;
}

export default function DayOfWeekSelector({
    weekDays,
    onDayClick,
    disabled = false,
    maxSelection,
}: DayOfWeekSelectorProps) {
    const selectedCount = weekDays.filter(day => day.selected).length;

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Day Of Week <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
                Select {maxSelection} day{maxSelection > 1 ? 's' : ''} of the week
            </p>
            <div className={`grid grid-cols-7 gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {weekDays.map((day) => {
                    const canSelect = !day.selected && selectedCount >= maxSelection;
                    
                    return (
                        <button
                            key={day.id}
                            type="button"
                            onClick={() => !canSelect && onDayClick(day.id)}
                            disabled={disabled || canSelect}
                            className={`
                                px-3 py-2 rounded-md text-sm font-medium transition-colors
                                ${day.selected
                                    ? 'bg-teal-600 text-white'
                                    : canSelect
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                                }
                            `}
                        >
                            {day.value.substring(0, 3)}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500">
                {selectedCount} of {maxSelection} selected
            </p>
        </div>
    );
}
