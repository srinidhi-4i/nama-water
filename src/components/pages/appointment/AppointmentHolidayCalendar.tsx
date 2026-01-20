'use client';

import React, { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointment.service';
import PageHeader from "@/components/layout/PageHeader"
import {
    AppointmentHolidayMasterData,
    AppointmentHolidayListItem,
    InsertAppointmentHolidayRequest,
} from '@/types/appointment.types';
import { WeekDay } from '@/types/wetland.types'; 
import DayOfWeekSelector from '@/components/wetland/DayOfWeekSelector'; 
import HolidayList from '@/components/wetland/HolidayList'; 
import HolidayCalendarModals from '@/components/wetland/HolidayCalendarModals'; 
import { toast } from 'sonner';
import { Info, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function AppointmentHolidayCalendar() {
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [yearSelected, setYearSelected] = useState<number>(0);
    const [holidayType, setHolidayType] = useState<'WO' | 'SH' | ''>('');
    const [holidayTypes, setHolidayTypes] = useState<AppointmentHolidayMasterData[]>([]);
    const [maxWeekendDays, setMaxWeekendDays] = useState(2); 
    const [warningMessage, setWarningMessage] = useState('');
    const [showWarningModal, setShowWarningModal] = useState(false);
    
    // Form fields
    const [description, setDescription] = useState('');
    const [descriptionAR, setDescriptionAR] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [weekDays, setWeekDays] = useState<WeekDay[]>([
        { id: 7, value: 'Sunday', selected: false },
        { id: 1, value: 'Monday', selected: false },
        { id: 2, value: 'Tuesday', selected: false },
        { id: 3, value: 'Wednesday', selected: false },
        { id: 4, value: 'Thursday', selected: false },
        { id: 5, value: 'Friday', selected: false },
        { id: 6, value: 'Saturday', selected: false },
    ]);

    // Holiday list
    const [holidayList, setHolidayList] = useState<AppointmentHolidayListItem[][]>([]);
    const [showHolidayList, setShowHolidayList] = useState(false);
    const [disableFields, setDisableFields] = useState(false);

    // Validation messages
    const [fromDateError, setFromDateError] = useState('');
    const [toDateError, setToDateError] = useState('');

    // Modals visibility
    const [showDataExistsModal, setShowDataExistsModal] = useState(false);
    const [showWORequiredModal, setShowWORequiredModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showEditSHModal, setShowEditSHModal] = useState(false);
    
    // Modal data
    const [deleteTarget, setDeleteTarget] = useState<AppointmentHolidayListItem | null>(null);
    const [editTarget, setEditTarget] = useState<AppointmentHolidayListItem | null>(null);

    // Edit form fields
    const [editDescription, setEditDescription] = useState('');
    const [editDescriptionAR, setEditDescriptionAR] = useState('');
    const [editFromDate, setEditFromDate] = useState('');
    const [editToDate, setEditToDate] = useState('');

    const englishRegex = /^(?!\s)[A-Za-z0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;
    const arabicRegex = /^(?!\s)[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;

    useEffect(() => {
        loadMasterData();
    }, []);

    const loadMasterData = async () => {
        try {
            const types = await appointmentService.getMasterData('HolidayReasonTypes');
            setHolidayTypes(Array.isArray(types) ? types : []);
        } catch (error) {
            console.error('Error loading holiday types:', error);
        }
    };

    const getYearDateRange = (year: number) => {
        const firstDate = `${year}-01-01`;
        const lastDate = `${year}-12-31`;
        return { firstDate, lastDate };
    };

    const groupHolidaysByMonth = (holidays: AppointmentHolidayListItem[]) => {
        const grouped: { [key: string]: AppointmentHolidayListItem[] } = {};
        const sortedHolidays = [...holidays].sort((a, b) => 
            new Date(a.HolidayDate).getTime() - new Date(b.HolidayDate).getTime()
        );

        sortedHolidays.forEach(holiday => {
            const date = new Date(holiday.HolidayDate);
            const month = date.getMonth() + 1;
            const yearMonth = `${date.getFullYear()}-${String(month).padStart(2, '0')}`;
            if (!grouped[yearMonth]) {
                grouped[yearMonth] = [];
            }
            grouped[yearMonth].push(holiday);
        });

        return Object.values(grouped);
    };

    const loadHolidays = async (fromDate: string, toDate: string) => {
        try {
            setIsLoading(true);
            const holidays = await appointmentService.getHolidayDates(fromDate, toDate);
            
            // Client-side filter: Ensure we only return holidays for the requested year range
            // This protects against the API returning ALL holidays despite parameters
            /*
            if (fromDate && toDate) {
                const targetYear = fromDate.split('-')[0]; // Assumes fromDate is YYYY-MM-DD
                return holidays.filter(h => {
                    if (!h.HolidayDate) return false;
                    const holidayYear = h.HolidayDate.split('T')[0].split('-')[0];
                    return holidayYear === targetYear;
                });
            }
            */
            return holidays;
        } catch (error) {
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const handleYearChange = async (year: number) => {
        setYearSelected(year);
        setShowHolidayList(false);
        setHolidayList([]);
        resetForm();
        
        if (year > 0 && holidayType) {
            handleHolidayTypeChange(holidayType as 'WO' | 'SH', year);
        }
    };

    const handleHolidayTypeChange = async (type: 'WO' | 'SH', yearOverride?: number) => {
        const year = yearOverride || yearSelected;
        if (year === 0) {
            setHolidayType(type);
            return;
        }

        resetForm();
        setHolidayType(type);
        setShowHolidayList(false);
        setHolidayList([]);
        setDisableFields(false);

        const { firstDate, lastDate } = getYearDateRange(year);
        const holidays = await loadHolidays(firstDate, lastDate);

        if (type === 'WO') {
            const woHolidays = holidays.filter(h => h.HolidayReason === 'WO');
            if (woHolidays.length > 0) {
                const grouped = groupHolidaysByMonth(woHolidays);
                setHolidayList(grouped);
                setDescription(woHolidays[0].HolidayDescriptionEn || '');
                setDescriptionAR(woHolidays[0].HolidayDescriptionAr || '');
                setDisableFields(true);
                setShowDataExistsModal(true);
            }
        } else if (type === 'SH') {
            const woHolidays = holidays.filter(h => h.HolidayReason === 'WO');
            if (woHolidays.length === 0) {
                setDisableFields(true);
                setShowWORequiredModal(true);
            } else {
                console.log('DEBUG: Checking SH holidays. Full list:', holidays); // Add logging
                const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
                if (shHolidays.length > 0) {
                    const grouped = groupHolidaysByMonth(shHolidays);
                    setHolidayList(grouped);
                    setShowHolidayList(true);
                }
            }
        }
    };

    const handleDayClick = (id: number) => {
        setWeekDays(prev => {
            const selectedCount = prev.filter(d => d.selected).length;
            
            return prev.map(day => {
                if (day.id === id) {
                    if (!day.selected && selectedCount >= maxWeekendDays) {
                        return day;
                    }
                    return { ...day, selected: !day.selected };
                }
                return day;
            });
        });
    };

    const handleFromDateChange = async (date: string) => {
        setFromDate(date);
        setToDate('');
        setFromDateError('');
        setToDateError('');

        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        const holidays = await loadHolidays(firstDate, lastDate);
        
        const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
        const woHolidays = holidays.filter(h => h.HolidayReason === 'WO');

        const isDateHoliday = (dateStr: string, list: AppointmentHolidayListItem[]) => {
            return list.some(h => h.HolidayDate.split('T')[0] === dateStr);
        };

        if (isDateHoliday(date, shHolidays)) {
            setFromDateError(language === 'EN' ? 'A holiday has already been scheduled for the selected date!' : 'تم جدولة عطلة بالفعل للتاريخ المحدد!');
        } else if (isDateHoliday(date, woHolidays)) {
            setFromDateError(language === 'EN' ? 'Weekend Off has already been scheduled for the selected date!' : 'تم جدولة عطلة نهاية أسبوع بالفعل للتاريخ المحدد!');
        }
    };

    const handleToDateChange = async (date: string) => {
        setToDate(date);
        setToDateError('');

        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        const holidays = await loadHolidays(fromDate, date);
        
        const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
        const woHolidays = holidays.filter(h => h.HolidayReason === 'WO');

        const isDateHoliday = (dateStr: string, list: AppointmentHolidayListItem[]) => {
            return list.some(h => h.HolidayDate.split('T')[0] === dateStr);
        };

        if (isDateHoliday(date, shHolidays)) {
            setToDateError(language === 'EN' ? 'A holiday has already been scheduled for the selected date!' : 'تم جدولة عطلة بالفعل للتاريخ المحدد!');
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            setHolidayList(groupHolidaysByMonth(yearHolidays.filter(h => h.HolidayReason === 'SH')));
            setShowHolidayList(true);
        } else if (isDateHoliday(date, woHolidays)) {
            setToDateError(language === 'EN' ? 'Weekend Off has already been scheduled for the selected date!' : 'تم جدولة عطلة نهاية أسبوع بالفعل للتاريخ المحدد!');
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            setHolidayList(groupHolidaysByMonth(yearHolidays.filter(h => h.HolidayReason === 'SH')));
            setShowHolidayList(true);
        } else if (shHolidays.length > 0 || woHolidays.length > 0) {
            const msg = shHolidays.length > 0 
                ? (language === 'EN' ? 'Holidays have already been scheduled for the selected date range!' : 'تم جدولة عطلات بالفعل لهذا النطاق!')
                : (language === 'EN' ? 'Weekend Offs have already been scheduled for the selected date range!' : 'تم جدولة عطلات نهاية أسبوع بالفعل لهذا النطاق!');
            setToDateError(msg);
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            setHolidayList(groupHolidaysByMonth(yearHolidays.filter(h => h.HolidayReason === 'SH')));
            setShowHolidayList(true);
        }
    };

    const isSubmitDisabled = () => {
        if (holidayType === 'WO') {
            const selectedDays = weekDays.filter(d => d.selected).length;
            return selectedDays !== maxWeekendDays || !description || !descriptionAR;
        }
        if (holidayType === 'SH') {
            return !fromDate || !toDate || !description || !descriptionAR || !!fromDateError || !!toDateError;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (isSubmitDisabled()) return;

        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        
        const requestData: InsertAppointmentHolidayRequest = {
            Lang: 'EN',
            Action: holidayType === 'SH' ? 'U' : 'I',
            HolidayType: holidayType as 'WO' | 'SH',
            StartDate: holidayType === 'WO' ? firstDate : fromDate,
            EndDate: holidayType === 'WO' ? lastDate : toDate,
            InternalUserID: null, // Fixed: Use null explicitly to match Wetland service which converts to "null" string
            HolidayDesriptionEN: description,
            HolidayDesriptionAR: descriptionAR,
        };

        if (holidayType === 'WO') {
            const selectedDays = weekDays.filter(d => d.selected).map(d => d.value).join(',');
            requestData.Weekends = selectedDays;
            requestData.Year = yearSelected;
        }

        try {
            setIsLoading(true);
            const result = await appointmentService.insertHoliday(requestData);

            if (result.success) {
                toast.success(
                    holidayType === 'WO' 
                        ? (language === 'EN' ? 'Weekend Offs created successfully!' : 'تم إنشاء عطلات نهاية الأسبوع بنجاح!')
                        : (language === 'EN' ? 'Special Holiday(s) created successfully!' : 'تم إنشاء العطلات الخاصة بنجاح!')
                );
                
                resetForm();
                
                // Reload holidays
                const holidays = await loadHolidays(firstDate, lastDate);
                const filtered = holidays.filter(h => h.HolidayReason === holidayType as 'WO' | 'SH');
                setHolidayList(groupHolidaysByMonth(filtered));
                setShowHolidayList(true);
                
                if (holidayType === 'WO') {
                    setDisableFields(true);
                }
            } else if (result.statusCode === 606) {
                setWarningMessage(result.error || 'Data conflict');
                setShowWarningModal(true);
            } else {
                toast.error(result.error || 'Failed to create holiday');
            }
        } catch (error) {
            console.error('Error creating holiday:', error);
            toast.error(language === 'EN' ? 'An error occurred' : 'حدث خطأ ما');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (holiday: AppointmentHolidayListItem) => {
        setEditTarget(holiday);
        setEditDescription(holiday.HolidayDescriptionEn);
        setEditDescriptionAR(holiday.HolidayDescriptionAr);
        setEditFromDate(holiday.HolidayDate.split('T')[0]);
        setEditToDate(holiday.HolidayDate.split('T')[0]);
        setShowEditSHModal(true);
    };

    const confirmEdit = async () => {
        if (!editTarget) return;

        const requestData: InsertAppointmentHolidayRequest = {
            Lang: 'EN',
            Action: 'U',
            HolidayType: 'SH',
            StartDate: editFromDate,
            EndDate: editToDate,
            InternalUserID: null,
            HolidayDesriptionEN: editDescription,
            HolidayDesriptionAR: editDescriptionAR,
        };

        try {
            setIsLoading(true);
            const result = await appointmentService.insertHoliday(requestData);

            if (result.success) {
                toast.success(language === 'EN' ? 'Special Holiday updated successfully!' : 'تم تحديث العطلة الخاصة بنجاح!');
                setShowEditSHModal(false);
                
                const { firstDate, lastDate } = getYearDateRange(yearSelected);
                const holidays = await loadHolidays(firstDate, lastDate);
                const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
                setHolidayList(groupHolidaysByMonth(shHolidays));
            } else {
                toast.error(result.error || 'Failed to update holiday');
            }
        } catch (error) {
            console.error('Error updating holiday:', error);
            toast.error(language === 'EN' ? 'An error occurred' : 'حدث خطأ ما');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (holiday: AppointmentHolidayListItem) => {
        setDeleteTarget(holiday);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const requestData: InsertAppointmentHolidayRequest = {
            Lang: 'EN',
            Action: 'D',
            HolidayType: 'SH',
            StartDate: deleteTarget.HolidayDate.split('T')[0],
            EndDate: deleteTarget.HolidayDate.split('T')[0],
            InternalUserID: null,
            HolidayDesriptionEN: deleteTarget.HolidayDescriptionEn,
            HolidayDesriptionAR: deleteTarget.HolidayDescriptionAr,
        };

        try {
            setIsLoading(true);
            const result = await appointmentService.insertHoliday(requestData);

            if (result.success) {
                toast.success(language === 'EN' ? 'Holiday deleted successfully!' : 'تم حذف العطلة بنجاح!');
                
                const { firstDate, lastDate } = getYearDateRange(yearSelected);
                const holidays = await loadHolidays(firstDate, lastDate);
                const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
                setHolidayList(groupHolidaysByMonth(shHolidays));
                
                // Keep showing list even if empty, as per UAT
                // if (shHolidays.length === 0) {
                //     setShowHolidayList(false);
                // }
            } else {
                toast.error(result.error || 'Failed to delete holiday');
            }
        } catch (error) {
            console.error('Error deleting holiday:', error);
            toast.error(language === 'EN' ? 'An error occurred' : 'حدث خطأ ما');
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleDeleteAll = async () => {
        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        
        const requestData: InsertAppointmentHolidayRequest = {
            Lang: 'EN',
            Action: 'D',
            HolidayType: holidayType as 'WO' | 'SH',
            StartDate: firstDate,
            EndDate: lastDate,
            InternalUserID: null,
            HolidayDesriptionEN: description,
            HolidayDesriptionAR: descriptionAR,
            Year: yearSelected,
        };

        if (holidayType === 'WO') {
            requestData.Weekends = weekDays.filter(d => d.selected).map(d => d.value).join(',');
        }

        try {
            setIsLoading(true);
            const result = await appointmentService.insertHoliday(requestData);

            if (result.success) {
                toast.success(language === 'EN' ? 'Holidays deleted successfully!' : 'تم حذف العطلات بنجاح!');
                setHolidayList([]);
                // Keep visible to show "No Records Found"
                // setShowHolidayList(false);
                setDisableFields(false);
                resetForm();
            } else {
                toast.error(result.error || 'Failed to delete holidays');
            }
        } catch (error) {
            console.error('Error deleting holidays:', error);
            toast.error(language === 'EN' ? 'An error occurred' : 'حدث خطأ ما');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setDescription('');
        setDescriptionAR('');
        setFromDate('');
        setToDate('');
        setFromDateError('');
        setToDateError('');
        setWeekDays(prev => prev.map(d => ({ ...d, selected: false })));
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

    const minDate = yearSelected === currentYear 
        ? new Date().toISOString().split('T')[0]
        : `${yearSelected}-01-01`;
    const maxDate = `${yearSelected}-12-31`;

    return (
      <div className="flex-1 bg-slate-100 overflow-x-hidden">
            <PageHeader
              language={language}
              titleEn="Holiday Calendar"
              titleAr="تقويم العطلات"
              breadcrumbEn="Holiday Calendar"
              breadcrumbAr="تقويم العطلات"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {language === "EN" ? "Holiday Type" : "نوع العطلة"} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={holidayType}
                                onChange={(e) => handleHolidayTypeChange(e.target.value as 'WO' | 'SH')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            >
                                <option value="">{language === "EN" ? "Select Holiday Type" : "اختر نوع العطلة"}</option>
                                {holidayTypes.map(type => (
                                    <option key={type.HolidayReasonType} value={type.HolidayReasonType}>
                                        {language === "EN" ? type.HolidayReasonTypeNameEN : type.HolidayReasonTypeNameAR}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {language === "EN" ? "Year" : "السنة"} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={yearSelected}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            >
                                <option value={0}>{language === "EN" ? "Select Year" : "اختر السنة"}</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!yearSelected || !holidayType ? (
                         <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3 mb-6">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-900">
                                {language === "EN" ? "Please select both Year and Holiday Type to continue." : "يرجى اختيار السنة ونوع العطلة للمتابعة."}
                            </p>
                        </div>
                    ) : (
                    <fieldset disabled={disableFields}>
                        {holidayType === 'WO' && (
                            <div className="space-y-6">
                                <DayOfWeekSelector
                                    weekDays={weekDays}
                                    onDayClick={handleDayClick}
                                    disabled={disableFields}
                                    maxSelection={maxWeekendDays}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "Description [English]" : "الوصف [إنجليزي]"} <span className="text-red-500">*</span></label>
                                        <textarea value={description} onChange={(e) => englishRegex.test(e.target.value) && setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "Description [Arabic]" : "الوصف [عربي]"} <span className="text-red-500">*</span></label>
                                        <textarea value={descriptionAR} onChange={(e) => arabicRegex.test(e.target.value) && setDescriptionAR(e.target.value)} rows={3} dir="rtl" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {holidayType === 'SH' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "From Date" : "من تاريخ"} <span className="text-red-500">*</span></label>
                                        <input type="date" value={fromDate} onChange={(e) => handleFromDateChange(e.target.value)} min={minDate} max={maxDate} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 text-sm" />
                                        {fromDateError && <p className="mt-1 text-sm text-red-600">{fromDateError}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "To Date" : "إلى تاريخ"} <span className="text-red-500">*</span></label>
                                        <input type="date" value={toDate} onChange={(e) => handleToDateChange(e.target.value)} min={fromDate || minDate} max={maxDate} disabled={!fromDate || !!fromDateError} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 text-sm" />
                                        {toDateError && <p className="mt-1 text-sm text-red-600">{toDateError}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "Description [English]" : "الوصف [إنجليزي]"} <span className="text-red-500">*</span></label>
                                        <textarea value={description} onChange={(e) => englishRegex.test(e.target.value) && setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{language === "EN" ? "Description [Arabic]" : "الوصف [عربي]"} <span className="text-red-500">*</span></label>
                                        <textarea value={descriptionAR} onChange={(e) => arabicRegex.test(e.target.value) && setDescriptionAR(e.target.value)} rows={3} dir="rtl" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}
                    
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSubmit} disabled={isSubmitDisabled() || isLoading} className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 transition-colors flex items-center gap-2 text-sm">
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} 
                                {language === "EN" ? "Submit" : "إرسال"}
                            </button>
                        </div>
                    </fieldset>
                    )}
                </div>

                {showHolidayList && (
                    <HolidayList
                        holidays={holidayList as any}
                        year={yearSelected}
                        holidayType={holidayType as 'WO' | 'SH'}
                        onDelete={handleDelete as any}
                        onEdit={handleEdit as any}
                        onDeleteAll={() => setShowDeleteAllModal(true)}
                    />
                )}
            </div>

            <HolidayCalendarModals 
                showDataExistsModal={showDataExistsModal}
                setShowDataExistsModal={setShowDataExistsModal}
                onViewExisting={() => { setShowDataExistsModal(false); setShowHolidayList(true); }}
                onCancelExisting={() => { setShowDataExistsModal(false); setHolidayType(''); setHolidayList([]); setDisableFields(false); }}
                yearSelected={yearSelected}
                showWORequiredModal={showWORequiredModal}
                setShowWORequiredModal={setShowWORequiredModal}
                onCreateWO={() => { setShowWORequiredModal(false); setDisableFields(false); handleHolidayTypeChange('WO'); }}
                onCancelWO={() => { setShowWORequiredModal(false); setHolidayType(''); setDisableFields(false); }}
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                deleteTarget={deleteTarget as any}
                confirmDelete={confirmDelete}
                isLoading={isLoading}
                showEditSHModal={showEditSHModal}
                setShowEditSHModal={setShowEditSHModal}
                editFromDate={editFromDate}
                setEditFromDate={setEditFromDate}
                editToDate={editToDate}
                setEditToDate={setEditToDate}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editDescriptionAR={editDescriptionAR}
                setEditDescriptionAR={setEditDescriptionAR}
                confirmEdit={confirmEdit}
                showDeleteAllModal={showDeleteAllModal}
                setShowDeleteAllModal={setShowDeleteAllModal}
                onDeleteAll={handleDeleteAll}
                type={holidayType}
                showWarningModal={showWarningModal}
                setShowWarningModal={setShowWarningModal}
                warningMessage={warningMessage}
            />
        </div>
    );
}
