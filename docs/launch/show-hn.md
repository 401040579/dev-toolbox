# Show HN draft

Status: draft, not posted. Post as a link submission to `https://app.aiuos.com`, then add the first comment immediately. HN titles are limited to 80 characters; "Show HN:" counts. Pick one title.

## Title options (≤ 80 chars)

1. `Show HN: Dev Toolbox – 90 browser-only dev tools, no backend, no account` (72)
2. `Show HN: SMS segment calculator and file transfer over animated QR, in the browser` (80)
3. `Show HN: Dev Toolbox – send files between devices with animated QR codes` (71)

Recommendation: option 1 for the catalog, option 3 if you would rather lead with the one feature HN has not seen in this form. Do not use both features in one title; it reads as a list.

## First comment (post right after submitting)

Hi HN. I built Dev Toolbox because the tools I reached for while debugging messaging and point-of-sale integrations were spread across a dozen ad-supported sites, and I did not want to paste webhook payloads or customer messages into any of them.

It is a React/TypeScript PWA with 90 tools and a small "Pipeline" builder (chain transforms such as Base64 → JSON pretty → SHA-256, save locally, share a synthetic example by link). Everything runs in the browser: no backend, no account, no uploads. After one online load it works offline. Source is MIT: https://github.com/401040579/dev-toolbox

Two parts that are less common than the usual Base64/JWT/UUID set:

**SMS segment calculator.** Paste a message and it tells you whether it will go out as GSM-7 or UCS-2, how many segments that is, which exact characters forced UCS-2 (curly quotes, em dashes, fullwidth punctuation, emoji), how many characters you have before the next segment, and what Twilio-style "smart encoding" would turn the message into. The character tables and segmentation approach come from Twilio's MIT-licensed message-segment-calculator, with attribution. The classic case: a pickup notification copied from a Word document doubles in cost because of one "”". Results are estimates, not carrier billing.

**File transfer over animated QR codes.** Device A plays a file as a stream of QR codes, device B points its camera at the screen, nothing travels over a network and there is no server. Frames are RaptorQ fountain-coded, so missed or out-of-order scans are recovered from repair frames instead of restarting; length and SHA-256 are verified before anything is saved. Three profiles: Compatibility (384-byte symbols), High speed (QR V30, 4 codes in parallel at up to 30 FPS) and Extreme (V40 for large screens). Limits are 5 MiB per file and 8 files / 10 MiB per batch. Honest caveat: the throughput figure I have (a 1 MiB random file in about 3.9 s, ~263 KiB/s) comes from a synthetic Chromium pipeline that renders real QR pixels into a simulated camera stream; I have not measured a physical phone pointed at a laptop screen, and both ends must run this app. There is also a text-only variant for sending a config snippet or a key fingerprint to an air-gapped machine.

Other bits: JSON structural diff, a log analyzer that handles 10 MiB files in a Worker, a Smart Paste that recognizes JSON / JWT / epoch / Base64 and opens the right tool, drafts that survive reloads, English and Chinese UI.

Privacy details are in the README, including what the optional page-view counter sends if the operator turns it on (route path and referring site only; it is off by default and the request is built in one 100-line file you can read).

Things I would like feedback on: whether the QR transfer survives real cameras on your devices (please say phone model and the profile you used), and which messaging/POS debugging tasks you still have to leave the browser for.

## Notes before posting

- Replace nothing with marketing adjectives; HN downvotes "blazing fast" and rewards numbers with caveats.
- If someone asks "why not WebRTC / AirDrop / a USB stick": the honest answer is that QR works when the two devices have no network path at all (kiosk, locked-down POS terminal, air-gapped box) and needs nothing installed on the sending side beyond a browser.
- If asked about analytics: default build sends nothing; see README → Analytics.
- Have the SMS example ready: `Order DEMO-1042 is “ready”—collect at the demo desk. Reply “YES” to confirm your pickup time. Thank you!`
