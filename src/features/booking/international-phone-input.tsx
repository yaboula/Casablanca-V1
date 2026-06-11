"use client";

import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { Check, Search } from "lucide-react";

type CountryOption = {
  country: CountryCode;
  name: string;
  dialCode: string;
};

type InternationalPhoneInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  errorId?: string;
  hint?: string;
  disabled?: boolean;
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function InternationalPhoneInput({
  id,
  label,
  value,
  onChange,
  error,
  errorId,
  hint,
  disabled = false,
}: InternationalPhoneInputProps) {
  const options = useMemo(() => buildCountryOptions(), []);
  const initialCountry = findCountryFromValue(value, options) ?? "MA";
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(initialCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption =
    options.find((option) => option.country === selectedCountry) ?? options[0];
  const localNumber = stripDialCode(value, selectedOption.dialCode);
  const filteredOptions = filterOptions(options, query).slice(0, 80);

  function selectCountry(option: CountryOption) {
    setSelectedCountry(option.country);
    setIsOpen(false);
    setQuery("");
    onChange(normalizePhone(option.dialCode, localNumber));
  }

  return (
    <div className="grid gap-2">
      <label
        className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500"
        htmlFor={id}
      >
        {label}
      </label>
      {hint && <p className="text-xs font-light text-neutral-500">{hint}</p>}
      <div className="relative">
        <div
          className={[
            "grid grid-cols-[minmax(8.5rem,11rem)_1fr] overflow-hidden rounded-xl border bg-white transition-all duration-300 focus-within:border-[#1E41FC] focus-within:ring-2 focus-within:ring-[#1E41FC]/10",
            error ? "border-red-500" : "border-neutral-200",
            disabled ? "opacity-60" : "",
          ].join(" ")}
        >
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className="flex min-h-12 items-center justify-between gap-2 border-r border-neutral-200 px-3 text-left text-sm font-semibold text-neutral-900 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--nx-accent)]"
            disabled={disabled}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="truncate">
              {selectedOption.name}
            </span>
            <span className="shrink-0 text-neutral-500">
              +{selectedOption.dialCode}
            </span>
          </button>
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            autoComplete="tel"
            className="min-h-12 w-full bg-white px-4 text-sm text-neutral-900 outline-none disabled:cursor-not-allowed"
            disabled={disabled}
            id={id}
            inputMode="tel"
            placeholder="6XX XXX XXX"
            type="tel"
            value={localNumber}
            onChange={(event) =>
              onChange(normalizePhone(selectedOption.dialCode, event.target.value))
            }
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[1rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,15,15,0.12)]">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              <input
                aria-label="Search country or calling code"
                autoComplete="off"
                className="min-h-10 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search Morocco or +212"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1" role="listbox">
              {filteredOptions.map((option) => {
                const isSelected = option.country === selectedCountry;

                return (
                  <button
                    key={option.country}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--nx-accent)]"
                    onClick={() => selectCountry(option)}
                  >
                    <span className="truncate">{option.name}</span>
                    <span className="flex items-center gap-2 font-semibold text-neutral-950">
                      +{option.dialCode}
                      {isSelected && (
                        <Check className="h-4 w-4 text-[#1E41FC]" />
                      )}
                    </span>
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-neutral-500">
                  No country code found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function buildCountryOptions(): CountryOption[] {
  return getCountries()
    .map((country) => ({
      country,
      name: countryNames.of(country) ?? country,
      dialCode: getCountryCallingCode(country),
    }))
    .sort((left, right) => {
      if (left.country === "MA") return -1;
      if (right.country === "MA") return 1;
      return left.name.localeCompare(right.name);
    });
}

function filterOptions(options: CountryOption[], query: string): CountryOption[] {
  const normalized = query.trim().toLowerCase().replace(/^\+/, "");
  if (!normalized) return options;

  return options.filter(
    (option) =>
      option.name.toLowerCase().includes(normalized) ||
      option.country.toLowerCase().includes(normalized) ||
      option.dialCode.includes(normalized),
  );
}

function findCountryFromValue(
  value: string,
  options: CountryOption[],
): CountryCode | null {
  const digits = value.replace(/[^\d+]/g, "");
  const match = options
    .filter((option) => digits.startsWith(`+${option.dialCode}`))
    .sort((left, right) => right.dialCode.length - left.dialCode.length)[0];

  return match?.country ?? null;
}

function stripDialCode(value: string, dialCode: string): string {
  return value.replace(new RegExp(`^\\+?${dialCode}`), "").trim();
}

function normalizePhone(dialCode: string, localNumber: string): string {
  const localDigits = localNumber.replace(/[^\d]/g, "");
  return localDigits ? `+${dialCode}${localDigits}` : `+${dialCode}`;
}
