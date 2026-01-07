'use client';

import React, { useState, useEffect } from 'react';
import { wetlandService } from '@/services/wetland.service';
import {
    HolidayMasterData,
    WetlandHolidayListItem,
    WeekDay,
    InsertHolidayRequest,
} from '@/types/wetland.types';
import DayOfWeekSelector from '@/components/wetland/DayOfWeekSelector';
import HolidayList from '@/components/wetland/HolidayList';
import HolidayCalendarModals from '@/components/wetland/HolidayCalendarModals';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Info, Calendar, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function WetlandHolidayCalendar() {
    const { language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [yearSelected, setYearSelected] = useState<number>(0);
    const [holidayType, setHolidayType] = useState<'WO' | 'SH' | ''>('');
    const [holidayTypes, setHolidayTypes] = useState<HolidayMasterData[]>([]);
    const [maxWeekendDays, setMaxWeekendDays] = useState(1);
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
    const [holidayList, setHolidayList] = useState<WetlandHolidayListItem[][]>([]);
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
    const [deleteTarget, setDeleteTarget] = useState<WetlandHolidayListItem | null>(null);
    const [editTarget, setEditTarget] = useState<WetlandHolidayListItem | null>(null);

    // Edit form fields
    const [editDescription, setEditDescription] = useState('');
    const [editDescriptionAR, setEditDescriptionAR] = useState('');
    const [editFromDate, setEditFromDate] = useState('');
    const [editToDate, setEditToDate] = useState('');

    const englishRegex = /^(?!\s)[A-Za-z0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;
    const arabicRegex = /^(?!\s)[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]*$/;

    useEffect(() => {
        loadMasterData();
        loadConfiguration();
    }, []);

    const loadMasterData = async () => {
        try {
            const types = await wetlandService.getMasterData('HolidayReasonTypes');
            setHolidayTypes(types);
        } catch (error) {
            console.error('Error loading holiday types:', error);
            toast.error('Failed to load holiday types');
        }
    };

    const loadConfiguration = async () => {
        try {
            const config = await wetlandService.getMasterData('Configurations');
            if (config && config[0]?.WetlandSlotDaysPerWeek) {
                setMaxWeekendDays(7 - parseInt(config[0].WetlandSlotDaysPerWeek));
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    };

    const getYearDateRange = (year: number) => {
        const firstDate = `${year}-01-01`;
        const lastDate = `${year}-12-31`;
        return { firstDate, lastDate };
    };

    const groupHolidaysByMonth = (holidays: WetlandHolidayListItem[]) => {
        const grouped: { [key: string]: WetlandHolidayListItem[] } = {};
        
        // Sort holidays by date first
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
            const holidays = await wetlandService.getHolidayDates(fromDate, toDate);
            return holidays;
        } catch (error) {
            console.error('Error loading holidays:', error);
            toast.error('Failed to load holidays');
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

        const isDateHoliday = (dateStr: string, holidayList: WetlandHolidayListItem[]) => {
            return holidayList.some(h => h.HolidayDate.split('T')[0] === dateStr);
        };

        if (isDateHoliday(date, shHolidays)) {
            setFromDateError('A holiday has already been scheduled for the selected date!');
        } else if (isDateHoliday(date, woHolidays)) {
            setFromDateError('Weekend Off has already been scheduled for the selected date!');
        }
    };

    const handleToDateChange = async (date: string) => {
        setToDate(date);
        setToDateError('');

        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        const holidays = await loadHolidays(fromDate, date);
        
        const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
        const woHolidays = holidays.filter(h => h.HolidayReason === 'WO');

        const isDateHoliday = (dateStr: string, holidayList: WetlandHolidayListItem[]) => {
            return holidayList.some(h => h.HolidayDate.split('T')[0] === dateStr);
        };

        if (isDateHoliday(date, shHolidays)) {
            setToDateError('A holiday has already been scheduled for the selected date!');
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            const yearSH = yearHolidays.filter(h => h.HolidayReason === 'SH');
            setHolidayList(groupHolidaysByMonth(yearSH));
            setShowHolidayList(true);
        } else if (isDateHoliday(date, woHolidays)) {
            setToDateError('Weekend Off has already been scheduled for the selected date!');
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            const yearSH = yearHolidays.filter(h => h.HolidayReason === 'SH');
            setHolidayList(groupHolidaysByMonth(yearSH));
            setShowHolidayList(true);
        } else if (shHolidays.length > 0 || woHolidays.length > 0) {
            const msg = shHolidays.length > 0 
                ? 'Holidays have already been scheduled for the selected date range!'
                : 'Weekend Offs have already been scheduled for the selected date range!';
            setToDateError(msg);
            const yearHolidays = await loadHolidays(firstDate, lastDate);
            const yearSH = yearHolidays.filter(h => h.HolidayReason === 'SH');
            setHolidayList(groupHolidaysByMonth(yearSH));
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
        
        const requestData: InsertHolidayRequest = {
            Lang: 'EN',
            Action: holidayType === 'WO' ? 'I' : 'U',
            HolidayType: holidayType as 'WO' | 'SH',
            StartDate: holidayType === 'WO' ? firstDate : fromDate,
            EndDate: holidayType === 'WO' ? lastDate : toDate,
            InternalUserID: null,
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
            const result = await wetlandService.insertWetlandHoliday(requestData);

            if (result.success) {
                toast.success(
                    holidayType === 'WO' 
                        ? 'Weekend Offs created successfully!' 
                        : 'Special Holiday(s) created successfully!'
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
                setWarningMessage(result.error || 'The holiday data already exists for this period or there is a conflict. Please check the existing entries.');
                setShowWarningModal(true);
            } else {
                toast.error(result.error || 'Failed to create holiday');
            }
        } catch (error) {
            console.error('Error creating holiday:', error);
            toast.error('An error occurred while creating the holiday');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (holiday: WetlandHolidayListItem) => {
        setEditTarget(holiday);
        setEditDescription(holiday.HolidayDescriptionEn);
        setEditDescriptionAR(holiday.HolidayDescriptionAr);
        setEditFromDate(holiday.HolidayDate.split('T')[0]);
        setEditToDate(holiday.HolidayDate.split('T')[0]);
        setShowEditSHModal(true);
    };

    const confirmEdit = async () => {
        if (!editTarget) return;

        const requestData: InsertHolidayRequest = {
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
            const result = await wetlandService.insertWetlandHoliday(requestData);

            if (result.success) {
                toast.success('Special Holiday updated successfully!');
                setShowEditSHModal(false);
                
                // Reload holidays
                const { firstDate, lastDate } = getYearDateRange(yearSelected);
                const holidays = await loadHolidays(firstDate, lastDate);
                const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
                setHolidayList(groupHolidaysByMonth(shHolidays));
            } else {
                toast.error(result.error || 'Failed to update holiday');
            }
        } catch (error) {
            console.error('Error updating holiday:', error);
            toast.error('An error occurred while updating the holiday');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (holiday: WetlandHolidayListItem) => {
        setDeleteTarget(holiday);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const requestData: InsertHolidayRequest = {
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
            const result = await wetlandService.insertWetlandHoliday(requestData);

            if (result.success) {
                toast.success('Holiday deleted successfully!');
                
                // Reload holidays
                const { firstDate, lastDate } = getYearDateRange(yearSelected);
                const holidays = await loadHolidays(firstDate, lastDate);
                const shHolidays = holidays.filter(h => h.HolidayReason === 'SH');
                setHolidayList(groupHolidaysByMonth(shHolidays));
                
                if (shHolidays.length === 0) {
                    setShowHolidayList(false);
                }
            } else {
                toast.error(result.error || 'Failed to delete holiday');
            }
        } catch (error) {
            console.error('Error deleting holiday:', error);
            toast.error('An error occurred while deleting the holiday');
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleDeleteAll = async () => {
        const { firstDate, lastDate } = getYearDateRange(yearSelected);
        
        const requestData: InsertHolidayRequest = {
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
            const result = await wetlandService.insertWetlandHoliday(requestData);

            if (result.success) {
                toast.success(`${holidayType === 'WO' ? 'Weekend' : 'Special'} Holidays deleted successfully!`);
                setHolidayList([]);
                setShowHolidayList(false);
                setDisableFields(false);
                resetForm();
            } else {
                toast.error(result.error || 'Failed to delete holidays');
            }
        } catch (error) {
            console.error('Error deleting holidays:', error);
            toast.error('An error occurred while deleting holidays');
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
                                Holiday Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={holidayType}
                                onChange={(e) => handleHolidayTypeChange(e.target.value as 'WO' | 'SH')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Select Holiday Type</option>
                                {holidayTypes.map(type => (
                                    <option key={type.HolidayReasonType} value={type.HolidayReasonType}>
                                        {type.HolidayReasonTypeNameEN}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={yearSelected}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value={0}>Select Year</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!yearSelected || !holidayType ? (
                         <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3 mb-6">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-900">Please select both Year and Holiday Type to continue.</p>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description [English] <span className="text-red-500">*</span></label>
                                        <textarea value={description} onChange={(e) => englishRegex.test(e.target.value) && setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description [Arabic] <span className="text-red-500">*</span></label>
                                        <textarea value={descriptionAR} onChange={(e) => arabicRegex.test(e.target.value) && setDescriptionAR(e.target.value)} rows={3} dir="rtl" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {holidayType === 'SH' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date <span className="text-red-500">*</span></label>
                                        <input type="date" value={fromDate} onChange={(e) => handleFromDateChange(e.target.value)} min={minDate} max={maxDate} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500" />
                                        {fromDateError && <p className="mt-1 text-sm text-red-600">{fromDateError}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date <span className="text-red-500">*</span></label>
                                        <input type="date" value={toDate} onChange={(e) => handleToDateChange(e.target.value)} min={fromDate || minDate} max={maxDate} disabled={!fromDate || !!fromDateError} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100" />
                                        {toDateError && <p className="mt-1 text-sm text-red-600">{toDateError}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description [English] <span className="text-red-500">*</span></label>
                                        <textarea value={description} onChange={(e) => englishRegex.test(e.target.value) && setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description [Arabic] <span className="text-red-500">*</span></label>
                                        <textarea value={descriptionAR} onChange={(e) => arabicRegex.test(e.target.value) && setDescriptionAR(e.target.value)} rows={3} dir="rtl" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </div>
                            </div>
                        )}
                    
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSubmit} disabled={isSubmitDisabled() || isLoading} className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 transition-colors flex items-center gap-2">
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                            </button>
                        </div>
                    </fieldset>
                    )}
                </div>

                {showHolidayList && holidayList.length > 0 && (
                    <HolidayList
                        holidays={holidayList}
                        year={yearSelected}
                        holidayType={holidayType as 'WO' | 'SH'}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
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
                deleteTarget={deleteTarget}
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
