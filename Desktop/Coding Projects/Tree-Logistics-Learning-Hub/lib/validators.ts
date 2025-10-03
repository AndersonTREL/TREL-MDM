import { z } from 'zod'
import { isValidIBAN, isValidBIC } from 'ibantools'

// IBAN validator
export const ibanSchema = z.string().refine(
  (val) => isValidIBAN(val),
  { message: 'Invalid IBAN' }
)

// BIC/SWIFT validator
export const bicSchema = z.string().refine(
  (val) => isValidBIC(val),
  { message: 'Invalid BIC/SWIFT code' }
)

// German Tax ID validator (11 digits)
export const taxIdSchema = z.string().regex(
  /^\d{11}$/,
  { message: 'Tax ID must be exactly 11 digits' }
)

// Social security number (basic pattern)
export const ssnSchema = z.string().min(5).max(20)

// Phone number validator
export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  { message: 'Invalid phone number format' }
)

// Age validator (must be 18+)
export const dateOfBirthSchema = z.string().or(z.date()).refine(
  (val) => {
    const date = typeof val === 'string' ? new Date(val) : val
    const age = new Date().getFullYear() - date.getFullYear()
    return age >= 18
  },
  { message: 'Must be at least 18 years old' }
)

// File validation
export const imageFileSchema = z.object({
  name: z.string(),
  type: z.enum(['image/jpeg', 'image/png'], {
    errorMap: () => ({ message: 'Only JPEG and PNG images are allowed' })
  }),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
})

export const pdfOrImageFileSchema = z.object({
  name: z.string(),
  type: z.enum(['image/jpeg', 'image/png', 'application/pdf'], {
    errorMap: () => ({ message: 'Only JPEG, PNG images or PDF are allowed' })
  }),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
})

// Driver profile schema
export const driverProfileSchema = z.object({
  dateOfBirth: dateOfBirthSchema,
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  placeOfBirthDe: z.string().optional(),
  nationality: z.string().min(1, 'Nationality is required'),
  nationalityDe: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  healthInsuranceCompany: z.string().min(1, 'Health insurance company is required'),
  healthInsuranceCompanyDe: z.string().optional(),
  socialSecurityNumber: ssnSchema,
  
  // Tax data
  taxClass: z.enum(['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5', 'CLASS_6']),
  taxIdentificationNumber: taxIdSchema,
  churchAffiliation: z.enum(['NONE', 'ROMAN_CATHOLIC', 'EVANGELICAL', 'OTHER']),
  childAllowance: z.boolean(),
  childFactor: z.enum(['ZERO', 'HALF', 'ONE']),
  otherEmployment: z.boolean(),
  isMainEmployer: z.boolean(),

  // Bank data
  bankName: z.string().min(1, 'Bank name is required'),
  bankNameDe: z.string().optional(),
  iban: ibanSchema,
  accountHolder: z.string().min(1, 'Account holder is required'),
  accountHolderDe: z.string().optional(),
  bic: bicSchema,
})

// Child schema
export const childSchema = z.object({
  name: z.string().min(1, 'Child name is required'),
  dateOfBirth: z.string().or(z.date()),
})

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  twoFactorCode: z.string().optional(),
})

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Course schema
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleDe: z.string().optional(),
  description: z.string().optional(),
  descriptionDe: z.string().optional(),
  pointsReward: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()), // questionId -> optionId
})

