"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} className="btn-outline flex-1">Print receipt</button>;
}
