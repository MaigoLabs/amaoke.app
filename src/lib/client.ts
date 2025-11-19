import type { ResultDocument, UserData } from "../shared/types";


export async function post(endpoint: string, data: any) {
    return await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}

export const API = {
    post,
    saveUserData: async (data: Partial<UserData>) => await post('/api/user', data),
    saveResult: async (data: Omit<ResultDocument, "_id" | "createdAt">) => await post('/api/result', data)
}
