import { PRICE, BASE_URL } from "@/lib/config";
import { ACTIVITIES } from "@/lib/activities";

export default function Home() {
  const acts = Object.entries(ACTIVITIES);
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Weather Window</h1>
      <p style={{ color: "#8a8fa0", marginTop: 0 }}>
        Go/no-go weather windows for outdoor operations. Give a location and an activity, get the
        good time windows in the next 48 hours with conditions and limiting factors. Decision
        support, not raw numbers. Pay-per-call via MPP on Tempo. No API key, no signup.
      </p>

      <div style={{ background: "#13171c", border: "1px solid #232a31", borderRadius: 14, padding: 20, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>For agents</h2>
        <p style={{ color: "#8a8fa0", fontSize: 14 }}>
          Discovery: <a href="/openapi.json" style={{ color: "#4cc9b0" }}>{BASE_URL}/openapi.json</a>
          {"  ·  "}
          <a href="/llms.txt" style={{ color: "#4cc9b0" }}>/llms.txt</a>
        </p>
        <pre style={{ background: "#0b0e11", border: "1px solid #232a31", borderRadius: 10, padding: 14, overflowX: "auto", fontSize: 13 }}>{`POST ${BASE_URL}/api/weather-window
Content-Type: application/json

{ "activity": "drone", "place": "Hanoi", "hours": 48 }

Price: ${PRICE} USD per call (paid via MPP on Tempo)`}</pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>Activities</h2>
        <ul style={{ color: "#8a8fa0", fontSize: 14, lineHeight: 1.7, paddingLeft: 18 }}>
          {acts.map(([k, v]) => (
            <li key={k}>
              <b style={{ color: "#e8eef0" }}>{k}</b> {v.label}
            </li>
          ))}
        </ul>
      </div>

      <p style={{ color: "#8a8fa0", fontSize: 13, marginTop: 24 }}>
        Heuristic decision support from Open-Meteo forecast data. Not certified safety, aviation, or
        regulatory guidance. Apply local rules and your own judgment.
      </p>
    </main>
  );
}
