# Cloudflare R2 setup (Energy & Logics)

Run after creating the `platform-media` bucket (Standard storage class).

## 1. Custom domain

R2 bucket → **Settings** → **Custom Domains** → add e.g. `media.energyandlogics.com`.

Set in Vercel:

```
R2_PUBLIC_BASE_URL=https://media.energyandlogics.com
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://media.energyandlogics.com
```

## 2. CORS (required for browser uploads)

Hero videos and large lesson files upload **directly from the browser** via presigned PUT URLs.

In Cloudflare Dashboard → R2 → your bucket → **Settings** → **CORS policy**, paste the contents of `scripts/43-r2-cors.json`.

Update `AllowedOrigins` if your production URL differs.

## 3. Vercel environment variables

| Variable | Example |
|----------|---------|
| `R2_ACCOUNT_ID` | From R2 overview |
| `R2_ACCESS_KEY_ID` | Account API token |
| `R2_SECRET_ACCESS_KEY` | Account API token secret |
| `R2_BUCKET_NAME` | `platform-media` |
| `R2_PUBLIC_BASE_URL` | `https://media.energyandlogics.com` |
| `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` | Same as above |

Redeploy after adding variables.

## 4. Migrate existing Supabase files

Use the automated migration (recommended):

```bash
node scripts/migrate-supabase-to-r2.mjs --dry-run --rewrite-urls
node scripts/migrate-supabase-to-r2.mjs --rewrite-urls
```

Or see **`scripts/44-migrate-storage-to-r2.md`** for full steps and the SQL-only URL rewrite (`scripts/44-migrate-storage-urls-to-r2.sql`).

Objects keep the same paths (`hero/`, `products/`, `receipts/`, etc.). Database URLs change from `*.supabase.co/storage/...` to `https://media.energyandlogics.com/...`.

## 5. Verify

1. Admin → Settings → upload a product image → URL should be `https://media.energyandlogics.com/products/...`
2. Homepage hero videos load from `https://media.energyandlogics.com/hero/...`
3. Supabase Usage → cached egress should drop over the next billing cycle
