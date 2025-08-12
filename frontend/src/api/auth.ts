import api from '../lib/api'
import type { User } from '../context/AuthContext'

export async function loginRequest(email: string, password: string) {
    const { data } = await api.post<{ accessToken?: string }>('/auth/login', { email, password })
    return data
}

export async function fetchMe() {
    const { data } = await api.get<User>('/auth/me')
    return data
}