"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTikTokProductUrl } from "@/app/lib/tiktok-url";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Product {
  productId: string;
  title: string;
  category: string;
  shopName: string;
  sellerId: string;
  imageUrl: string;
  productUrl: string;
  rating: number;
}

interface Snapshot {
  snapshotDate: string;
  price: number;
  originalPrice: number;
  discount: string;
  sold: number;
  reviews: number;
  rating: number;
  stock: number;
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

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, historyRes] = await Promise.all([
        fetch("/api/products"),
        fetch(`/api/products/${productId}/history`),
      ]);
      const products = await productsRes.json();
      const history = await historyRes.json();
      const found = products.find((p: Product) => p.productId === productId);
      setProduct(found || null);
      setSnapshots(history);
      setLoading(false);
    };
    fetchData();
  }, [productId]);

  if (loading) return <div className="min-h-screen bg-[#050505] p-8 text-slate-400">Loading...</div>;
  if (!product) return <div className="min-h-screen bg-[#050505] p-8 text-slate-400">Product not found.</div>;

  const latest = snapshots[snapshots.length - 1];
  const productTikTokUrl = getTikTokProductUrl(product);

  return (
    <main className="min-h-screen bg-[#050505] text-slate-100">
      <div className="border-b border-white/10 bg-black/80 px-6 py-4 shadow-[0_1px_40px_rgba(37,244,238,0.10)] backdrop-blur">
        <Link href="/" className="text-sm font-semibold text-[#25f4ee] hover:text-[#fffdf0]">← Back</Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 min-h-44 rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-[0_0_35px_rgba(37,244,238,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 ring-1 ring-white/10"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="neon-warm-text text-xl font-black">{product.title}</h1>
              <p className="text-sm text-slate-400 mt-1">{product.shopName} · {product.category}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-slate-300">{product.rating}</span>
              </div>
              <a
                href={productTikTokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#25f4ee] hover:text-[#fffdf0] mt-1 inline-block"
              >
                View on TikTok Shop ↗
              </a>
            </div>

            {latest && (
              <div className="grid flex-shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">${latest.price}</p>
                  {latest.originalPrice > latest.price && (
                    <p className="text-xs text-slate-500 line-through">${latest.originalPrice}</p>
                  )}
                  <p className="text-xs text-[#25f4ee] font-semibold">{latest.discount}</p>
                  <p className="text-xs text-slate-500 mt-1">Current Price</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">{latest.sold?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Sold</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">{latest.reviews?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">{latest.stock?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">In Stock</p>
                </div>
                <div className="text-center">
                  <p className="neon-warm-text text-2xl font-black">
                  ${((latest.price * latest.sold) / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Est. Product Revenue</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {snapshots.length < 1 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/70 p-8 text-center text-slate-500 text-sm">
            Not enough data yet for charts. Check back after the next daily snapshot.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="neon-warm-text font-semibold mb-4">Price History</h2>
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
                  <Tooltip
                  contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#f8fafc" }}
                  labelFormatter={formatTooltipDate}
                  />
                  <Line type="monotone" dataKey="price" stroke="#25f4ee" strokeWidth={3} dot={false} name="Sale Price" />
                  <Line type="monotone" dataKey="originalPrice" stroke="#fe2c55" strokeWidth={2} dot={false} name="Original Price" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="neon-warm-text font-semibold mb-4">Units Sold Over Time</h2>
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
                  <Tooltip
                  contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#f8fafc" }}
                  labelFormatter={formatTooltipDate}
                  />
                  <Line type="monotone" dataKey="sold" stroke="#fe2c55" strokeWidth={3} dot={false} name="Total Sold" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="min-h-96 rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="neon-warm-text font-semibold mb-4">Stock Level Over Time</h2>
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
                  <Line type="monotone" dataKey="stock" stroke="#25f4ee" strokeWidth={3} dot={false} name="Stock" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
