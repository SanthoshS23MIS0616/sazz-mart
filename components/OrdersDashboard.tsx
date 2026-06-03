"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, PackageCheck, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import type { Order, PublicUser } from "@/types/commerce";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const steps = ["placed", "packed", "shipped", "delivered"];

export default function OrdersDashboard() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void bootstrap();
    const timer = window.setInterval(() => void loadOrders(), 8000);
    return () => window.clearInterval(timer);
  }, []);

  async function bootstrap() {
    const me = await fetch("/api/auth/me").then((response) => response.json());
    setUser(me.user);
    await loadOrders();
    setLoading(false);
  }

  async function loadOrders() {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setOrders(data.orders || []);
    }
  }

  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  if (loading) return <main className="shell center-page"><div className="empty-state">Loading your orders...</div></main>;

  if (!user) {
    return (
      <main className="shell center-page">
        <div className="access-panel">
          <PackageCheck size={42} />
          <h1>Login to view order tracking</h1>
          <p>Your live order history is protected behind your customer account.</p>
          <Link className="primary-button" href="/"><ArrowLeft size={18} /> Back to store</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark"><ArrowLeft size={21} /></span><span>Order Tracking</span></Link>
        <button className="ghost-button strong" onClick={() => void loadOrders()}><RefreshCcw size={18} /> Refresh</button>
      </header>

      <section className="admin-hero">
        <div>
          <p className="eyebrow"><Truck size={16} /> Real-time useful feature</p>
          <h1>Live order movement with automatic progress updates</h1>
          <p className="hero-text">The system refreshes your order state and shows packed, shipped, and delivered progress as your purchase moves forward.</p>
        </div>
        <div className="stat-grid two">
          <div><PackageCheck size={21} /><span>Total orders</span><strong>{orders.length}</strong></div>
          <div><ShieldCheck size={21} /><span>Total spent</span><strong>{currency.format(totalSpent)}</strong></div>
        </div>
      </section>

      <section className="order-grid page-orders">
        {orders.length === 0 && <div className="empty-state">No orders yet. Place a checkout from the home page.</div>}
        {orders.map((order) => {
          const activeIndex = order.status === "cancelled" ? -1 : steps.indexOf(order.status);
          return (
            <article className="tracking-card" key={order.id}>
              <div className="order-top">
                <div>
                  <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <span className={`status-pill ${order.status}`}>{order.status}</span>
              </div>
              <div className="timeline">
                {steps.map((step, index) => (
                  <div key={step} className={index <= activeIndex ? "timeline-step done" : "timeline-step"}>
                    <span>{index <= activeIndex ? <PackageCheck size={16} /> : <Clock3 size={16} />}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
              <div className="ordered-items">
                {order.items.map((item) => (
                  <div key={item.productId}>
                    <img src={item.image} alt="" />
                    <span>{item.name} x {item.quantity}</span>
                    <strong>{currency.format(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="summary tracking-summary">
                <span>Payment <strong>{order.paymentMethod}</strong></span>
                <span>Delivery <strong>{order.address}</strong></span>
                <span className="total">Total <strong>{currency.format(order.total)}</strong></span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
