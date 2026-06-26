// Endpoint tra ve cua so thoi tiet tot cho activity, gate bang MPP.
// THU TU: doi tien (402) TRUOC, validate input SAU.

import { NextRequest } from "next/server";
import { Mppx, tempo } from "mppx/server";
import {
  IS_TESTNET,
  PAY_TOKEN,
  PRICE_AMOUNT,
  RECIPIENT_ADDRESS,
  MPP_SECRET_KEY,
  REALM_HOST,
} from "@/lib/config";
import { ACTIVITIES } from "@/lib/activities";
import { weatherWindows, geocode } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mppx = Mppx.create({
  methods: [
    tempo({
      currency: PAY_TOKEN,
      recipient: RECIPIENT_ADDRESS,
      testnet: IS_TESTNET,
    }),
  ],
  secretKey: MPP_SECRET_KEY,
  realm: REALM_HOST,
});

type Input = {
  lat?: number;
  lon?: number;
  place?: string;
  activity: string;
  hours?: number;
};

async function readInput(request: NextRequest): Promise<Input> {
  try {
    const b = await request.clone().json();
    return {
      lat: b?.lat != null ? Number(b.lat) : undefined,
      lon: b?.lon != null ? Number(b.lon) : undefined,
      place: b?.place ? b.place.toString().trim() : undefined,
      activity: (b?.activity || "").toString().trim(),
      hours: b?.hours != null ? Number(b.hours) : undefined,
    };
  } catch {
    return { activity: "" };
  }
}

function validate(input: Input): string | null {
  if (!input.activity) {
    return "Missing 'activity'. One of: " + Object.keys(ACTIVITIES).join(", ");
  }
  if (!ACTIVITIES[input.activity]) {
    return (
      "Unknown activity '" +
      input.activity +
      "'. One of: " +
      Object.keys(ACTIVITIES).join(", ")
    );
  }
  const hasCoords = input.lat != null && input.lon != null;
  if (!hasCoords && !input.place) {
    return "Provide either 'lat'+'lon' or 'place'.";
  }
  if (hasCoords) {
    if (
      isNaN(input.lat as number) ||
      isNaN(input.lon as number) ||
      (input.lat as number) < -90 ||
      (input.lat as number) > 90 ||
      (input.lon as number) < -180 ||
      (input.lon as number) > 180
    ) {
      return "Invalid 'lat'/'lon'.";
    }
  }
  return null;
}

async function build(input: Input) {
  let lat = input.lat;
  let lon = input.lon;
  let place: { name?: string; country?: string } | undefined;

  if ((lat == null || lon == null) && input.place) {
    const g = await geocode(input.place);
    if (!g) {
      throw new Error("Could not geocode place '" + input.place + "'.");
    }
    lat = g.lat;
    lon = g.lon;
    place = { name: g.name, country: g.country };
  }

  return await weatherWindows(
    lat as number,
    lon as number,
    input.activity,
    input.hours ?? 48,
    place
  );
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  // ===== Preview (test, bo qua thanh toan) =====
  const previewKey = url.searchParams.get("preview");
  const PREVIEW_KEY = process.env.PREVIEW_KEY;
  const isPreview = Boolean(PREVIEW_KEY) && previewKey === PREVIEW_KEY;

  if (isPreview) {
    const input = await readInput(request);
    const err = validate(input);
    if (err) return Response.json({ error: err }, { status: 400 });
    try {
      const data = await build(input);
      return Response.json({ _preview: true, ...data });
    } catch (e: any) {
      return Response.json({ error: e?.message || "failed" }, { status: 502 });
    }
  }

  // ===== MPP: thu phi TRUOC (ep host = domain chinh) =====
  let reqForMpp: Request = request;
  try {
    const fixedUrl = new URL(request.url);
    fixedUrl.host = REALM_HOST;
    fixedUrl.protocol = "https:";
    const headers = new Headers(request.headers);
    headers.set("host", REALM_HOST);
    headers.set("x-forwarded-host", REALM_HOST);
    reqForMpp = new Request(fixedUrl.toString(), {
      method: request.method,
      headers,
      body: await request.clone().arrayBuffer(),
    });
  } catch {
    reqForMpp = request;
  }

  const paid = await mppx.tempo.charge({
    amount: PRICE_AMOUNT,
    recipient: RECIPIENT_ADDRESS,
  })(reqForMpp);

  if (paid.status === 402) {
    return paid.challenge;
  }

  // ===== Da tra tien -> validate + tinh =====
  const input = await readInput(request);
  const err = validate(input);
  if (err) return Response.json({ error: err }, { status: 400 });

  try {
    const data = await build(input);
    return paid.withReceipt(Response.json(data));
  } catch (e: any) {
    return Response.json(
      { error: "Weather lookup failed: " + (e?.message || "unknown") },
      { status: 502 }
    );
  }
}
