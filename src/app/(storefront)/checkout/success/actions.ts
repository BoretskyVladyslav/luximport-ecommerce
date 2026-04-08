'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateProfilePath() {
    revalidatePath('/account/profile')
}
