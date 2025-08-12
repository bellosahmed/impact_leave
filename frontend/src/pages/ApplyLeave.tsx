// frontend/src/pages/ApplyLeave.tsx

import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { useState, useEffect } from 'react';

// Define the shape of a Holiday object for type safety
type Holiday = {
    _id: string;
    name: string;
    date: string;
};

// Zod schema for form validation
const schema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(10, "Reason must be at least 10 characters"),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date cannot be before the start date",
    path: ["endDate"],
});
type FormData = z.infer<typeof schema>;

// --- UPDATED HELPER: Now accounts for public holidays ---
function calculateLeaveDays(startDateStr: string, endDateStr: string, holidays: Holiday[] = []): number {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (start > end) return 0;

    const holidayDates = new Set(holidays.map(h => h.date.split('T')[0]));
    let count = 0;
    const curDate = new Date(start.getTime());

    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        const dateStr = curDate.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
}

// API functions
async function requestLeave(payload: FormData) {
    const { data } = await api.post('/leave/request', payload);
    return data;
}
async function getHolidays() {
    const { data } = await api.get<Holiday[]>('/holidays');
    return data;
}

export default function ApplyLeave() {
    const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [apiError, setApiError] = useState<string | null>(null);
    const [dayCount, setDayCount] = useState(0);

    // Fetch all public holidays to use in our calculation
    const { data: holidays } = useQuery({ queryKey: ['holidays'], queryFn: getHolidays });

    // Watch the date fields for real-time changes
    const startDate = useWatch({ control, name: 'startDate' });
    const endDate = useWatch({ control, name: 'endDate' });

    // Recalculate the day count whenever the dates or the list of holidays change
    useEffect(() => {
        const days = calculateLeaveDays(startDate, endDate, holidays);
        setDayCount(days);
    }, [startDate, endDate, holidays]);

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

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Apply for Leave</h1>
            <form onSubmit={handleSubmit(data => mutate(data))} className="bg-white p-8 rounded-lg border shadow-sm space-y-6 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                        <input type="date" min={today} className="w-full border-gray-300 rounded-md text-gray-900" {...register('startDate')} />
                        {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                        <input type="date" min={startDate || today} className="w-full border-gray-300 rounded-md text-gray-900" {...register('endDate')} />
                        {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate.message}</p>}
                    </div>
                </div>

                {dayCount > 0 && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                        Total workable leave days (excluding weekends & holidays): <strong>{dayCount}</strong>
                    </div>
                )}

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