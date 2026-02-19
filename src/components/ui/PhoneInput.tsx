"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, Phone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ── Country data ─────────────────────────────────────────────

export interface Country {
  code: string;   // ISO 3166-1 alpha-2
  name: string;
  dial: string;   // e.g. "+212"
  flag: string;   // emoji
}

// Top countries for CMN airport travelers — shown first in "Populares"
const PRIORITY_CODES = ["MA", "FR", "ES", "DZ", "TN", "BE", "NL", "DE", "IT", "GB", "AE", "SA", "US", "CA"];

export const COUNTRIES: Country[] = [
  // ── Africa ───────────────────────────────────────────────
  { code: "DZ", name: "Algérie",              dial: "+213", flag: "🇩🇿" },
  { code: "AO", name: "Angola",               dial: "+244", flag: "🇦🇴" },
  { code: "BJ", name: "Bénin",                dial: "+229", flag: "🇧🇯" },
  { code: "BW", name: "Botswana",             dial: "+267", flag: "🇧🇼" },
  { code: "BF", name: "Burkina Faso",         dial: "+226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi",              dial: "+257", flag: "🇧🇮" },
  { code: "CV", name: "Cabo Verde",           dial: "+238", flag: "🇨🇻" },
  { code: "CM", name: "Cameroun",             dial: "+237", flag: "🇨🇲" },
  { code: "CF", name: "Centrafrique",         dial: "+236", flag: "🇨🇫" },
  { code: "TD", name: "Tchad",                dial: "+235", flag: "🇹🇩" },
  { code: "KM", name: "Comores",              dial: "+269", flag: "🇰🇲" },
  { code: "CG", name: "Congo",                dial: "+242", flag: "🇨🇬" },
  { code: "CD", name: "Congo (RDC)",          dial: "+243", flag: "🇨🇩" },
  { code: "CI", name: "Côte d'Ivoire",        dial: "+225", flag: "🇨🇮" },
  { code: "DJ", name: "Djibouti",             dial: "+253", flag: "🇩🇯" },
  { code: "EG", name: "Égypte",               dial: "+20",  flag: "🇪🇬" },
  { code: "GQ", name: "Guinée équatoriale",   dial: "+240", flag: "🇬🇶" },
  { code: "ER", name: "Érythrée",             dial: "+291", flag: "🇪🇷" },
  { code: "SZ", name: "Eswatini",             dial: "+268", flag: "🇸🇿" },
  { code: "ET", name: "Éthiopie",             dial: "+251", flag: "🇪🇹" },
  { code: "GA", name: "Gabon",                dial: "+241", flag: "🇬🇦" },
  { code: "GM", name: "Gambie",               dial: "+220", flag: "🇬🇲" },
  { code: "GH", name: "Ghana",                dial: "+233", flag: "🇬🇭" },
  { code: "GN", name: "Guinée",               dial: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau",        dial: "+245", flag: "🇬🇼" },
  { code: "KE", name: "Kenya",                dial: "+254", flag: "🇰🇪" },
  { code: "LS", name: "Lesotho",              dial: "+266", flag: "🇱🇸" },
  { code: "LR", name: "Libéria",              dial: "+231", flag: "🇱🇷" },
  { code: "LY", name: "Libye",                dial: "+218", flag: "🇱🇾" },
  { code: "MG", name: "Madagascar",           dial: "+261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi",               dial: "+265", flag: "🇲🇼" },
  { code: "ML", name: "Mali",                 dial: "+223", flag: "🇲🇱" },
  { code: "MR", name: "Mauritanie",           dial: "+222", flag: "🇲🇷" },
  { code: "MU", name: "Maurice",              dial: "+230", flag: "🇲🇺" },
  { code: "YT", name: "Mayotte",              dial: "+262", flag: "🇾🇹" },
  { code: "MA", name: "Maroc",                dial: "+212", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique",           dial: "+258", flag: "🇲🇿" },
  { code: "NA", name: "Namibie",              dial: "+264", flag: "🇳🇦" },
  { code: "NE", name: "Niger",                dial: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria",              dial: "+234", flag: "🇳🇬" },
  { code: "RW", name: "Rwanda",               dial: "+250", flag: "🇷🇼" },
  { code: "ST", name: "São Tomé-et-Príncipe", dial: "+239", flag: "🇸🇹" },
  { code: "SN", name: "Sénégal",              dial: "+221", flag: "🇸🇳" },
  { code: "SC", name: "Seychelles",           dial: "+248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone",         dial: "+232", flag: "🇸🇱" },
  { code: "SO", name: "Somalie",              dial: "+252", flag: "🇸🇴" },
  { code: "ZA", name: "Afrique du Sud",       dial: "+27",  flag: "🇿🇦" },
  { code: "SS", name: "Soudan du Sud",        dial: "+211", flag: "🇸🇸" },
  { code: "SD", name: "Soudan",               dial: "+249", flag: "🇸🇩" },
  { code: "TZ", name: "Tanzanie",             dial: "+255", flag: "🇹🇿" },
  { code: "TG", name: "Togo",                 dial: "+228", flag: "🇹🇬" },
  { code: "TN", name: "Tunisie",              dial: "+216", flag: "🇹🇳" },
  { code: "UG", name: "Ouganda",              dial: "+256", flag: "🇺🇬" },
  { code: "EH", name: "Sahara occidental",    dial: "+212", flag: "🇪🇭" },
  { code: "ZM", name: "Zambie",               dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe",             dial: "+263", flag: "🇿🇼" },
  // ── Americas ─────────────────────────────────────────────
  { code: "AG", name: "Antigua-et-Barbuda",   dial: "+1268",flag: "🇦🇬" },
  { code: "AR", name: "Argentine",            dial: "+54",  flag: "🇦🇷" },
  { code: "BS", name: "Bahamas",              dial: "+1242",flag: "🇧🇸" },
  { code: "BB", name: "Barbade",              dial: "+1246",flag: "🇧🇧" },
  { code: "BZ", name: "Belize",               dial: "+501", flag: "🇧🇿" },
  { code: "BO", name: "Bolivie",              dial: "+591", flag: "🇧🇴" },
  { code: "BR", name: "Brésil",               dial: "+55",  flag: "🇧🇷" },
  { code: "CA", name: "Canada",               dial: "+1",   flag: "🇨🇦" },
  { code: "CL", name: "Chili",                dial: "+56",  flag: "🇨🇱" },
  { code: "CO", name: "Colombie",             dial: "+57",  flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica",           dial: "+506", flag: "🇨🇷" },
  { code: "CU", name: "Cuba",                 dial: "+53",  flag: "🇨🇺" },
  { code: "DM", name: "Dominique",            dial: "+1767",flag: "🇩🇲" },
  { code: "DO", name: "Rép. dominicaine",     dial: "+1809",flag: "🇩🇴" },
  { code: "EC", name: "Équateur",             dial: "+593", flag: "🇪🇨" },
  { code: "SV", name: "Salvador",             dial: "+503", flag: "🇸🇻" },
  { code: "GD", name: "Grenade",              dial: "+1473",flag: "🇬🇩" },
  { code: "GT", name: "Guatemala",            dial: "+502", flag: "🇬🇹" },
  { code: "GY", name: "Guyana",               dial: "+592", flag: "🇬🇾" },
  { code: "HT", name: "Haïti",                dial: "+509", flag: "🇭🇹" },
  { code: "HN", name: "Honduras",             dial: "+504", flag: "🇭🇳" },
  { code: "JM", name: "Jamaïque",             dial: "+1876",flag: "🇯🇲" },
  { code: "MX", name: "Mexique",              dial: "+52",  flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua",            dial: "+505", flag: "🇳🇮" },
  { code: "PA", name: "Panama",               dial: "+507", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay",             dial: "+595", flag: "🇵🇾" },
  { code: "PE", name: "Pérou",                dial: "+51",  flag: "🇵🇪" },
  { code: "KN", name: "Saint-Kitts",          dial: "+1869",flag: "🇰🇳" },
  { code: "LC", name: "Sainte-Lucie",         dial: "+1758",flag: "🇱🇨" },
  { code: "VC", name: "Saint-Vincent",        dial: "+1784",flag: "🇻🇨" },
  { code: "SR", name: "Suriname",             dial: "+597", flag: "🇸🇷" },
  { code: "TT", name: "Trinité-et-Tobago",    dial: "+1868",flag: "🇹🇹" },
  { code: "US", name: "États-Unis",           dial: "+1",   flag: "🇺🇸" },
  { code: "UY", name: "Uruguay",              dial: "+598", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela",            dial: "+58",  flag: "🇻🇪" },
  // ── Asia ─────────────────────────────────────────────────
  { code: "AF", name: "Afghanistan",          dial: "+93",  flag: "🇦🇫" },
  { code: "AM", name: "Arménie",              dial: "+374", flag: "🇦🇲" },
  { code: "AZ", name: "Azerbaïdjan",          dial: "+994", flag: "🇦🇿" },
  { code: "BH", name: "Bahreïn",              dial: "+973", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh",           dial: "+880", flag: "🇧🇩" },
  { code: "BT", name: "Bhoutan",              dial: "+975", flag: "🇧🇹" },
  { code: "BN", name: "Brunei",               dial: "+673", flag: "🇧🇳" },
  { code: "KH", name: "Cambodge",             dial: "+855", flag: "🇰🇭" },
  { code: "CN", name: "Chine",                dial: "+86",  flag: "🇨🇳" },
  { code: "CY", name: "Chypre",               dial: "+357", flag: "🇨🇾" },
  { code: "GE", name: "Géorgie",              dial: "+995", flag: "🇬🇪" },
  { code: "IN", name: "Inde",                 dial: "+91",  flag: "🇮🇳" },
  { code: "ID", name: "Indonésie",            dial: "+62",  flag: "🇮🇩" },
  { code: "IR", name: "Iran",                 dial: "+98",  flag: "🇮🇷" },
  { code: "IQ", name: "Irak",                 dial: "+964", flag: "🇮🇶" },
  { code: "IL", name: "Israël",               dial: "+972", flag: "🇮🇱" },
  { code: "JP", name: "Japon",                dial: "+81",  flag: "🇯🇵" },
  { code: "JO", name: "Jordanie",             dial: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan",           dial: "+7",   flag: "🇰🇿" },
  { code: "KP", name: "Corée du Nord",        dial: "+850", flag: "🇰🇵" },
  { code: "KR", name: "Corée du Sud",         dial: "+82",  flag: "🇰🇷" },
  { code: "KW", name: "Koweït",               dial: "+965", flag: "🇰🇼" },
  { code: "KG", name: "Kirghizistan",         dial: "+996", flag: "🇰🇬" },
  { code: "LA", name: "Laos",                 dial: "+856", flag: "🇱🇦" },
  { code: "LB", name: "Liban",                dial: "+961", flag: "🇱🇧" },
  { code: "MY", name: "Malaisie",             dial: "+60",  flag: "🇲🇾" },
  { code: "MV", name: "Maldives",             dial: "+960", flag: "🇲🇻" },
  { code: "MN", name: "Mongolie",             dial: "+976", flag: "🇲🇳" },
  { code: "MM", name: "Myanmar",              dial: "+95",  flag: "🇲🇲" },
  { code: "NP", name: "Népal",                dial: "+977", flag: "🇳🇵" },
  { code: "OM", name: "Oman",                 dial: "+968", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan",             dial: "+92",  flag: "🇵🇰" },
  { code: "PS", name: "Palestine",            dial: "+970", flag: "🇵🇸" },
  { code: "PH", name: "Philippines",          dial: "+63",  flag: "🇵🇭" },
  { code: "QA", name: "Qatar",                dial: "+974", flag: "🇶🇦" },
  { code: "SA", name: "Arabie Saoudite",      dial: "+966", flag: "🇸🇦" },
  { code: "SG", name: "Singapour",            dial: "+65",  flag: "🇸🇬" },
  { code: "LK", name: "Sri Lanka",            dial: "+94",  flag: "🇱🇰" },
  { code: "SY", name: "Syrie",                dial: "+963", flag: "🇸🇾" },
  { code: "TW", name: "Taïwan",               dial: "+886", flag: "🇹🇼" },
  { code: "TJ", name: "Tadjikistan",          dial: "+992", flag: "🇹🇯" },
  { code: "TH", name: "Thaïlande",            dial: "+66",  flag: "🇹🇭" },
  { code: "TL", name: "Timor oriental",       dial: "+670", flag: "🇹🇱" },
  { code: "TR", name: "Türkiye",              dial: "+90",  flag: "🇹🇷" },
  { code: "TM", name: "Turkménistan",         dial: "+993", flag: "🇹🇲" },
  { code: "AE", name: "Émirats arabes unis",  dial: "+971", flag: "🇦🇪" },
  { code: "UZ", name: "Ouzbékistan",          dial: "+998", flag: "🇺🇿" },
  { code: "VN", name: "Viêt Nam",             dial: "+84",  flag: "🇻🇳" },
  { code: "YE", name: "Yémen",                dial: "+967", flag: "🇾🇪" },
  // ── Europe ───────────────────────────────────────────────
  { code: "AL", name: "Albanie",              dial: "+355", flag: "🇦🇱" },
  { code: "AD", name: "Andorre",              dial: "+376", flag: "🇦🇩" },
  { code: "AT", name: "Autriche",             dial: "+43",  flag: "🇦🇹" },
  { code: "BY", name: "Biélorussie",          dial: "+375", flag: "🇧🇾" },
  { code: "BE", name: "Belgique",             dial: "+32",  flag: "🇧🇪" },
  { code: "BA", name: "Bosnie-Herzégovine",   dial: "+387", flag: "🇧🇦" },
  { code: "BG", name: "Bulgarie",             dial: "+359", flag: "🇧🇬" },
  { code: "HR", name: "Croatie",              dial: "+385", flag: "🇭🇷" },
  { code: "CZ", name: "Tchéquie",             dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Danemark",             dial: "+45",  flag: "🇩🇰" },
  { code: "EE", name: "Estonie",              dial: "+372", flag: "🇪🇪" },
  { code: "FI", name: "Finlande",             dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France",               dial: "+33",  flag: "🇫🇷" },
  { code: "DE", name: "Allemagne",            dial: "+49",  flag: "🇩🇪" },
  { code: "GR", name: "Grèce",                dial: "+30",  flag: "🇬🇷" },
  { code: "HU", name: "Hongrie",              dial: "+36",  flag: "🇭🇺" },
  { code: "IS", name: "Islande",              dial: "+354", flag: "🇮🇸" },
  { code: "IE", name: "Irlande",              dial: "+353", flag: "🇮🇪" },
  { code: "IT", name: "Italie",               dial: "+39",  flag: "🇮🇹" },
  { code: "XK", name: "Kosovo",               dial: "+383", flag: "🇽🇰" },
  { code: "LV", name: "Lettonie",             dial: "+371", flag: "🇱🇻" },
  { code: "LI", name: "Liechtenstein",        dial: "+423", flag: "🇱🇮" },
  { code: "LT", name: "Lituanie",             dial: "+370", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg",           dial: "+352", flag: "🇱🇺" },
  { code: "MT", name: "Malte",                dial: "+356", flag: "🇲🇹" },
  { code: "MD", name: "Moldavie",             dial: "+373", flag: "🇲🇩" },
  { code: "MC", name: "Monaco",               dial: "+377", flag: "🇲🇨" },
  { code: "ME", name: "Monténégro",           dial: "+382", flag: "🇲🇪" },
  { code: "NL", name: "Pays-Bas",             dial: "+31",  flag: "🇳🇱" },
  { code: "MK", name: "Macédoine du Nord",    dial: "+389", flag: "🇲🇰" },
  { code: "NO", name: "Norvège",              dial: "+47",  flag: "🇳🇴" },
  { code: "PL", name: "Pologne",              dial: "+48",  flag: "🇵🇱" },
  { code: "PT", name: "Portugal",             dial: "+351", flag: "🇵🇹" },
  { code: "RO", name: "Roumanie",             dial: "+40",  flag: "🇷🇴" },
  { code: "RU", name: "Russie",               dial: "+7",   flag: "🇷🇺" },
  { code: "SM", name: "Saint-Marin",          dial: "+378", flag: "🇸🇲" },
  { code: "RS", name: "Serbie",               dial: "+381", flag: "🇷🇸" },
  { code: "SK", name: "Slovaquie",            dial: "+421", flag: "🇸🇰" },
  { code: "SI", name: "Slovénie",             dial: "+386", flag: "🇸🇮" },
  { code: "ES", name: "Espagne",              dial: "+34",  flag: "🇪🇸" },
  { code: "SE", name: "Suède",                dial: "+46",  flag: "🇸🇪" },
  { code: "CH", name: "Suisse",               dial: "+41",  flag: "🇨🇭" },
  { code: "UA", name: "Ukraine",              dial: "+380", flag: "🇺🇦" },
  { code: "GB", name: "Royaume-Uni",          dial: "+44",  flag: "🇬🇧" },
  { code: "VA", name: "Vatican",              dial: "+39",  flag: "🇻🇦" },
  // ── Oceania ──────────────────────────────────────────────
  { code: "AU", name: "Australie",            dial: "+61",  flag: "🇦🇺" },
  { code: "FJ", name: "Fidji",                dial: "+679", flag: "🇫🇯" },
  { code: "KI", name: "Kiribati",             dial: "+686", flag: "🇰🇮" },
  { code: "MH", name: "Marshall",             dial: "+692", flag: "🇲🇭" },
  { code: "FM", name: "Micronésie",           dial: "+691", flag: "🇫🇲" },
  { code: "NR", name: "Nauru",                dial: "+674", flag: "🇳🇷" },
  { code: "NZ", name: "Nouvelle-Zélande",     dial: "+64",  flag: "🇳🇿" },
  { code: "PW", name: "Palaos",               dial: "+680", flag: "🇵🇼" },
  { code: "PG", name: "Papouasie",            dial: "+675", flag: "🇵🇬" },
  { code: "WS", name: "Samoa",                dial: "+685", flag: "🇼🇸" },
  { code: "SB", name: "Salomon",              dial: "+677", flag: "🇸🇧" },
  { code: "TO", name: "Tonga",                dial: "+676", flag: "🇹🇴" },
  { code: "TV", name: "Tuvalu",               dial: "+688", flag: "🇹🇻" },
  { code: "VU", name: "Vanuatu",              dial: "+678", flag: "🇻🇺" },
];

const PRIORITY = new Set(PRIORITY_CODES);
const popular = COUNTRIES.filter((c) => PRIORITY.has(c.code));
const rest     = COUNTRIES.filter((c) => !PRIORITY.has(c.code));

// ── Props ────────────────────────────────────────────────────

interface Props {
  value: string;            // full phone: "+212612345678"
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}

// ── Component ────────────────────────────────────────────────

export default function PhoneInput({
  value,
  onChange,
  label = "Teléfono / WhatsApp",
  placeholder = "6XX XXX XXX",
  required = false,
  autoFocus = false,
}: Props) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // default Morocco
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // sync outward value on mount (if pre-filled)
  useEffect(() => {
    if (value && value !== `${country.dial}${number}`) {
      const matched = COUNTRIES.find((c) => value.startsWith(c.dial));
      if (matched) {
        setCountry(matched);
        setNumber(value.slice(matched.dial.length));
      } else {
        setNumber(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // push combined value upward
  useEffect(() => {
    onChange(`${country.dial}${number}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, number]);

  // close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [open]);

  // focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const selectCountry = useCallback((c: Country) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const filtered = query.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.dial.includes(query) ||
          c.code.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-brand-dark flex items-center gap-1.5">
          <Phone size={14} className="text-brand-muted" />
          {label}
        </label>
      )}

      {/* Wrapper — position relative so dropdown can be absolute inside */}
      <div ref={wrapRef} className="relative">
        {/* ── Input row ──────────────────────────────────── */}
        <div
          className={`flex items-stretch rounded-2xl border bg-white transition-all duration-200
            ${open
              ? "border-brand-primary ring-2 ring-brand-primary/20 shadow-lg shadow-blue-500/5"
              : "border-slate-200 hover:border-slate-300 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20"
            }`}
        >
          {/* Country selector button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1.5 pl-3 pr-2.5 py-3 shrink-0 border-r rounded-l-2xl transition-colors
              ${open ? "border-brand-primary/30 bg-blue-50/40" : "border-slate-100 hover:bg-slate-50"}`}
          >
            <span className="text-xl leading-none">{country.flag}</span>
            <span className="text-sm font-bold text-brand-dark tabular-nums">{country.dial}</span>
            <ChevronDown
              size={14}
              className={`text-brand-muted transition-transform duration-200 ${open ? "rotate-180 text-brand-primary" : ""}`}
            />
          </button>

          {/* Number input */}
          <input
            ref={inputRef}
            type="tel"
            required={required}
            autoFocus={autoFocus}
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d\s\-]/g, ""))}
            placeholder={placeholder}
            autoComplete="tel-national"
            className="flex-1 pl-3 pr-4 py-3 bg-transparent text-sm text-brand-dark placeholder:text-slate-400
                       focus:outline-none min-w-0 rounded-r-2xl"
          />
        </div>

        {/* ── Dropdown ─────────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-[calc(100%+6px)] w-full z-[200] bg-white rounded-2xl border border-slate-200
                         shadow-2xl shadow-black/10 overflow-hidden"
            >
              {/* Search */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar país o código..."
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200
                               focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30
                               placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto max-h-56 overscroll-contain">
                {filtered ? (
                  filtered.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Sin resultados</p>
                  ) : (
                    <CountryGroup countries={filtered} selected={country} onSelect={selectCountry} />
                  )
                ) : (
                  <>
                    <SectionLabel label="Populares" />
                    <CountryGroup countries={popular} selected={country} onSelect={selectCountry} />
                    <SectionLabel label="Todos" />
                    <CountryGroup countries={rest} selected={country} onSelect={selectCountry} />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </p>
  );
}

function CountryGroup({
  countries,
  selected,
  onSelect,
}: {
  countries: Country[];
  selected: Country;
  onSelect: (c: Country) => void;
}) {
  return (
    <>
      {countries.map((c) => {
        const isSelected = c.code === selected.code;
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => onSelect(c)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left
              ${isSelected
                ? "bg-blue-50 text-brand-primary"
                : "text-brand-dark hover:bg-slate-50"
              }`}
          >
            <span className="text-lg leading-none w-6 text-center">{c.flag}</span>
            <span className="flex-1 font-medium truncate">{c.name}</span>
            <span
              className={`tabular-nums text-xs font-bold shrink-0 ${
                isSelected ? "text-brand-primary" : "text-slate-400"
              }`}
            >
              {c.dial}
            </span>
          </button>
        );
      })}
    </>
  );
}
