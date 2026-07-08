type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface TimeRange {
  open: number; // minutes since midnight
  close: number;
}

const DAY_NAMES: Record<DayIndex, string> = {
  0: "Su",
  1: "Mo",
  2: "Tu",
  3: "We",
  4: "Th",
  5: "Fr",
  6: "Sa",
};

const DAY_FULL: Record<DayIndex, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
};

function parseTime(timeStr: string): number | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function parseDayRange(dayStr: string): DayIndex[] {
  const days: DayIndex[] = [];
  const parts = dayStr.split(",").map((s) => s.trim());
  for (const part of parts) {
    const dashMatch = part.match(/^(\w+)-(\w+)$/);
    if (dashMatch) {
      const startKey = Object.entries(DAY_NAMES).find(([, v]) => v === dashMatch[1])?.[0];
      const endKey = Object.entries(DAY_NAMES).find(([, v]) => v === dashMatch[2])?.[0];
      if (startKey !== undefined && endKey !== undefined) {
        let start = parseInt(startKey);
        const end = parseInt(endKey);
        while (true) {
          days.push(start as DayIndex);
          if (start === end) break;
          start = (start + 1) % 7;
        }
      }
    } else {
      const key = Object.entries(DAY_NAMES).find(([, v]) => v === part)?.[0];
      if (key !== undefined) {
        days.push(parseInt(key) as DayIndex);
      }
    }
  }
  return days;
}

function parseOpeningHours(raw: string): Map<DayIndex, TimeRange[]> | null {
  if (!raw || raw === "24/7") return null;

  const schedule = new Map<DayIndex, TimeRange[]>();
  const segments = raw.split(";").map((s) => s.trim());

  for (const segment of segments) {
    const colonIdx = segment.indexOf(":");
    if (colonIdx === -1) continue;

    const dayPart = segment.substring(0, colonIdx).trim();
    const timePart = segment.substring(colonIdx + 1).trim();

    const days = parseDayRange(dayPart);
    if (days.length === 0) continue;

    const timeRanges: TimeRange[] = [];
    const timeSegments = timePart.split(",").map((s) => s.trim());
    for (const ts of timeSegments) {
      const dashMatch = ts.match(/^(.+)-(.+)$/);
      if (!dashMatch) continue;
      const open = parseTime(dashMatch[1]);
      const close = parseTime(dashMatch[2]);
      if (open === null || close === null) continue;
      timeRanges.push({ open, close });
    }

    if (timeRanges.length > 0) {
      for (const day of days) {
        schedule.set(day, timeRanges);
      }
    }
  }

  return schedule.size > 0 ? schedule : null;
}

export function isOpenNow(openingHours: string | undefined): boolean | null {
  if (!openingHours) return null;
  if (openingHours === "24/7") return true;

  const schedule = parseOpeningHours(openingHours);
  if (!schedule) return null;

  const now = new Date();
  const currentDay = now.getDay() as DayIndex;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const ranges = schedule.get(currentDay);
  if (!ranges || ranges.length === 0) return false;

  return ranges.some((r) => currentMinutes >= r.open && currentMinutes <= r.close);
}

export function formatOpeningHours(openingHours: string | undefined): string {
  if (!openingHours) return "Horario no disponible";
  if (openingHours === "24/7") return "Abierto 24 horas";

  const schedule = parseOpeningHours(openingHours);
  if (!schedule) return openingHours;

  const lines: string[] = [];
  for (const day of [1, 2, 3, 4, 5, 6, 0] as DayIndex[]) {
    const ranges = schedule.get(day);
    if (ranges && ranges.length > 0) {
      const timeStr = ranges
        .map((r) => {
          const oH = Math.floor(r.open / 60);
          const oM = r.open % 60;
          const cH = Math.floor(r.close / 60);
          const cM = r.close % 60;
          return `${oH}:${String(oM).padStart(2, "0")}-${cH}:${String(cM).padStart(2, "0")}`;
        })
        .join(", ");
      lines.push(`${DAY_FULL[day]}: ${timeStr}`);
    }
  }

  return lines.length > 0 ? lines.join("\n") : openingHours;
}

export function getTodaySchedule(openingHours: string | undefined): string {
  if (!openingHours) return "";
  if (openingHours === "24/7") return "24h";

  const schedule = parseOpeningHours(openingHours);
  if (!schedule) return openingHours;

  const now = new Date();
  const currentDay = now.getDay() as DayIndex;
  const ranges = schedule.get(currentDay);

  if (!ranges || ranges.length === 0) return "Cerrado hoy";

  return ranges
    .map((r) => {
      const oH = Math.floor(r.open / 60);
      const oM = r.open % 60;
      const cH = Math.floor(r.close / 60);
      const cM = r.close % 60;
      return `${oH}:${String(oM).padStart(2, "0")}-${cH}:${String(cM).padStart(2, "0")}`;
    })
    .join(", ");
}
