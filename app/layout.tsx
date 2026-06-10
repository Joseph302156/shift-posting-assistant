import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift-Posting Assistant · for Traba",
  description:
    "Turn a plain-English staffing request into a reliability-optimized shift post — with a transparent fill-rate readiness score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
