# @mcv/apps-web — Public Web Portal
## Tier 6: Presentation | Classification: PUBLISHABLE

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** 00-ARCHITECTURE.md (Tier 6)
**Prototype Source:** apps/web in mcv-one-admin-prototype

---

## 1. Executive Summary

The Public Web Portal is the **customer-facing web application** for MCV.ONE ventures. It serves as the public-facing website, customer self-service portal, e-commerce storefront, help center, and blog — all white-labeled per venture. Unlike the admin dashboards (which are for operators), this app is what **end users** interact with.

**Access:** Public (unauthenticated) + Authenticated customers
**URL Pattern:** www.mcv.one (platform) or venture domains (betedge.app, fullgain.ca)
**Framework:** Next.js 15 (App Router) + tRPC + @mcv/ui

---

## 2. Route Structure

### 2.1 Public Pages (Unauthenticated)

```
/                  — Landing page (venture-branded)
/about             — About page
/pricing           — Pricing tiers & comparison
/products/*        — Product catalog with [slug] detail pages
/solutions/*       — Solution pages with [slug] detail
/services          — Service offerings
/blog/*            — Blog with [slug] articles
/docs/*            — Documentation with [...slug] catch-all
/help/*            — Help center with [category] and article/[slug]
/faq               — Frequently asked questions
/contact           — Contact form
/careers/*         — Job listings with [slug] detail
/press             — Press releases
/partners          — Partner program
/legal/privacy     — Privacy policy
/legal/terms       — Terms of service
/legal/cookies     — Cookie policy
/status            — System status page
/changelog         — Product changelog
/portfolio/*       — Public venture portfolio with [slug]
/reviews/[widgetId] — Embedded review widget
```

### 2.2 Authentication Routes

```
/login             — Customer login
/register          — Customer registration
/forgot-password   — Password reset
/reset-password    — Reset confirmation
/verify-email/sent — Email verification
/mfa/setup         — MFA enrollment
/mfa/verify        — MFA challenge
```

### 2.3 Customer Portal (Authenticated)

```
/account           — Account overview
/account/profile   — Profile management (not in prototype route but implied by settings)
/account/billing   — Billing information
/account/security  — Password, MFA, sessions
/account/settings  — Preferences, notifications
/account/subscriptions — Active subscriptions
/account/orders/*  — Order history with [orderId] detail
/notifications     — Notification center
/notifications/preferences — Notification settings
/wishlist          — Saved products
```

### 2.4 Commerce Routes

```
/cart              — Shopping cart
/checkout          — Checkout flow
/checkout/confirmation — Order confirmation
/checkout/success  — Success page
/pay/[invoiceId]   — Invoice payment page (public link)
/book/[slug]       — Booking/scheduling page
/form/[id]         — Public form submission
```

### 2.5 Interactive Features

```
/community         — Community hub
/widget/chat       — Embedded chat widget
```

---

## 3. Feature Modules

### 3.1 Implemented (Prototype)

| Feature | Files | Description |
|---------|-------|-------------|
| Blog | 4 | Blog listing, article pages, API integration |
| Content | 1 | CMS content rendering |
| Products | 1 | Product catalog display |

### 3.2 Planned (Full Build)

| Feature | Source Package | Description |
|---------|---------------|-------------|
| Authentication | @mcv/auth | Customer registration, login, social auth |
| Account Portal | @mcv/users | Profile, billing, subscriptions, orders |
| Product Catalog | @mcv/commerce/catalog | Product browsing, search, filtering |
| Shopping Cart | @mcv/commerce/cart | Cart management, add/remove/update |
| Checkout | @mcv/commerce/checkout | Multi-step checkout with Stripe |
| Help Center | @mcv/growth/education | Searchable knowledge base |
| Blog | @mcv/growth/content | Blog with categories, RSS |
| Documentation | @mcv/growth/education | Technical docs with sidebar nav |
| Contact | @mcv/nexus/forms | Contact form with routing |
| Reviews | @mcv/engagement | Customer reviews & ratings |
| Chat Widget | @mcv/nexus/conversations | Live chat support |
| Notifications | @mcv/fabric/notifications | In-app notification center |
| Booking | @mcv/nexus/calendar | Appointment scheduling |

---

## 4. Technical Architecture

### 4.1 Rendering Strategy

| Route Type | Strategy | Rationale |
|-----------|----------|-----------|
| Landing, About, Pricing | SSG (Static) | SEO, fast load, rarely changes |
| Blog posts | ISR (30 min) | SEO + fresh content |
| Product pages | ISR (5 min) | SEO + price/stock updates |
| Docs pages | ISR (1 hour) | SEO + infrequent updates |
| Account pages | SSR | Personalized, auth-required |
| Cart/Checkout | CSR | Dynamic, no SEO needed |
| Help center | ISR (15 min) | SEO + searchability |

### 4.2 Shared Infrastructure

- **@mcv/ui** — Same component library as admin apps
- **tRPC client** — Type-safe API calls to @mcv/api
- **Zustand stores** — Cart state, auth state, preferences
- **Cookie consent** — GDPR/CCPA compliant consent management
- **Analytics** — PostHog integration for product analytics
- **Accessibility** — WCAG 2.1 AA compliance required

### 4.3 SEO Requirements

- Server-rendered meta tags (title, description, og:*)
- Structured data (JSON-LD) for products, articles, FAQs
- Sitemap.xml (auto-generated from CMS + catalog)
- RSS feed (/rss.xml) for blog
- Canonical URLs for all pages
- Robots.txt with venture-specific rules

---

## 5. White-Label Support

Same branding system as Venture Admin (colors, logo, domain, favicon).

**Venture Domain Routing:**
- betedge.app → Web Portal (BetEdge branding)
- fullgain.ca → Web Portal (Full Gain branding)
- www.mcv.one → Web Portal (MCV.ONE branding)

Middleware detects the request hostname and loads the appropriate venture branding + module configuration.

---

## 6. Prototype Status

| Metric | Value |
|--------|-------|
| Web app features | 3 (blog, content, products) |
| Route pages | 50+ page.tsx files |
| Components | Accessibility, analytics, cookie-consent, UI |
| Stores | 4 Zustand stores |
| tRPC integration | 13 files |
| Last commit | Feb 7, 2026 |

---

## 7. Implementation Plan

### Phase 1 (M1): Foundation
- Auth flows (login, register, social)
- Landing page + About + Pricing (SSG)
- Blog (ISR) connected to CMS

### Phase 2 (M3): Commerce
- Product catalog + detail pages
- Cart + Checkout (Stripe)
- Account portal (orders, billing)

### Phase 3 (M3-M4): Community
- Help center (knowledge base)
- Documentation portal
- Chat widget
- Reviews & ratings

### Phase 4 (M4+): White-Label
- Custom domain routing
- Per-venture SEO config
- Venture-specific landing pages

---

## Document Control

| Field | Value |
|-------|-------|
| Author | MCV Engineering |
| Created | March 10, 2026 |
| Version | 1.0 |
| Prototype | mcv-one-admin-prototype/apps/web |
