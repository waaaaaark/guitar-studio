import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!
const SESSION_COOKIE = 'guitar_admin_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production'

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === SESSION_SECRET
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export { SESSION_COOKIE, SESSION_SECRET }
