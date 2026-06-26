import { PRICE, RECIPIENT_ADDRESS, BASE_URL, CONTACT_EMAIL } from "@/lib/config";
import { ACTIVITIES } from "@/lib/activities";

export const dynamic = "force-dynamic";

export async function GET() {
  const activities = Object.keys(ACTIVITIES);
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "Weather Window",
      version: "1.0.0",
      description:
        "Go/no-go weather windows for outdoor operations. Give a location and an activity (drone flight, agricultural spraying, outdoor work) and get the good time windows in the next 48 hours, with the conditions and limiting factors for each. Decision support, not raw weather numbers. Built on Open-Meteo. Pay-per-call via MPP on Tempo. No API key, no signup.",
      "x-guidance":
        "Use Weather Window WHEN an agent needs to decide WHEN to do a weather-sensitive outdoor task, not just read the forecast. Body: { activity, lat, lon } or { activity, place }, optional hours (default 48, max 72). activity one of: " +
        activities.join(", ") +
        ". Returns good windows (start, end, duration, conditions) plus a best window. Unpaid requests return HTTP 402 with a Tempo payment challenge; pay with mppx and retry. Full agent docs at /llms.txt.",
      contact: { name: "Weather Window", email: CONTACT_EMAIL, url: BASE_URL },
    },
    servers: [{ url: BASE_URL }],
    "x-docs": { llmsTxt: BASE_URL + "/llms.txt" },
    "x-discovery": { ownershipProofs: [RECIPIENT_ADDRESS] },
    "x-activities": activities,
    paths: {
      "/api/weather-window": {
        post: {
          operationId: "weatherWindow",
          summary: "Good weather windows in the next 48h for an outdoor activity",
          tags: ["weather", "decision", "drone", "agriculture", "outdoor"],
          "x-payment-info": {
            price: { mode: "fixed", amount: PRICE, currency: "USD" },
            protocols: [{ mpp: {} }],
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    activity: {
                      type: "string",
                      enum: activities,
                      description: "Weather-sensitive activity to plan.",
                    },
                    lat: { type: "number", description: "Latitude (-90..90)." },
                    lon: { type: "number", description: "Longitude (-180..180)." },
                    place: {
                      type: "string",
                      description:
                        "Place name to geocode if lat/lon not given (e.g. 'Hanoi').",
                    },
                    hours: {
                      type: "integer",
                      description: "Forecast horizon, default 48, max 72.",
                    },
                  },
                  required: ["activity"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Good weather windows for the activity.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      activity: { type: "string" },
                      activityLabel: { type: "string" },
                      location: { type: "object" },
                      horizonHours: { type: "integer" },
                      currentlyGo: { type: "boolean" },
                      goHours: { type: "integer" },
                      windowCount: { type: "integer" },
                      windows: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            start: { type: "string" },
                            end: { type: "string" },
                            durationHours: { type: "integer" },
                            conditions: { type: "object" },
                          },
                        },
                      },
                      bestWindow: { type: "object" },
                      summary: { type: "string" },
                      disclaimer: { type: "string" },
                    },
                    required: ["type", "activity", "windows", "summary"],
                  },
                },
              },
            },
            "400": { description: "Bad Request - missing/invalid input." },
            "402": { description: "Payment Required" },
          },
        },
      },
    },
  };

  return Response.json(doc, { headers: { "Cache-Control": "no-store" } });
}
