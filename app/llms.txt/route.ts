import { PRICE, BASE_URL } from "@/lib/config";
import { ACTIVITIES } from "@/lib/activities";

export const dynamic = "force-dynamic";

export async function GET() {
  const acts = Object.entries(ACTIVITIES)
    .map(([k, v]) => `- ${k}: ${v.label}. ${v.notes}`)
    .join("\n");

  const text = `# Weather Window - go/no-go weather windows for outdoor operations

Give a location and an activity, get the GOOD time windows in the next 48 hours,
with conditions and limiting factors for each. This is a DECISION, not raw weather
numbers. Built on Open-Meteo. Pay-per-call via MPP on Tempo. No API key, no signup.

## Why this exists
Open-Meteo gives free raw forecast numbers. Agents planning weather-sensitive work
(drone flights, crop spraying, outdoor jobs) still have to turn those numbers into
"when is it actually safe to go". Weather Window does that step: it applies per-activity
thresholds and returns the usable time windows directly.

## Activities
${acts}

## Endpoint
POST ${BASE_URL}/api/weather-window   (price: ${PRICE} USD per call, paid via MPP on Tempo)

Request body (JSON):
{ "activity": "drone", "lat": 21.0278, "lon": 105.8342, "hours": 48 }
  - activity : one of the activities above (required)
  - lat, lon : coordinates, OR
  - place    : a place name to geocode (e.g. "Hanoi") if lat/lon not given
  - hours    : horizon, default 48, max 72

Examples:
{ "activity": "drone", "place": "Da Nang" }
{ "activity": "agriculture_spraying", "lat": 10.76, "lon": 106.66 }
{ "activity": "outdoor_work", "place": "London", "hours": 24 }

Response (200, JSON):
{
  "type": "weather_window",
  "activity": "drone",
  "location": { "lat": ..., "lon": ..., "name": "...", "timezone": "..." },
  "horizonHours": 48,
  "currentlyGo": true,
  "goHours": 19,
  "windowCount": 3,
  "windows": [
    {
      "start": "2026-06-25T06:00",
      "end": "2026-06-25T09:00",
      "durationHours": 4,
      "conditions": { "maxWind": 5.1, "maxGust": 7.8, "maxPrecipProb": 10, "minVisibility": 12000, "tempRange": [22.4, 26.1] }
    }
  ],
  "bestWindow": { ... },
  "summary": "3 good drone windows in the next 48h ...",
  "disclaimer": "..."
}

## Payment
Unpaid requests return HTTP 402 with a WWW-Authenticate: Payment challenge
(method="tempo", intent="charge"). Pay with mppx, then retry.
Use: npx mppx ${BASE_URL}/api/weather-window --method POST -J '{"activity":"drone","place":"Hanoi"}'

## Notes
- Source: Open-Meteo forecast + geocoding (free, no key). Informational only.
- Thresholds are general defaults, NOT certified safety/aviation/regulatory guidance.
- Discovery document: ${BASE_URL}/openapi.json
`;
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
