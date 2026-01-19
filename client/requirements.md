## Packages
react-map-gl | Mapbox wrapper for React
mapbox-gl | Mapbox GL JS core library
recharts | For financial charts (earnings visualization)
framer-motion | Smooth transitions and animations for list items and cards
lucide-react | Already in base, but emphasizing heavy use for icons
date-fns | Date formatting

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["'Inter'", "sans-serif"],
  display: ["'Oswald'", "sans-serif"], // Strong, utilitarian font for headers/numbers
}

Mapbox Token:
Expects import.meta.env.VITE_MAPBOX_TOKEN to be set.
If missing, fallback to a placeholder view or warning.

Voice Input:
Uses browser's `window.SpeechRecognition` or `window.webkitSpeechRecognition`.
