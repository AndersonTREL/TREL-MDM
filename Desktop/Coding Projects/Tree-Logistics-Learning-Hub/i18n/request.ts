import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'de'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale || 'en'
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
