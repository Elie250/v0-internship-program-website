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

Point `EXPO_PUBLIC_API_BASE_URL` at the shop host (production default) or your machine on the LAN when developing against `pnpm dev`. Android emulator: `http://10.0.2.2:3000`.

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

## Release later (not this phase)

`eas.json` defines development / preview / production Android profiles. Do not publish or pay for EAS from this phase. Application ID: `com.energyandlogics.staffpos`.
