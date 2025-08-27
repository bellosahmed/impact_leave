// frontend/src/pages/ApplyLeave.tsx

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { useState, useEffect } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, isSaturday, isSunday } from 'date-fns';

// NOTE: The useOnClickOutside and useRef hooks have been completely removed.

// --- TYPE DEFINITIONS & SCHEMA ---
type Holiday = { date: string };
const schema = z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

// --- API FUNCTIONS ---
async function requestLeave(payload: { startDate: Date; endDate: Date; reason: string }) {
    const { data } = await api.post('/leave/request', payload);
    return data;
}
async function getHolidays() {
    const { data } = await api.get<Holiday[]>('/holidays');
    return data.map(h => new Date(h.date));
}

// --- HELPER FUNCTION for day calculation ---
function calculateLeaveDays(range: DateRange | undefined, holidays: Date[] = []): number {
    if (!range?.from || !range?.to) return 0;
    const holidayDates = new Set(holidays.map(h => format(h, 'yyyy-MM-dd')));
    let count = 0;
    const curDate = new Date(range.from);
    while (curDate <= range.to) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
            const dateStr = format(curDate, 'yyyy-MM-dd');
            if (!holidayDates.has(dateStr)) {
                count++;
            }
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

// --- MAIN COMPONENT ---
export default function ApplyLeave() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [apiError, setApiError] = useState<string | null>(null);

    const [range, setRange] = useState<DateRange | undefined>();
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const [dayCount, setDayCount] = useState(0);

    const { data: holidays } = useQuery({ queryKey: ['holidays'], queryFn: getHolidays });

    const { mutate, isPending } = useMutation({
        mutationFn: requestLeave,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
            navigate('/leaves');
        },
        onError: (e) => {
            if (e instanceof AxiosError) setApiError(e.response?.data?.message || 'An error occurred.');
        }
    });

    const onSubmit = (data: FormData) => {
        if (!range?.from || !range?.to) {
            setApiError("Please select both a start and end date.");
            return;
        }
        setApiError(null);
        mutate({ startDate: range.from, endDate: range.to, reason: data.reason });
    };

    useEffect(() => {
        const days = calculateLeaveDays(range, holidays);
        setDayCount(days);
    }, [range, holidays]);

    const disabledDays = [{ before: new Date() }];
    const modifiers = { weekend: (date: Date) => isSaturday(date) || isSunday(date), holiday: holidays || [], };
    const modifiersStyles = { weekend: { color: 'lightgray' }, holiday: { fontWeight: 'bold', color: 'teal' }, };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Apply for Leave</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg border shadow-sm space-y-6 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => { setIsStartOpen(prev => !prev); setIsEndOpen(false); }}
                                className="w-full text-left border-gray-300 rounded-md shadow-sm text-gray-900 p-2 border"
                            >
                                {range?.from ? format(range.from, 'PPP') : <span className="text-gray-500">Select date</span>}
                            </button>
                            {isStartOpen && (
                                <div className="absolute z-10 bg-white border rounded-md mt-1 shadow-lg">
                                    <DayPicker
                                        mode="single"
                                        selected={range?.from}
                                        onSelect={(date) => { setRange({ from: date, to: range?.to }); setIsStartOpen(false); }}
                                        disabled={disabledDays}
                                        modifiers={modifiers}
                                        modifiersStyles={modifiersStyles}
                                        initialFocus
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => { setIsEndOpen(prev => !prev); setIsStartOpen(false); }}
                                className="w-full text-left border-gray-300 rounded-md shadow-sm text-gray-900 p-2 border"
                            >
                                {range?.to ? format(range.to, 'PPP') : <span className="text-gray-500">Select date</span>}
                            </button>
                            {isEndOpen && (
                                <div className="absolute z-10 bg-white border rounded-md mt-1 shadow-lg">
                                    <DayPicker
                                        mode="single"
                                        selected={range?.to}
                                        onSelect={(date) => { setRange({ from: range?.from, to: date }); setIsEndOpen(false); }}
                                        disabled={[{ before: range?.from || new Date() }]}
                                        modifiers={modifiers}
                                        modifiersStyles={modifiersStyles}
                                        initialFocus
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {dayCount > 0 && (<div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">Total workable leave days (excluding weekends & holidays): <strong>{dayCount}</strong></div>)}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Reason for Leave</label>
                    <textarea className="w-full border-gray-300 rounded-md text-gray-900" rows={4} {...register('reason')}></textarea>
                    {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason.message}</p>}
                </div>
                {apiError && <p className="text-sm text-red-600">{apiError}</p>}
                <button disabled={isPending} className="w-full sm:w-auto bg-indigo-600 text-white rounded-md px-6 py-2 font-semibold">
                    {isPending ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
}