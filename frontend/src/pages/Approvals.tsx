import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { decideLeave, getPendingApprovals, type Leave } from '../api/leaves'
import { useState } from 'react'

export default function Approvals() {
    const qc = useQueryClient()
    const { data, isLoading, error } = useQuery({ queryKey: ['approvals'], queryFn: getPendingApprovals })
    const { mutateAsync, isPending } = useMutation({
        mutationFn: ({ id, decision, comment }: { id: string; decision: 'APPROVED' | 'REJECTED'; comment?: string }) =>
            decideLeave(id, decision, comment),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] })
    })
    const [commentById, setCommentById] = useState<Record<string, string>>({})

    if (isLoading) return <div>Loading...</div>
    if (error) return <div className="text-red-600">Failed to load</div>

    return (
        <div>
            <h1 className="text-xl font-semibold mb-4">Pending approvals</h1>
            <div className="space-y-3">
                {data?.map((l: Leave) => (
                    <div key={l.id} className="border rounded bg-white p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <div className="font-medium">{l.employeeName || 'Employee'} — {l.type}</div>
                                <div className="text-sm text-gray-600">
                                    {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    className="border rounded px-2 py-1 text-sm"
                                    placeholder="Comment (optional)"
                                    value={commentById[l.id] || ''}
                                    onChange={(e) => setCommentById({ ...commentById, [l.id]: e.target.value })}
                                />
                                <button disabled={isPending} className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => mutateAsync({ id: l.id, decision: 'APPROVED', comment: commentById[l.id] })}>Approve</button>
                                <button disabled={isPending} className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => mutateAsync({ id: l.id, decision: 'REJECTED', comment: commentById[l.id] })}>Reject</button>
                            </div>
                        </div>
                    </div>
                ))}
                {data?.length === 0 && <div className="text-gray-600">No pending requests.</div>}
            </div>
        </div>
    )
}