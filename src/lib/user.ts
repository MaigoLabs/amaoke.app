import type { UserData } from "../shared/types";

/**
 * Save user data to the server.
 * @param data Partial user data to update
 */
export async function saveUserData(data: Partial<UserData>) {
    await fetch('/api/user', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
