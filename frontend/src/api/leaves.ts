import api from '../lib/api'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type Leave = {
    id: string
    type: string
    startDate: string
    endDate: string
    reason?: string
    status: LeaveStatus
    employeeName?: string
}

export async function getMyLeaves() {
    const { data } = await api.get<Leave[]>('/leaves', { params: { mine: true } })
    return data
}

export async function createLeave(payload: { type: string; startDate: string; endDate: string; reason?: string }) {
    const { data } = await api.post<Leave>('/leaves', payload)
    return data
}

export async function cancelLeave(id: string) {
    const { data } = await api.patch<Leave>(`/leaves/${id}/cancel`)
    return data
}

export async function getPendingApprovals() {
    const { data } = await api.get<Leave[]>('/approvals/pending')
    return data
}

export async function decideLeave(id: string, decision: 'APPROVED' | 'REJECTED', comment?: string) {
    const { data } = await api.post<Leave>(`/approvals/${id}/decision`, { decision, comment })
    return data
}