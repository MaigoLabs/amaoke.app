import type { ResultDocument, UserData } from "../shared/types";


export async function post(endpoint: string, data: any) {
    return await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async res => {
        if (res.status >= 400) throw new Error(`错误 ${res.status}：${await res.text()}`)
        return res.json()
    }).catch(e => {
        console.error(e)
        throw e
    })
}

export const API = {
    post,
    saveUserData: async (data: Partial<UserData>) => await post('/api/user', data),
    saveResult: async (data: Omit<ResultDocument, "_id" | "createdAt">) => await post('/api/result', data),

    netease: {
        startImport: async (link: string) => await post('/api/import/netease/start', { link }),
        checkProgress: async (id: string) => await post('/api/import/netease/progress', { id })
    }
}
