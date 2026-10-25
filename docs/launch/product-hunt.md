# Product Hunt draft

Status: draft, not posted. Product Hunt fields: name (40 chars), tagline (60 chars), description (260 chars), topics, first comment from the maker, 3–6 gallery images (1270×760 recommended) and a thumbnail (240×240). The `public/og.png` share card is not the right size for the gallery; capture fresh screenshots with synthetic data (`node scripts/capture-screenshots.mjs`).

## Name

`Dev Toolbox`

## Tagline options (≤ 60 chars)

1. `90 developer tools that never leave your browser` (48)
2. `Browser dev tools: SMS segments, payloads, QR file transfer` (58)
3. `No backend, no account: dev tools that run in your browser` (58)

Recommendation: option 1.

## Description (≤ 260 chars)

`90 developer tools in one offline-capable PWA: SMS segment calculator with Twilio-style smart encoding, Base64/JSON pipelines, JSON diff, log analyzer, and file transfer between devices over animated QR codes. No backend, no account, nothing uploaded. MIT.` (257)

## Topics

Developer Tools · Open Source · Privacy · Productivity · Web App

## Maker's first comment

Hi Product Hunt,

Dev Toolbox started as the set of utilities I kept needing while debugging SMS notifications and point-of-sale integrations, rebuilt so that nothing has to leave the browser. There is no server, no sign-up and no upload: tool inputs are processed locally, and after one online visit the app also works offline as an installable PWA.

What is inside:

- **90 tools in 11 categories**: encoding, time, JSON/data, text, generators, crypto, network, image, color, dev tools and math.
- **SMS Segment Calculator**: see whether a message is GSM-7 or UCS-2, how many segments it costs, which characters pushed it over (smart quotes, em dashes, emoji) and what smart encoding would change. Estimates only; carriers bill differently.
- **QR File Transfer**: move a file between two devices that share no network by playing it as animated QR codes and scanning with a camera. RaptorQ recovery frames tolerate missed scans; SHA-256 is verified before saving. Up to 5 MiB per file, 8 files per batch. Measured at ~263 KiB/s in a synthetic test; real camera speed depends on your devices.
- **Pipeline**: chain transforms (Base64 → JSON pretty → hash), save locally, share a synthetic example by link.
- JSON structural diff, 10 MiB log analyzer, Smart Paste, drafts that survive reloads, English and Chinese UI.

Open source under MIT: https://github.com/401040579/dev-toolbox. Page-view counting is off by default; if a deployment turns it on it records only the page path and the referring site, and the README lists exactly what is sent.

I would love to hear which tool you still have to open another site for, and how the QR transfer behaves with your phone and screen.

## Launch checklist

- [ ] Replace the "Measured at ~263 KiB/s" line with a real phone measurement if one exists by launch day; otherwise keep the "synthetic" wording.
- [ ] Gallery: SMS calculator with the `DEMO-1042` sample, Pipeline template, QR sender + receiver side by side, JSON diff, Chinese UI.
- [ ] Thumbnail: render `public/icons/icon-512.png` down to 240×240 (same mark as the favicon).
- [ ] Do not schedule the launch on the same day as the Show HN post; a weekday morning US Pacific is the usual advice.
