# Energy & Logics — Android staff POS

Expo / React Native app for Nyanza shop staff. It talks only to the existing staff HTTP APIs. Privileged database credentials are never bundled in the Android client.

```text
Android app  →  Staff API (shop.energyandlogics.com)  →  commerce backend
```

This directory is **not** a pnpm workspace member of the Next.js repo. React Native and Next.js must not share one hoisted `react` install. The web app stays at the repository root.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Staff sign-in |
| `/` | Future customer home; currently redirects to `/staff` or `/login` |
| `/staff` | Dashboard |
| `/staff/pos` | POS (`shop:pos_sell`) |
| `/staff/orders` | Online orders + MoMo review (`shop:orders_view`) |
| `/staff/sales` | Sales history |
| `/staff/products` | Catalog |
| `/staff/inventory` | Stock levels |
| `/staff/settings` | Session / sign-out (no Admin Console) |

Tabs and deep links hide screens the signed-in user cannot access. The server remains the authority for price, stock, totals, and payment decisions.

## Setup

```bash
cd apps/mobile
cp .env.example .env
pnpm install --ignore-workspace
pnpm start
```

`--ignore-workspace` keeps this install inside `apps/mobile` so it cannot attach to a parent `package.json`.

Point `EXPO_PUBLIC_API_BASE_URL` at the shop host. The production default is `https://shop.energyandlogics.com`. A physical phone on Expo Go should keep that production URL. Do not use `localhost`.

`pnpm start` uses LAN mode. On the same Wi-Fi, open Expo Go and scan the QR code, or connect to `exp://YOUR_PC_LAN_IP:8081`.

## Scripts

```bash
pnpm start          # Expo dev server
pnpm android        # open Android
pnpm typecheck      # tsc --noEmit (from this folder)
```

From the repository root:

```bash
pnpm test:mobile
pnpm tsc --noEmit
```

## Over-the-air updates (EAS Update)

After **one** preview APK that includes `expo-updates`, later JavaScript/UI changes can be published without a new download.

Application ID stays `com.energyandlogics.staffpos`. Preview still ships an internal APK that talks to `https://shop.energyandlogics.com`.

Existing APKs built **before** this config cannot receive air updates. Install the next preview build once, then use:

```bash
cd apps/mobile
pnpm ota:preview -- --message "Describe the JS change"
```

Production (Play / AAB) uses:

```bash
cd apps/mobile
pnpm ota:production -- --message "Describe the JS change"
```

A new APK/AAB is only required when native code changes (new Expo modules, camera permissions, package name, or an `app.json` version bump — runtime version follows `appVersion`, currently `0.1.0`).

Do not start an EAS build from this folder unless you are ready to download that one new APK.
