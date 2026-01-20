'use client';

import React from 'react';
import { WetlandHolidayListItem } from '@/types/wetland.types';
import { Trash2 } from 'lucide-react';

interface HolidayListProps {
    holidays: WetlandHolidayListItem[][];
    year: number;
    holidayType: 'WO' | 'SH';
    onDelete: (holiday: WetlandHolidayListItem) => void;
    onEdit?: (holiday: WetlandHolidayListItem) => void;
    onDeleteAll?: () => void;
}

export default function HolidayList({
    holidays,
    year,
    holidayType,
    onDelete,
    onEdit,
    onDeleteAll,
}: HolidayListProps) {
    const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.getDate(),
            day: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
            month: monthNames[date.getMonth()],
        };
    };

    if (!holidays || holidays.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-[600px]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg sticky top-0 z-20">
                <h3 className="text-lg font-semibold text-teal-900">
                    {holidayType === 'WO' ? 'Weekend Off' : 'Specific Date'} - Holiday List [{year}]
                </h3>
                {onDeleteAll && (
                    <button
                        onClick={onDeleteAll}
                        className="px-4 py-1.5 text-sm font-medium text-teal-700 hover:text-white border border-teal-600 hover:bg-teal-600 rounded-md transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                Description [English]
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                Description [Arabic]
                            </th>
                            {holidayType === 'SH' && (
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center">
                                    Action
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {holidays.map((monthGroup, monthIndex) => {
                            const firstHoliday = monthGroup[0];
                            const { month } = formatDate(firstHoliday.HolidayDate);

                            return monthGroup.map((holiday, index) => {
                                const { date, day } = formatDate(holiday.HolidayDate);
                                const isPastDate = new Date(holiday.HolidayDate) < new Date();

                                return (
                                    <tr key={`${monthIndex}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        {index === 0 && (
                                            <td
                                                rowSpan={monthGroup.length}
                                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 border-r border-gray-100 align-top"
                                            >
                                                {month}-{year}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-baseline gap-2 text-sm">
                                                <span className="font-bold text-red-600 text-base">{date}</span>
                                                <span className="text-gray-500 font-medium">{day}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs truncate" title={holiday.HolidayDescriptionEn}>
                                                {holiday.HolidayDescriptionEn || (holidayType === 'WO' ? 'WEEKEND OFF' : '--')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-arabic" dir="rtl">
                                            <div className="max-w-xs truncate" title={holiday.HolidayDescriptionAr}>
                                                {holiday.HolidayDescriptionAr || (holidayType === 'WO' ? 'الاجازات الاسبوعية' : '--')}
                                            </div>
                                        </td>
                                        {holidayType === 'SH' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => onEdit?.(holiday)}
                                                            className="text-teal-600 hover:text-teal-700 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => onDelete(holiday)}
                                                            className="text-red-600 hover:text-red-700 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
