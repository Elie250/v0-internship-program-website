# Shop localization glossary

Source of truth for Energy & Logics Shop UI language.

- **Scope:** UI labels and system-generated chrome only.
- **Languages this phase:** English (default), Kinyarwanda (`rw`).
- **Do not translate:** product names, SKU, barcodes, category names from the database, prices, RWF amounts, dates, IDs, permission keys, API field names, `Energy & Logics`, `Nyanza Shop`.
- **Keep as-is:** POS, SKU, EBM, ID, RWF, MoMo, QR, CSV, OK, barcode. Do not show `API` in ordinary staff-facing UI.

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
| Payment | Ubwishyu | The payment itself (status, column, filter) | Noun |
| Pay / make payment | Kwishyura | POS actions | Verb |
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
| Pending payments | Ubwishyu butegerejwe | Dashboard | |
| In stock | Ibirimo mu bubiko | Dashboard | |
| Reset password | Hindura ijambo ry'ibanga | Staff | |
| Revoke sessions | Hagarika amasession | Staff | Keep “session” as amasession |
| Create staff member | Ongeramo umukozi | Staff | |
| Consumed | Byakoreshejwe | stock_state UI label only | Raw API value stays `consumed` |
| SKU | SKU | Everywhere | Do not translate |
| MoMo | MoMo | Payment | Do not translate |
| EBM | EBM | Settings | Do not translate |
| RWF | RWF | Currency suffix | Do not translate amounts |
| Cart | Ibyatoranijwe | Customer storefront navigation | Selected items; not POS “Current Sale” |
| Track Order | Kurikirana icyatumijwe | Customer storefront | Follow a purchase |
| Shopping from | Ugurira kuri | Shop context | Followed by shop display name (Nyanza Shop) |
| Checkout | Soza igurisha | Customer storefront | Complete the purchase; not POS Confirm Cash Sale |
| Add to cart | Ongeramo mu byatoranijwe | Customer catalogue | Reuse Cart = Ibyatoranijwe |
| Few left | Ibisigaye bike | Customer availability | Same term as Low stock; do not show exact remaining count |
| Unavailable | Ntiboneka | Out-of-stock button | Distinct from Out of stock label |
| All | Byose | Category filter | |

## User-facing language principles

Shop UI speaks to shop staff and public customers in natural, professional business language. Describe the business action or result. Do not explain how the software works internally.

- Avoid internal implementation details.
- Do not expose APIs, servers, databases, or endpoints to normal users.
- Keep technical terms only when they are meaningful to the user (POS, SKU, EBM, MoMo, RWF).
- Kinyarwanda should sound like professional Rwandan business language.
- English should also remain concise and user-oriented.

Approved dashboard description (Kinyarwanda):

> Incamake y’imikorere y’iduka ry’i Nyanza. Imibare ijyanye n’amakuru y’ubucuruzi.

Do not mention servers or technical data processing in this sentence.

Approved POS preview copy:

- English: “These are preview totals. The final total will be shown when the sale is confirmed.”
- Kinyarwanda: “Aya ni amakuru y’agateganyo. Igiteranyo cya nyuma kizagaragara umaze kwemeza igurisha.”

Approved stock-on-confirm copy:

- English: “Stock is updated when the sale is confirmed.”
- Kinyarwanda: “Ububiko buragabanuka igurisha rimaze kwemezwa.”

Approved public storefront terms:

- Cart (customer): Ibyatoranijwe. Do not reuse POS “Current Sale”.
- Shopping from: “Ugurira kuri” + shop display name (Nyanza Shop).
- Checkout: Soza igurisha.
- Track Order: Kurikirana icyatumijwe.

## Usage rules

1. English is the source language in `en.ts`.
2. Prefer short professional labels over literal sentences.
3. Reuse glossary terms; do not introduce a second word for the same concept.
4. Server JSON (`error`, `message`, field names) is not localized in this phase except Shop chrome that wraps it.
5. French / Swahili: copy this table into a new locale file; do not change keys.
