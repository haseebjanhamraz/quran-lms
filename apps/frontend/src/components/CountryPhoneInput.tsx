'use client';

import React from 'react';
import { PhoneInput, PhoneInputProps } from './ui/phone-input';
import { CountryInfo } from '@/utils/countries';

export interface CountryPhoneInputProps {
  value?: string;
  phoneCode?: string;
  countryCode?: string;
  onChange: (fullNumber: string, phoneCode: string, localNumber: string, country?: CountryInfo) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CountryPhoneInput({
  value = '',
  phoneCode = '',
  countryCode = '',
  onChange,
  label,
  placeholder = '300 1234567',
  className = '',
  disabled = false,
  required = false,
}: CountryPhoneInputProps) {
  return (
    <PhoneInput
      value={value}
      phoneCode={phoneCode}
      countryCode={countryCode}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    />
  );
}

export { PhoneInput };
