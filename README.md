# Lucky Wheel — Security Awareness Demo

A browser-based security-awareness demo that combines a prize wheel with transparent examples of camera/microphone and location permission prompts.

## What is included

- Responsive Lucky Wheel UI
- 7 configurable prizes
- Cryptographically stronger random prize selection when `window.crypto` is available
- Explicit **Camera + Mic Demo** button
- 3-second local media recording demonstration
- Media data is discarded immediately and never uploaded
- Explicit **Location Demo** button
- Optional reverse geocoding to display a readable location
- Demo claim form with validation
- Form values remain only in the browser; no backend/API submission is configured
- Keyboard accessibility and reduced-motion support

## Important privacy behavior

This version deliberately does **not** request camera, microphone or geolocation permissions automatically on page load. Sensitive browser permissions are requested only after a user intentionally clicks the related demo button.

The 3-second media demo does not upload or save the recording. Captured chunks are discarded when the demo stops.

## Run locally

Camera/microphone and geolocation normally require a secure context.

### Option 1 — Python

```bash
cd lucky-wheel-security-demo
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

### Option 2 — Node

```bash
npx serve .
```

## Deploy

You can deploy this static project to:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- Any Nginx/Apache HTTPS virtual host

No build process is required.

## Customize prizes

Update the `prizes` array in `script.js` and keep the corresponding labels/colors in `index.html` / `style.css` aligned.

## Add a backend later

The current form intentionally does not transmit personal data. If you later need legitimate lead collection, add:

1. A clear privacy notice and purpose.
2. Explicit consent for data submission.
3. A secure HTTPS endpoint.
4. Server-side validation and rate limiting.
5. A retention/deletion policy.
6. Only the minimum data fields required for the stated purpose.

