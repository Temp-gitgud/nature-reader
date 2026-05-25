import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' })
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' })
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
