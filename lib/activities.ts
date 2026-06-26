// Nguong thoi tiet cho tung loai hoat dong. Day la heuristic hop ly, KHONG phai
// chuan an toan/phap ly. Service ban phan "quyet dinh", agent luoi tu tinh nguong
// nay tu so lieu tho cua Open-Meteo.

export type Thresholds = {
  maxWind?: number; // m/s
  minWind?: number; // m/s (phun thuoc can gio nhe, qua lang -> drift do nghich nhiet)
  maxGust?: number; // m/s
  maxPrecip?: number; // mm trong gio
  maxPrecipProb?: number; // %
  minVisibility?: number; // m
  minTemp?: number; // C
  maxTemp?: number; // C
};

export type HourReading = {
  wind: number;
  gust: number;
  precip: number;
  precipProb: number;
  visibility: number;
  temp: number;
};

export const ACTIVITIES: Record<
  string,
  { label: string; thresholds: Thresholds; notes: string }
> = {
  drone: {
    label: "Drone / UAV flight",
    thresholds: {
      maxWind: 8,
      maxGust: 10,
      maxPrecip: 0,
      maxPrecipProb: 30,
      minVisibility: 5000,
    },
    notes:
      "Consumer/prosumer drone limits. Not a substitute for aviation rules or manufacturer wind limits.",
  },
  agriculture_spraying: {
    label: "Agricultural spraying",
    thresholds: {
      minWind: 1,
      maxWind: 4.5,
      maxGust: 7,
      maxPrecip: 0,
      maxPrecipProb: 30,
      minTemp: 5,
      maxTemp: 28,
    },
    notes:
      "Light steady wind, no rain, moderate temperature to reduce spray drift and evaporation.",
  },
  outdoor_work: {
    label: "Outdoor work / construction",
    thresholds: {
      maxGust: 15,
      maxPrecip: 0.2,
      maxPrecipProb: 50,
      minTemp: 2,
      maxTemp: 35,
    },
    notes:
      "Dry, safe wind, workable temperature. Flags extreme heat/cold and high gusts.",
  },
};

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Tra ve {ok, fails}. fails la danh sach ly do KHONG dat (de agent biet vi sao).
export function evaluateHour(t: Thresholds, h: HourReading): {
  ok: boolean;
  fails: string[];
} {
  const fails: string[] = [];

  if (t.maxWind != null && h.wind > t.maxWind)
    fails.push(`wind ${r1(h.wind)} m/s > ${t.maxWind}`);
  if (t.minWind != null && h.wind < t.minWind)
    fails.push(`wind too light ${r1(h.wind)} m/s < ${t.minWind} (drift/inversion risk)`);
  if (t.maxGust != null && h.gust > t.maxGust)
    fails.push(`gusts ${r1(h.gust)} m/s > ${t.maxGust}`);
  if (t.maxPrecip != null && h.precip > t.maxPrecip)
    fails.push(`rain ${r1(h.precip)} mm`);
  if (t.maxPrecipProb != null && h.precipProb > t.maxPrecipProb)
    fails.push(`rain chance ${Math.round(h.precipProb)}%`);
  if (t.minVisibility != null && h.visibility < t.minVisibility)
    fails.push(`visibility ${Math.round(h.visibility)} m < ${t.minVisibility}`);
  if (t.minTemp != null && h.temp < t.minTemp)
    fails.push(`cold ${r1(h.temp)} C`);
  if (t.maxTemp != null && h.temp > t.maxTemp)
    fails.push(`hot ${r1(h.temp)} C`);

  return { ok: fails.length === 0, fails };
}
