# Shop localization glossary

Source of truth for Energy & Logics Shop UI language.

- **Scope:** UI labels and system-generated chrome only.
- **Languages this phase:** English (default), Kinyarwanda (`rw`).
- **Do not translate:** product names, SKU, barcodes, category names from the database, prices, RWF amounts, dates, IDs, permission keys, API field names, `Energy & Logics`, `Nyanza Shop`.
- **Keep as-is:** POS, SKU, API, EBM, ID, RWF, MoMo, QR, CSV, OK, barcode.

Dictionaries live in `lib/shop/i18n/messages/`. Add French later as a new locale file; do not invent terms outside this glossary.

| English | Kinyarwanda | Context | Notes |
|---------|-------------|---------|-------|
| Dashboard | Incamake | Navigation, page title | Overview, not “dashboard” loanword |
| POS | POS | Navigation, terminal | Do not translate |
| Products | Ibicuruzwa | Navigation, catalog | Plural |
| Product | Igicuruzwa | Single item, table column | |
| Inventory | Ububiko | Navigation, module | Same term as Stock |
| Stock | Ububiko | Tables, POS, metrics | |
| Stock level | Ingano y'ibiri mu bubiko | Inventory tab | Concise UI: also “Ububiko” where space is tight |
| Stock movement | Imigendekere y'ububiko | Inventory tab | |
| Low stock | Ibisigaye bike | Dashboard, flags | |
| Out of stock | Byashize mu bubiko | Dashboard | Flag short form: Byashize |
| Available | Birahari | On-hand column | |
| Sales | Igurisha | Navigation, module | Commercial sales history (not “Ibyagurishijwe”) |
| Sale | Igurisha | POS current sale | |
| Order | Icyatumijwe | Sales table (sale/order record) | Prefer natural “sale record” sense over mechanical “order” |
| Orders | Ibyatumijwe | Dashboard metric | |
| Staff | Abakozi | Navigation, module | |
| Settings | Igenamiterere | Navigation | |
| Language | Ururimi | Selector | English / Kinyarwanda labels stay in those languages |
| Search | Shakisha | Buttons, fields | |
| Add | Ongeramo | Create/add actions | |
| Edit | Hindura | Staff, forms | |
| Delete | Siba | Destructive | |
| Save | Bika | Forms | “Save changes” stays short: Bika |
| Cancel | Reka | Dialogs | Not Hagarika (reserved for revoke/deactivate) |
| Confirm | Emeza | POS, dialogs | |
| Close | Funga | Panels | |
| Back | Subira inyuma | POS confirm | |
| Next | Komeza | Pagination | |
| Previous | Ibanjirije | Pagination | |
| Price | Igiciro | Tables | |
| Quantity | Ingano | POS, lines | |
| Total | Igiteranyo | Totals, receipt | |
| Subtotal | Igiteranyo cy'agateganyo | POS | |
| Discount | Igabanyirizwa | POS, product detail | |
| Payment | Kwishyura | POS, sales | |
| Cash | Amafaranga | POS | |
| Receipt | Inyemezabwishyu | POS success | |
| Paid | Yishyuwe | Payment status | |
| Pending | Itegereje | Payment / workflow | |
| Approved | Byemejwe | Payment | |
| Completed | Byarangiye | Sale completed | |
| Customer | Umukiriya | POS, sales | |
| Customers | Abakiriya | Plural | |
| Walk-in customer | Umukiriya waje ku iduka | POS default | |
| Administrator | Umuyobozi mukuru | Role | |
| Salesperson | Umucuruzi | Role | |
| Inventory Manager | Ushinzwe ububiko | Role | |
| Role | Uruhare | Staff | |
| Permission | Uburenganzira | Access copy | |
| Login / Sign in | Injira | Auth | |
| Logout / Sign out | Sohoka | Auth | |
| Password | Ijambo ry'ibanga | Auth, staff | |
| Email | Imeyili | Auth, staff | |
| Location | Ahantu | Sales detail | |
| Shop | Iduka | Generic | |
| Nyanza Shop | Nyanza Shop | Site label | Official display name — do not translate |
| Energy & Logics | Energy & Logics | Brand | Do not translate |
| Reports | Raporo | Future / dashboard notes | |
| Catalog | Urutonde rw'ibicuruzwa | Dashboard | |
| Today's sales | Igurisha ry'uyu munsi | Dashboard | |
| Pending payments | Ibyishyurwa bitegerejwe | Dashboard | |
| In stock | Ibirimo mu bubiko | Dashboard | |
| Reset password | Hindura ijambo ry'ibanga | Staff | |
| Revoke sessions | Hagarika amasession | Staff | Keep “session” as amasession |
| Create staff member | Ongeramo umukozi | Staff | |
| Consumed | Byakoreshejwe | stock_state UI label only | Raw API value stays `consumed` |
| SKU | SKU | Everywhere | Do not translate |
| MoMo | MoMo | Payment | Do not translate |
| EBM | EBM | Settings | Do not translate |
| RWF | RWF | Currency suffix | Do not translate amounts |

## Usage rules

1. English is the source language in `en.ts`.
2. Prefer short professional labels over literal sentences.
3. Reuse glossary terms; do not introduce a second word for the same concept.
4. Server JSON (`error`, `message`, field names) is not localized in this phase except Shop chrome that wraps it.
5. French / Swahili: copy this table into a new locale file; do not change keys.
