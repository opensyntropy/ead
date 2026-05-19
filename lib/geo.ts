// ISO 3166-1 alpha-2 country codes classified as Global North (high-income)
const GN_COUNTRIES = new Set([
  'US','CA','GB','DE','FR','IT','ES','NL','BE','AT','CH','SE','NO','DK','FI',
  'IE','PT','LU','AU','NZ','JP','KR','SG','IL','HK','TW',
  'AE','SA','QA','KW','BH','OM','MO',
])

// Countries where Spanish is the primary language
const SPANISH_COUNTRIES = new Set([
  'MX','CO','AR','CL','PE','VE','EC','GT','BO','DO','HN','PY','SV','NI','CR',
  'PA','UY','CU','PR','ES','GQ',
])

// Countries where Portuguese is the primary language → redirect to /ebook
// Note: PT (Portugal) is excluded — it uses the /en page with EUR pricing
const PORTUGUESE_COUNTRIES = new Set([
  'BR', // Brasil
  'AO', // Angola
  'MZ', // Moçambique
  'CV', // Cabo Verde
  'GW', // Guiné-Bissau
  'ST', // São Tomé e Príncipe
  'TL', // Timor-Leste
])

// Eurozone countries — charge in EUR via Stripe
const EUROZONE_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT',
  'NL','PT','SK','SI','ES',
])

export type PriceTier = 'gn' | 'gs'
export type PageLocale = 'en' | 'es' | 'pt'
export type StripeCurrency = 'usd' | 'eur'

export function getCountryTier(countryCode: string | null | undefined): PriceTier {
  if (!countryCode) return 'gn'
  return GN_COUNTRIES.has(countryCode.toUpperCase()) ? 'gn' : 'gs'
}

export function getCountryLocale(countryCode: string | null | undefined): PageLocale {
  if (!countryCode) return 'en'
  const code = countryCode.toUpperCase()
  if (PORTUGUESE_COUNTRIES.has(code)) return 'pt'
  if (SPANISH_COUNTRIES.has(code)) return 'es'
  return 'en'
}

export function getCountryCurrency(countryCode: string | null | undefined): StripeCurrency {
  if (!countryCode) return 'usd'
  return EUROZONE_COUNTRIES.has(countryCode.toUpperCase()) ? 'eur' : 'usd'
}

export const TIER_LABELS = {
  gn: 'Global North',
  gs: 'Global South',
}
