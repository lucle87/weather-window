// Lay forecast tu Open-Meteo (free, khong key), danh gia tung gio theo activity,
// roi gom cac gio "GO" lien tiep thanh cua so thoi gian tot trong N gio toi.

import { getJson } from "./http";
import { ACTIVITIES, evaluateHour, HourReading } from "./activities";

export type GoodWindow = {
  start: string; // gio local bat dau (ISO local)
  end: string; // gio local ket thuc (gio tot cuoi cung)
  durationHours: number;
  conditions: {
    maxWind: number;
    maxGust: number;
    maxPrecipProb: number;
    minVisibility: number | null;
    tempRange: [number, number];
  };
};

export type WeatherWindowResult = {
  type: "weather_window";
  activity: string;
  activityLabel: string;
  location: {
    lat: number;
    lon: number;
    name?: string;
    country?: string;
    timezone: string;
  };
  horizonHours: number;
  generatedAtLocal: string;
  thresholds: Record<string, number | undefined>;
  currentlyGo: boolean;
  goHours: number;
  windowCount: number;
  windows: GoodWindow[];
  bestWindow: GoodWindow | null;
  summary: string;
  disclaimer: string;
};

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Geocode mot ten dia diem -> lat/lon (Open-Meteo geocoding, free).
export async function geocode(place: string): Promise<{
  lat: number;
  lon: number;
  name: string;
  country?: string;
} | null> {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" +
    encodeURIComponent(place);
  const data = await getJson(url, {}, 8000);
  const r = data?.results?.[0];
  if (!r) return null;
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
}

export async function weatherWindows(
  lat: number,
  lon: number,
  activity: string,
  hours: number,
  place?: { name?: string; country?: string }
): Promise<WeatherWindowResult> {
  const act = ACTIVITIES[activity];
  if (!act) {
    throw new Error(
      "Unknown activity '" +
        activity +
        "'. Supported: " +
        Object.keys(ACTIVITIES).join(", ")
    );
  }
  const H = Math.min(Math.max(Math.round(hours || 48), 1), 72);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,visibility` +
    `&current=temperature_2m&wind_speed_unit=ms&timezone=auto&forecast_days=3`;
  const data = await getJson(url, {}, 9000);

  const hourly = data?.hourly;
  if (!hourly || !Array.isArray(hourly.time)) {
    throw new Error("Open-Meteo returned no hourly data.");
  }

  const times: string[] = hourly.time;
  const nowLocal: string = data?.current?.time || times[0];
  const nowHour = nowLocal.slice(0, 13); // YYYY-MM-DDTHH

  // Tim diem bat dau = gio hien tai (so sanh theo moc gio) tro di.
  let startIdx = times.findIndex((t) => t.slice(0, 13) >= nowHour);
  if (startIdx < 0) startIdx = 0;
  const endIdx = Math.min(startIdx + H, times.length);

  const get = (arr: any[], i: number): number =>
    Array.isArray(arr) && typeof arr[i] === "number" ? arr[i] : NaN;

  type Slot = { time: string; ok: boolean; reading: HourReading };
  const slots: Slot[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    const reading: HourReading = {
      wind: get(hourly.wind_speed_10m, i),
      gust: get(hourly.wind_gusts_10m, i),
      precip: get(hourly.precipitation, i),
      precipProb: get(hourly.precipitation_probability, i),
      visibility: get(hourly.visibility, i),
      temp: get(hourly.temperature_2m, i),
    };
    const { ok } = evaluateHour(act.thresholds, reading);
    slots.push({ time: times[i], ok, reading });
  }

  // Gom cac gio GO lien tiep thanh cua so.
  const windows: GoodWindow[] = [];
  let run: Slot[] = [];
  const flush = () => {
    if (!run.length) return;
    const winds = run.map((s) => s.reading.wind);
    const gusts = run.map((s) => s.reading.gust);
    const probs = run.map((s) => s.reading.precipProb).filter((n) => !isNaN(n));
    const viss = run.map((s) => s.reading.visibility).filter((n) => !isNaN(n));
    const temps = run.map((s) => s.reading.temp).filter((n) => !isNaN(n));
    windows.push({
      start: run[0].time,
      end: run[run.length - 1].time,
      durationHours: run.length,
      conditions: {
        maxWind: r1(Math.max(...winds)),
        maxGust: r1(Math.max(...gusts)),
        maxPrecipProb: probs.length ? Math.round(Math.max(...probs)) : 0,
        minVisibility: viss.length ? Math.round(Math.min(...viss)) : null,
        tempRange: [r1(Math.min(...temps)), r1(Math.max(...temps))],
      },
    });
    run = [];
  };
  for (const s of slots) {
    if (s.ok) run.push(s);
    else flush();
  }
  flush();

  const goHours = slots.filter((s) => s.ok).length;
  const currentlyGo = slots.length > 0 && slots[0].ok;

  // Best window = dai nhat, hoa thi som nhat.
  let bestWindow: GoodWindow | null = null;
  for (const w of windows) {
    if (!bestWindow || w.durationHours > bestWindow.durationHours) bestWindow = w;
  }

  const locName = place?.name;
  const where = locName ? locName : `${lat}, ${lon}`;
  let summary: string;
  if (windows.length === 0) {
    summary = `No good ${act.label.toLowerCase()} window in the next ${H}h at ${where}.`;
  } else {
    summary =
      `${windows.length} good ${act.label.toLowerCase()} window` +
      (windows.length > 1 ? "s" : "") +
      ` in the next ${H}h at ${where}.` +
      (bestWindow
        ? ` Best: ${bestWindow.start} to ${bestWindow.end} (${bestWindow.durationHours}h).`
        : "");
  }

  return {
    type: "weather_window",
    activity,
    activityLabel: act.label,
    location: {
      lat,
      lon,
      name: place?.name,
      country: place?.country,
      timezone: data?.timezone || "auto",
    },
    horizonHours: H,
    generatedAtLocal: nowLocal,
    thresholds: act.thresholds as Record<string, number | undefined>,
    currentlyGo,
    goHours,
    windowCount: windows.length,
    windows,
    bestWindow,
    summary,
    disclaimer:
      "Heuristic decision support from Open-Meteo forecast data. Thresholds are general defaults, not certified safety, aviation, or regulatory guidance. Always apply local rules and your own judgment.",
  };
}
