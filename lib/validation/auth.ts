import { z } from 'zod'

// Single source of truth for the auth field rules shared by the login and
// signup forms, so a future policy change (e.g. password length) only needs
// to happen in one place.
export const authFields = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}
