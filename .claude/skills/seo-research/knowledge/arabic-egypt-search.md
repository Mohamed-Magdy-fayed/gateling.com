# Searching in Egypt: Arabic, English, and Franco

Egypt is a bilingual, mobile-first market where people search in three registers. A keyword
list built by translating English terms into formal Arabic misses most of the real demand.

## Market facts

- Google holds roughly 97% of search in Egypt; optimise for Google first.
- Most searches happen on mobile (estimates run 78-95%), often on mid-range phones and
  unstable connections. Page weight and speed matter more than in Gulf markets.
- Egyptian buyers are price-sensitive and slow to trust unknown brands. Visible prices or price
  ranges in EGP, real reviews, real photos, a phone number and a WhatsApp button earn the click
  and the lead.
- Keyword tools under-report Arabic volume unless country and language are set correctly; global
  tools are weakest on Egyptian dialect long-tail.

## The three registers

| Register | Who / when | Examples |
|---|---|---|
| **Formal Arabic (MSA / فصحى)** | Researching, comparing, corporate buyers, official info. Longer, noun-heavy queries. | `برنامج إدارة علاقات العملاء`، `نظام إدارة المخزون` |
| **Egyptian colloquial (عامية)** | Everyday need, mobile and voice, early-stage "how / how much" questions. | `ازاي اعمل موقع`، `برنامج حسابات للمحل`، `اوضة نوم` |
| **Mixed script / English / Franco (Arabizi)** | Tech and commerce terms, younger users, B2B tech buyers. | `CRM`، `برنامج CRM للشركات`، `سيستم`، `ابلكيشن`، `atelier system`، `fostan soiree` |

Every commercial topic needs a decision: which registers matter for *this* buyer. A dress-rental
owner may type `برنامج للاتيليه` or `سيستم اتيليه`; a software buyer may type
`custom software company Egypt`.

## Egyptian vocabulary that differs from MSA or Gulf

| Meaning | MSA | Gulf | Egypt |
|---|---|---|---|
| Car | سيارة | سيارة | عربية |
| Mobile phone | هاتف محمول | جوال | موبايل |
| Air conditioner | مكيف هواء | مكيف | تكييف |
| Shoe | حذاء | جوتي | جزمة / كوتشي |
| Bedroom | غرفة نوم | غرفة نوم | اوضة نوم |
| How | كيف | شلون | ازاي |
| Where | أين | وين | فين |
| How much | كم السعر | بكم | بكام / كام |
| I want | أريد | أبي / أبغى | عايز / عاوز |
| System / software | نظام / برنامج | نظام | سيستم / برنامج |
| Application | تطبيق | تطبيق | ابلكيشن / تطبيق |

Fashion and retail vocabulary is heavily dialect and loanword: `فستان سواريه`، `فساتين زفاف`،
`فستان خطوبة`، `بدلة فرح`، `اتيليه`، `ايجار فساتين`، `فستان كتب كتاب`. Check each with Trends.

## Spelling variants to always generate

Egyptians type fast and informally. For every Arabic seed, generate and test:

- Hamza forms: `أ / إ / ا` (`اتيليه` vs `أتيليه`), and `آ`.
- Final `ي` vs `ى` (`فساتين سواريه` / `سوارية`), final `ه` vs `ة` (`اتيليه` / `اتيلية`).
- Loanword spellings: `اتيليه / اتلييه / اتيلية / أتليه`، `سيستم / سستم`، `ابلكيشن / ابليكيشن / أبلكيشن`.
- Singular and broken plural (`فستان / فساتين`، `برنامج / برامج`).
- With and without `ال`.
- English and Franco versions (`atelier`, `atelie`, `fasateen`).

Google mostly merges these variants, so they do **not** each get a page. They tell you which
spelling to use in the title and H1 (the highest-volume one) and which to use naturally in the
body, alt text and FAQ.

## Local modifiers worth testing

Cities and districts (القاهرة، الجيزة، اسكندرية، مدينة نصر، التجمع، المهندسين، المعادي،
الشيخ زايد، المنصورة، طنطا), `في مصر`، `مصر`، `اونلاين`، `بالتقسيط`، `رخيص`، `سعر`، `ارخص`،
seasons (رمضان، العيد، موسم الافراح، الصيف), and local payment words (فوري، انستاباي،
فودافون كاش، تقسيط).

## Platform split

The same need is phrased differently per surface:
- **Google search:** shorter, more noun-based (`سعر برنامج حسابات`).
- **YouTube and TikTok:** spoken Egyptian (`ازاي احسب الارباح في المحل`).
- **Google Maps:** hyper-local (`اتيليه فساتين في مدينة نصر`).
- **Facebook groups:** full sentences with context, the best source of buyer wording.

## Technical rules for Arabic pages

- `<html lang="ar" dir="rtl">` (or `lang="ar-EG"`); never machine-translate a page without a
  native Egyptian review on a real phone.
- Separate URLs per language with `hreflang` (`ar-EG`, `en`, `x-default`) and self-canonicals.
  The same content in both languages on one URL confuses both.
- Write the Arabic page natively for the Arabic searcher; it may need different sections,
  examples and FAQs from the English page, not a translation.
- Arabic slugs are readable to Google but ugly when shared and fragile in analytics. Prefer a
  short transliterated or English slug for conversion pages; either works for content pages.

## Conflict with current gateling.com policy

`docs/seo-program.md` currently says "English-only for SEO. No `/ar` routes, no hreflang".
That was decided before this research. For an Egyptian atelier audience, Arabic is the primary
search language, so the agent must flag this conflict in any gateling.com report and ask the
owner to revisit it, not silently work around it.
