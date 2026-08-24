export const getTodayDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

export const isTodayOrFutureDate = (value: string) => {
  const date = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= getTodayDateKey();
};

export const timeToMinutes = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "am") hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

export const isAllowedEventTime = (start: string, end: string) => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return (
    startMinutes !== null &&
    endMinutes !== null &&
    startMinutes >= 9 * 60 &&
    endMinutes <= 20 * 60 &&
    endMinutes >= startMinutes
  );
};
