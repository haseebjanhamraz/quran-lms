import countriesData from '../assets/data/countries.json';

export interface CountryInfo {
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = countriesData as CountryInfo[];

export function getCountryByCode(code?: string): CountryInfo | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code.toUpperCase() === upper);
}

export function getCountryByName(name?: string): CountryInfo | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return COUNTRIES.find((c) => c.name.toLowerCase() === lower);
}

export function getCountryByPhoneCode(phoneCode?: string): CountryInfo | undefined {
  if (!phoneCode) return undefined;
  const cleaned = phoneCode.trim();
  return COUNTRIES.find((c) => c.phoneCode === cleaned);
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export function getAllCurrencies(): CurrencyInfo[] {
  const map = new Map<string, CurrencyInfo>();
  for (const c of COUNTRIES) {
    if (!map.has(c.currency)) {
      map.set(c.currency, {
        code: c.currency,
        name: `${c.currency} (${c.currencySymbol})`,
        symbol: c.currencySymbol,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function getAllTimezones(): string[] {
  const set = new Set<string>();
  for (const c of COUNTRIES) {
    if (c.timezone) {
      set.add(c.timezone);
    }
  }
  set.add('UTC');
  set.add('GMT');
  set.add('America/New_York');
  set.add('America/Chicago');
  set.add('America/Denver');
  set.add('America/Los_Angeles');
  set.add('Europe/London');
  set.add('Asia/Karachi');
  set.add('Asia/Riyadh');
  set.add('Asia/Dubai');
  return Array.from(set).sort();
}
