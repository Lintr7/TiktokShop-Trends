# HypeShop 📈🔥

A TikTok Shop analytics tracker —> think CamelCamelCamel for TikTok Shop. Track product prices, sales velocity, stock levels, and shop-level revenue estimates over time. 
**Live:** https://hypeshop.up.railway.app

---

## Purpose

HypeShop lets users track TikTok Shop products and shops over time, capturing daily snapshots of:
- Price changes and discount history
- Units sold (lifetime and over time)
- Stock levels
- Shop revenue estimates
- Shop performance metrics (rating, followers, response rate)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5 |
| ORM | Spring Data JPA / Hibernate |
| Database | PostgreSQL 16 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Charts | Recharts |
| API Source | RapidAPI — `tiktok-shop-products-search-reviews` |
| Deployment | Railway (backend + frontend + PostgreSQL) |
| Build Tool | Maven |

---

## Architecture

```
Next.js Frontend (hypeshop.up.railway.app)
        │
        │ /api/* proxy (next.config.ts rewrites)
        ▼
Spring Boot Backend (tiktokshop-trends-production.up.railway.app)
        │
        ├── GET /shop/product?product_id=...     (single product + shop stats)
        └── GET /shop/products?url=...&shop_id=... (all shop products)
        │
        ▼
PostgreSQL (Railway managed)
```

---

## API

All data comes from a single RapidAPI endpoint: `tiktok-shop-products-search-reviews.p.rapidapi.com`

**Endpoints used:**
- `GET /shop/product?product_id={id}` — Full product detail, shop stats, seller info, related videos
- `GET /shop/products?url={url}&shop_id={id}` — All products in a shop with pagination

**Key quirks:**
- All array-like fields use string-keyed objects (`"0"`, `"1"`) not actual JSON arrays
- `seller_detail_infos` and `shop_performance` are nested under `data.seller`
- `seller.rating` is a string, not a number
- Price ranges use `min_sku_price` instead of `real_price`

---

## Database Schema

### `products`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-generated |
| product_id | VARCHAR UNIQUE | TikTok product ID |
| title | VARCHAR(500) | Product title |
| category | VARCHAR | e.g. Health, Beauty |
| shop_name | VARCHAR | Seller shop name |
| seller_id | VARCHAR | TikTok seller ID |
| image_url | VARCHAR(1000) | Product image |
| product_url | VARCHAR(1000) | TikTok Shop PDP URL |
| rating | DOUBLE | Product rating |
| first_seen | TIMESTAMP | When first tracked |
| last_updated | TIMESTAMP | Last refresh time |

### `product_snapshots`
Daily snapshot per product. Unique on `(product_id, snapshot_date)`.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-generated |
| product_id | BIGINT FK | References products |
| snapshot_date | DATE | Date of snapshot |
| price | DOUBLE | Sale price |
| original_price | DOUBLE | Original/strikethrough price |
| discount | VARCHAR | e.g. "68%" |
| sold | INT | Lifetime units sold |
| reviews | INT | Review count |
| rating | DOUBLE | Rating at snapshot time |
| stock | INT | Units in stock (SKU 0) |

### `shops`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-generated |
| seller_id | VARCHAR UNIQUE | TikTok seller ID |
| shop_name | VARCHAR | Shop display name |
| shop_image_url | VARCHAR | Shop avatar |
| shop_url | VARCHAR | TikTok store URL |
| region | VARCHAR | e.g. United States of America |
| first_seen | TIMESTAMP | When first tracked |
| last_updated | TIMESTAMP | Last refresh time |

### `shop_snapshots`
Daily snapshot per shop. Unique on `(shop_id, snapshot_date)`.

| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-generated |
| shop_id | BIGINT FK | References shops |
| snapshot_date | DATE | Date of snapshot |
| total_sold_count | BIGINT | Sum of sold across all products |
| total_revenue_estimate | DECIMAL | Sum of (price × sold) across all products |
| shop_performance | INT | Percentile vs other shops (0-100) |
| shop_rating | DOUBLE | Shop rating (e.g. 4.5) |
| followers_count | BIGINT | Follower count |
| review_count | INT | Total shop reviews |
| on_sell_product_count | INT | Active product listings |
| product_satisfaction_score | INT | % 4+ star ratings |
| top_product_id1 | VARCHAR | Highest sold product ID |
| top_product_id2 | VARCHAR | 2nd highest sold product ID |
| top_product_id3 | VARCHAR | 3rd highest sold product ID |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/products/track?url=` | Track a product by TikTok Shop URL |
| GET | `/api/products` | Get all tracked products |
| GET | `/api/products/{productId}/history` | Get snapshot history for a product |
| POST | `/api/products/{productId}/refresh` | Force refresh a product |
| POST | `/api/shops/track?url=` | Track a shop by TikTok Shop URL |
| GET | `/api/shops` | Get all tracked shops |
| GET | `/api/shops/{sellerId}/history` | Get snapshot history for a shop |
| POST | `/api/shops/{sellerId}/refresh` | Force refresh a shop |

---

## Tracking Logic

**Product tracking (`POST /api/products/track`):**
1. Extract product ID from URL
2. Call `/shop/product` — 1 API call
3. Save/update product record
4. Save daily product snapshot (price, sold, stock, reviews)
5. Save/update shop record (no snapshot created from product tracking)

**Shop tracking (`POST /api/shops/track`):**
1. Extract seller ID from URL
2. Paginate through `/shop/products` to fetch all products — 1-3 API calls
3. Calculate total sold count and revenue estimate across all products
4. Call `/shop/product` on top 3 products — 3 API calls (for stock + category)
5. Save top 3 products and their snapshots
6. Save daily shop snapshot with revenue, performance, top products

**Scheduled refresh:** Daily at 6AM UTC via Spring `@Scheduled` cron.

---

## Revenue Estimate Methodology

`total_revenue_estimate = Σ (current_sale_price × lifetime_sold_count)` across all products.

This is a lifetime estimate using the current price — the same methodology used by Kalodata and FastMoss. Actual historical revenue may differ due to past price changes, which is exactly why daily snapshots are captured.

---

## API Quota

Using RapidAPI Pro plan — 6,000 requests/month.

| Operation | API calls |
|---|---|
| Track product | 1 |
| Track shop | 4-6 |
| Daily refresh (per product) | 1 |
| Daily refresh (per shop) | 4-6 |

---

## Local Development

**Prerequisites:** Java 21, Maven, PostgreSQL, Node.js 18+

```bash
# Backend
cd tiktok-tracker
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Frontend
cd frontend
npm install
npm run dev
```

**Local config** (`application-local.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/tiktok_tracker
spring.datasource.username=your_username
spring.datasource.password=your_password
rapidapi.key.shop=your_rapidapi_key
```

---

## Roadmap

- [ ] User authentication (multi-user support)
- [ ] Price drop alerts / email notifications
- [ ] Related videos section on product pages
- [ ] Trending categories dashboard
- [ ] Rate limiting (100 requests/day per IP)
- [ ] Deploy frontend to Railway
