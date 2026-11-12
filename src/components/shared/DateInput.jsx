import { useRef, useState } from "react";

function parseIsoToParts(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { day: "", month: "", year: "" };
  }
  const [year, month, day] = iso.split("-");
  return { day, month, year };
}

function isValidCalendarDate(year, month, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

function formatIso(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function DateInput({ id, value, min, onChange, label }) {
  const [parts, setParts] = useState(() => parseIsoToParts(value));
  const nativePickerRef = useRef(null);

  const emitFromParts = (nextParts) => {
    const hasAnyInput = Boolean(
      nextParts.day || nextParts.month || nextParts.year,
    );
    if (!hasAnyInput) {
      onChange("", false);
      return;
    }

    if (
      nextParts.day.length >= 1 &&
      nextParts.month.length >= 1 &&
      nextParts.year.length === 4
    ) {
      const y = Number(nextParts.year);
      const m = Number(nextParts.month);
      const d = Number(nextParts.day);
      if (isValidCalendarDate(y, m, d)) {
        onChange(formatIso(y, m, d), false);
        return;
      }
      onChange("", true);
      return;
    }

    onChange("", false);
  };

  const handleDayChange = (event) => {
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    if (digits.length === 2 && (digits === "00" || Number(digits) > 31)) {
      return;
    }
    const nextParts = { ...parts, day: digits };
    setParts(nextParts);
    emitFromParts(nextParts);
  };

  const handleMonthChange = (event) => {
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    if (digits.length === 2 && (digits === "00" || Number(digits) > 12)) {
      return;
    }
    const nextParts = { ...parts, month: digits };
    setParts(nextParts);
    emitFromParts(nextParts);
  };

  const handleYearChange = (event) => {
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    const nextParts = { ...parts, year: digits };
    setParts(nextParts);
    emitFromParts(nextParts);
  };

  const handleDayBlur = () => {
    if (parts.day === "0") {
      const nextParts = { ...parts, day: "" };
      setParts(nextParts);
      emitFromParts(nextParts);
      return;
    }
    if (parts.day.length === 1) {
      const nextParts = { ...parts, day: parts.day.padStart(2, "0") };
      setParts(nextParts);
      emitFromParts(nextParts);
    }
  };

  const handleMonthBlur = () => {
    if (parts.month === "0") {
      const nextParts = { ...parts, month: "" };
      setParts(nextParts);
      emitFromParts(nextParts);
      return;
    }
    if (parts.month.length === 1) {
      const nextParts = { ...parts, month: parts.month.padStart(2, "0") };
      setParts(nextParts);
      emitFromParts(nextParts);
    }
  };

  const handleNativeChange = (event) => {
    const iso = event.target.value;
    setParts(parseIsoToParts(iso));
    onChange(iso, false);
  };

  const openNativePicker = () => {
    const input = nativePickerRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  return (
    <div className="date-input-box">
      <div className="date-segments">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="dd"
          aria-label={`${label} - Ngày (01-31)`}
          className="date-segment date-segment-short"
          value={parts.day}
          onChange={handleDayChange}
          onBlur={handleDayBlur}
        />
        <span className="date-separator" aria-hidden="true">
          /
        </span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="mm"
          aria-label={`${label} - Tháng (01-12)`}
          className="date-segment date-segment-short"
          value={parts.month}
          onChange={handleMonthChange}
          onBlur={handleMonthBlur}
        />
        <span className="date-separator" aria-hidden="true">
          /
        </span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="yyyy"
          aria-label={`${label} - Năm`}
          className="date-segment date-segment-year"
          value={parts.year}
          onChange={handleYearChange}
        />
      </div>

      <div className="date-picker-trigger">
        <button
          type="button"
          className="date-picker-btn"
          aria-label={`Mở lịch chọn ${label.toLowerCase()}`}
          onClick={openNativePicker}
          tabIndex={-1}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={nativePickerRef}
          type="date"
          min={min}
          value={value}
          onChange={handleNativeChange}
          className="date-native-input"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

export default DateInput;

