"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  productId: string;
  title: string;
  category: string;
  shopName: string;
  imageUrl: string;
  productUrl: string;
  rating: number;
  firstSeen: string;
  lastUpdated: string;
}

interface Shop {
  id: number;
  sellerId: string;
  shopName: string;
  shopImageUrl: string;
  shopUrl: string;
  region: string;
  firstSeen: string;
  lastUpdated: string;
}

const fetchProductsData = async () => {
  const res = await fetch("/api/products");
  return (await res.json()) as Product[];
};

const fetchShopsData = async () => {
  const res = await fetch("/api/shops");
  return (await res.json()) as Shop[];
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [shopUrl, setShopUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setProducts(await fetchProductsData());
  };

  const fetchShops = async () => {
    setShops(await fetchShopsData());
  };

  useEffect(() => {
    void fetchProductsData().then(setProducts);
    void fetchShopsData().then(setShops);
  }, []);

  const getErrorMessage = (e: unknown) => {
    return e instanceof Error ? e.message : "Something went wrong";
  };

  const trackProduct = async () => {
    if (!productUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/track?url=${encodeURIComponent(productUrl)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      setProductUrl("");
      fetchProducts();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const trackShop = async () => {
    if (!shopUrl) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/shops/track?url=${encodeURIComponent(shopUrl)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      setShopUrl("");
      fetchShops();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 px-6 py-8 shadow-[0_1px_40px_rgba(37,244,238,0.10)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white p-1 shadow-[6px_0_0_#fe2c55,-6px_0_0_#25f4ee]">
              <img src="logo.png" width="40" height="40" alt="ShopHype logo" />
            </div>
            <div>
              <h1 className="font-[ui-rounded,system-ui,sans-serif] text-2xl font-black tracking-wide text-[#fff9c4] drop-shadow-[0_0_15px_rgba(255,249,196,0.78)]">
                HypeShop
              </h1>
            </div>
          </div>
          <div className="rounded-full border border-[#25f4ee]/40 bg-[#25f4ee]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#25f4ee]">
            TikTok Shop radar
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Track inputs */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-h-40 rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-[0_0_35px_rgba(37,244,238,0.08)]">
            <h2 className="neon-warm-text font-semibold mb-3">Track a Product</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="Paste TikTok Shop product URL..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#25f4ee] focus:outline-none focus:ring-2 focus:ring-[#25f4ee]/30"
              />
              <button
                onClick={trackProduct}
                disabled={loading}
                className="rounded-xl bg-[#25f4ee] px-4 py-2 text-sm font-bold text-black shadow-[4px_4px_0_#fe2c55] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                Track
              </button>
            </div>
          </div>

          <div className="min-h-40 rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-[0_0_35px_rgba(254,44,85,0.08)]">
            <h2 className="neon-warm-text font-semibold mb-3">Track a Shop</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                placeholder="Paste TikTok Shop store URL..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#fe2c55] focus:outline-none focus:ring-2 focus:ring-[#fe2c55]/30"
              />
              <button
                onClick={trackShop}
                disabled={loading}
                className="neon-warm-text rounded-xl bg-[#fe2c55] px-4 py-2 text-sm font-bold shadow-[4px_4px_0_#25f4ee] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                Track
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#fe2c55]/10 border border-[#fe2c55]/40 text-red-100 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-slate-400 text-sm mb-6">
            Tracking... this may take a moment for shops
          </div>
        )}

        {/* Products */}
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-[#fff9c4] drop-shadow-[0_0_17px_rgba(255,249,196,0.78)]">
            Tracked Products ({products.length})
          </h2>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/70 p-8 text-center text-slate-500 text-sm">
              No products tracked yet. Paste a TikTok Shop product URL above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link key={product.productId} href={`/products/${product.productId}`}>
                  <div className="group min-h-36 cursor-pointer rounded-2xl border border-white/10 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-[#25f4ee]/60 hover:shadow-[0_0_30px_rgba(37,244,238,0.12)]">
                    <div className="flex gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="neon-warm-text text-sm font-semibold line-clamp-2 group-hover:text-[#25f4ee]">{product.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{product.shopName}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400 text-xs">★</span>
                          <span className="text-xs text-slate-300">{product.rating}</span>
                          <span className="text-xs text-slate-500 ml-1">{product.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Shops */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#fff9c4] drop-shadow-[0_0_17px_rgba(255,249,196,0.78)]">
            Tracked Shops ({shops.length})
          </h2>
          {shops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/70 p-8 text-center text-slate-500 text-sm">
              No shops tracked yet. Paste a TikTok Shop store URL above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <Link key={shop.sellerId} href={`/shops/${shop.sellerId}`}>
                  <div className="group min-h-32 cursor-pointer rounded-2xl border border-white/10 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-[#fe2c55]/60 hover:shadow-[0_0_30px_rgba(254,44,85,0.12)]">
                    <div className="flex gap-3 items-center">
                      {shop.shopImageUrl && (
                        <img
                          src={shop.shopImageUrl}
                          alt={shop.shopName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-[#fe2c55]/40"
                        />
                      )}
                      <div>
                        <p className="neon-warm-text text-sm font-semibold group-hover:text-[#fe2c55]">{shop.shopName}</p>
                        <p className="text-xs text-slate-400">{shop.region}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
