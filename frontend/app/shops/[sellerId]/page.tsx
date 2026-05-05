"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeTikTokUrl } from "@/app/lib/tiktok-url";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Shop {
  sellerId: string;
  shopName: string;
  shopImageUrl: string;
  shopUrl: string;
  region: string;
}

interface ShopSnapshot {
  snapshotDate: string;
  totalSoldCount: number;
  totalRevenueEstimate: number;
  shopPerformance: number;
  shopRating: number;
  followersCount: number;
  reviewCount: number;
  productSatisfactionScore: number;
  topProductId1: string;
  topProductId2: string;
  topProductId3: string;
}

interface Product {
  productId: string;
  title: string;
  imageUrl: string;
  rating: number;
}

const formatTooltipDate = (label: ReactNode) => {
  const date = new Date(`${label ?? ""}Z`);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
};

export default function ShopPage() {
  const { sellerId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [snapshots, setSnapshots] = useState<ShopSnapshot[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [shopsRes, historyRes, productsRes] = await Promise.all([
        fetch("/api/shops"),
        fetch(`/api/shops/${sellerId}/history`),
        fetch("/api/products"),
      ]);
      const shops = await shopsRes.json();
      const history = await historyRes.json();
      const allProducts = await productsRes.json();

      const found = shops.find((s: Shop) => s.sellerId === sellerId);
      setShop(found || null);
      setSnapshots(history);

      // Get top 3 products from latest snapshot
      if (history.length > 0) {
        const latest = history[history.length - 1];
        const ids = [latest.topProductId1, latest.topProductId2, latest.topProductId3].filter(Boolean);
        const top = ids.map((id: string) => allProducts.find((p: Product) => p.productId === id)).filter(Boolean);
        setTopProducts(top);
      }

      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  if (loading) return <div className="min-h-screen bg-[#050505] p-8 text-slate-400">Loading...</div>;
  if (!shop) return <div className="min-h-screen bg-[#050505] p-8 text-slate-400">Shop not found.</div>;

  const latest = snapshots[snapshots.length - 1];
  const shopTikTokUrl = normalizeTikTokUrl(shop.shopUrl);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-100">
      <div className="border-b border-white/10 bg-black/80 px-6 py-4 shadow-[0_1px_40px_rgba(254,44,85,0.10)] backdrop-blur">
        <Link href="/" className="text-sm font-semibold text-[#25f4ee] hover:text-[#fffdf0]">← Back</Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Shop header */}
        <div className="mb-6 min-h-44 rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-[0_0_35px_rgba(254,44,85,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {shop.shopImageUrl && (
              <img
                src={shop.shopImageUrl}
                alt={shop.shopName}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-[#fe2c55]/50"
              />
            )}
            <div className="flex-1">
              <h1 className="neon-warm-text text-xl font-black">{shop.shopName}</h1>
              <p className="text-sm text-slate-400 mt-1">{shop.region}</p>
              <a
                href={shopTikTokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#25f4ee] hover:text-[#fffdf0] mt-1 inline-block"
              >
                View on TikTok Shop ↗
              </a>
            </div>

            {latest && (
              <div className="grid flex-shrink-0 grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">
                    {latest.followersCount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Followers</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">
                    {latest.totalSoldCount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total Sold</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">
                    {latest.reviewCount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">{latest.shopPerformance}%</p>
                  <p className="text-xs text-slate-500 mt-1">Performance</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">
                    ${(latest.totalRevenueEstimate / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Est. Revenue</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 products */}
        {topProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="neon-warm-text text-lg font-bold mb-4">Top Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topProducts.map((product, i) => (
                <Link key={product.productId} href={`/products/${product.productId}`}>
                  <div className="group min-h-28 cursor-pointer rounded-2xl border border-white/10 bg-zinc-950 p-5 transition hover:-translate-y-1 hover:border-[#25f4ee]/60 hover:shadow-[0_0_30px_rgba(37,244,238,0.12)]">
                    <div className="flex gap-3 items-center">
                      <span className="text-lg font-black text-[#fe2c55]">#{i + 1}</span>
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="neon-warm-text text-xs font-semibold line-clamp-2 group-hover:text-[#25f4ee]">{product.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-400 text-xs">★</span>
                          <span className="text-xs text-slate-300">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {snapshots.length < 1 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/70 p-8 text-center text-slate-500 text-sm">
            Not enough data yet for charts. Check back after the next daily snapshot.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="neon-warm-text font-semibold mb-4">Total Units Sold Over Time</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="snapshotDate" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "#3f3f46" }} />
                  <YAxis
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={{ stroke: "#3f3f46" }}
                        domain={([dataMin, dataMax]) => {
                              const range = (dataMax as number) - (dataMin as number);
                              const fallback = Math.max(Math.abs(dataMax as number) * 0.01, 1);
                              const padding = range > 0 ? range * 0.1 : fallback;
                              return [(dataMin as number) - padding, (dataMax as number) + padding];
                        }}
                  />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#f8fafc" }} labelFormatter={formatTooltipDate} />
                  <Line type="monotone" dataKey="totalSoldCount" stroke="#fe2c55" strokeWidth={3} dot={false} name="Total Sold" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="neon-warm-text font-semibold mb-4">Revenue Estimate Over Time</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={snapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="snapshotDate" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "#3f3f46" }} />
                  <YAxis
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={{ stroke: "#3f3f46" }}
                        domain={([dataMin, dataMax]) => {
                              const range = (dataMax as number) - (dataMin as number);
                              const fallback = Math.max(Math.abs(dataMax as number) * 0.01, 1);
                              const padding = range > 0 ? range * 0.1 : fallback;
                              return [(dataMin as number) - padding, (dataMax as number) + padding];
                        }}
                  />
                  <Tooltip formatter={(value) => `$${(Number(value) / 1_000_000).toFixed(2)}M`} contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#f8fafc" }} labelFormatter={formatTooltipDate} />
                  <Line type="monotone" dataKey="totalRevenueEstimate" stroke="#25f4ee" strokeWidth={3} dot={false} name="Revenue Estimate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
