import { format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const TIMEZONE = "Australia/Melbourne";

export function formatDate(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy");
}

export function formatDateTime(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy h:mm a");
}

export function formatTime(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "h:mm a");
}

export function formatMoney(value?: number | null, fallback = "$0.00") {
  if (value == null || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export function formatPhone(value?: string | null) {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("04")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return value;
}

export function telHref(value?: string | null) {
  if (!value) return undefined;
  return `tel:${value.replace(/\s/g, "")}`;
}

export function mapsHref(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export function formatAddress(parts: {
  street: string;
  suburb: string;
  state?: string;
  postcode: string;
}) {
  return `${parts.street}, ${parts.suburb} ${parts.state ?? "VIC"} ${parts.postcode}`;
}

export function melbourneNow() {
  return toZonedTime(new Date(), TIMEZONE);
}

export function startOfMelbourneDay(date = new Date()) {
  const zoned = toZonedTime(date, TIMEZONE);
  zoned.setHours(0, 0, 0, 0);
  return zoned;
}

export function formatShortDate(date: Date) {
  return format(toZonedTime(date, TIMEZONE), "EEE d MMM");
}

export function melbourneDayRange(date = new Date()) {
  const zoned = toZonedTime(date, TIMEZONE);
  const startLocal = new Date(zoned);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(startLocal);
  endLocal.setDate(endLocal.getDate() + 1);
  return {
    start: fromZonedTime(startLocal, TIMEZONE),
    end: fromZonedTime(endLocal, TIMEZONE),
  };
}
