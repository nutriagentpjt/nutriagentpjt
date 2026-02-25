// ⚠️ ENTRY POINT: This is the main entry point for Figma Make.
// All app logic is now in /src/app/App.tsx
// This file simply delegates to the src structure.

import AppComponent from "./app/App";
import "./styles/globals.css";

export default function App() {
  return <AppComponent />;
}