import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  displayName: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' })
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>

