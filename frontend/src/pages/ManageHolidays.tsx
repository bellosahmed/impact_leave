import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useState, useMemo } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';

type Holiday = { _id: string; name: string; date: string };

const schema = z.object({
    name: z.string().min(3, 'Holiday name is required'),
    date: z.string().min(1, 'Date is required'),
});
type FormData = z.infer<typeof schema>;

async function getAllHolidays() {
    const { data } = await api.get<Holiday[]>('/holidays');
    return data;
}
async function addHoliday(payload: FormData) {
    return api.post('/holidays', payload);
}
async function deleteHoliday(id: string) {
    return api.delete(`/holidays/${id}`);
}

export default function ManageHolidays() {
    const queryClient = useQueryClient();
    const { data: holidays, isLoading } = useQuery({
        queryKey: ['holidays'],
        queryFn: getAllHolidays,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const [searchTerm, setSearchTerm] = useState('');

    const addMutation = useMutation({
        mutationFn: addHoliday,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteHoliday,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['holidays'] }),
    });

    const filteredHolidays = useMemo(() => {
        if (!holidays) return [];
        return holidays.filter((holiday) =>
            (holiday.name ?? '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [holidays, searchTerm]);

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">
                Manage Public Holidays
            </h1>
            <div className="grid md:grid-cols-3 gap-8">
                {/* Add new holiday form */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Add New Holiday
                    </h2>
                    <form
                        onSubmit={handleSubmit((data) => addMutation.mutate(data))}
                        className="bg-white p-6 rounded-lg border space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Holiday Name
                            </label>
                            <input
                                className="w-full border-gray-300 rounded-md text-gray-900"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                min={today}
                                className="w-full border-gray-300 rounded-md text-gray-900"
                                {...register('date')}
                            />
                            {errors.date && (
                                <p className="text-xs text-red-600 mt-1">
                                    {errors.date.message}
                                </p>
                            )}
                        </div>
                        {addMutation.error && (
                            <p className="text-sm text-red-600">
                                Error:{' '}
                                {addMutation.error instanceof AxiosError
                                    ? addMutation.error.response?.data?.message
                                    : 'An unknown error occurred'}
                            </p>
                        )}
                        <button
                            disabled={addMutation.isPending}
                            className="w-full bg-indigo-600 text-white rounded-md py-2 font-semibold"
                        >
                            {addMutation.isPending ? 'Adding...' : 'Add Holiday'}
                        </button>
                    </form>
                </div>

                {/* Existing holidays list */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Existing Holidays
                    </h2>
                    <div className="mb-4">
                        <label htmlFor="search-holiday" className="sr-only">
                            Search Holidays
                        </label>
                        <input
                            id="search-holiday"
                            type="text"
                            placeholder="Search by holiday name..."
                            className="w-full border-gray-300 rounded-md text-gray-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="bg-white border rounded-lg">
                        {isLoading ? (
                            <table className="min-w-full">
                                <tbody>
                                    <SkeletonLoader rows={5} cols={2} />
                                </tbody>
                            </table>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredHolidays.map((h) => (
                                    <li
                                        key={h._id}
                                        className="p-4 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{h.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(h.date).toDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteMutation.mutate(h._id)}
                                            disabled={deleteMutation.isPending}
                                            className="text-red-600 text-sm font-medium hover:text-red-800 transition"
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                                {filteredHolidays.length === 0 && (
                                    <li className="p-4 text-gray-500">
                                        {holidays && holidays.length > 0
                                            ? 'No holidays match your search.'
                                            : 'No holidays have been added yet.'}
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
