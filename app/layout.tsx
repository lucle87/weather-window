import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather Window - go/no-go weather windows for outdoor ops",
  description: "Good time windows in the next 48h for drone flights, crop spraying, and outdoor work. Built on Open-Meteo. Pay-per-call via MPP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0e11", color: "#e8eef0", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
