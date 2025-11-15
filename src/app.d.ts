// Diese Datei erweitert die globalen Typen von SvelteKit.
// Für Einsteiger:innen: So wissen TypeScript und der Editor, welche Daten im Projekt existieren.
declare global {
  namespace App {
    interface Locals {}

    interface PageData {}
  }
}

export {};

// Für Einsteiger:innen: Mit diesem Modul-Stub kann TypeScript JSON-Dateien mit dem
// Suffix `?raw` als einfache Zeichenketten behandeln. So lassen sich komplexe
// Datensätze einlesen und anschließend per `JSON.parse` weiterverarbeiten.
declare module '*.json?raw' {
  const content: string;
  export default content;
}
