"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, BarChart3, Boxes, ClipboardList, PackagePlus, RefreshCcw, Save, ShieldCheck, Trash2, Truck } from "lucide-react";
import type { Order, OrderStatus, Product, PublicUser } from "@/types/commerce";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const statuses: OrderStatus[] = ["placed", "packed", "shipped", "delivered", "cancelled"];

const blankProduct = {
  name: "",
  category: "New",
  description: "",
  price: 999,
  stock: 10,
  rating: 4.6,
  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  tags: "featured, smart"
};

export default function AdminDashboard() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(blankProduct);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void bootstrap();
    const timer = window.setInterval(() => void loadOrders(), 10000);
    return () => window.clearInterval(timer);
  }, []);

  async function bootstrap() {
    const me = await fetch("/api/auth/me").then((response) => response.json());
    setUser(me.user);
    await Promise.all([loadProducts(), loadOrders()]);
    setLoading(false);
  }

  async function loadProducts() {
    const response = await fetch("/api/products/admin", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products || []);
    }
  }

  async function loadOrders() {
    const response = await fetch("/api/orders/admin", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setOrders(data.orders || []);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/products/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Unable to add product");
      return;
    }
    setProducts((current) => [data.product, ...current]);
    setForm(blankProduct);
    setMessage("Product added to catalog");
  }

  async function adjustStock(product: Product, stock: number) {
    const response = await fetch(`/api/products/admin/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock })
    });
    if (response.ok) {
      const data = await response.json();
      setProducts((current) => current.map((item) => (item.id === product.id ? data.product : item)));
    }
  }

  async function removeProduct(productId: string) {
    const response = await fetch(`/api/products/admin/${productId}`, { method: "DELETE" });
    if (response.ok) {
      setProducts((current) => current.filter((product) => product.id !== productId));
      setMessage("Product removed");
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const response = await fetch(`/api/orders/admin/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      const data = await response.json();
      setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
    }
  }

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const lowStock = products.filter((product) => product.stock < 10).length;
    return { revenue, lowStock, inventory: products.reduce((sum, product) => sum + product.stock, 0), orders: orders.length };
  }, [orders, products]);

  if (loading) return <main className="shell center-page"><div className="empty-state">Opening admin workspace...</div></main>;

  if (!user || user.role !== "admin") {
    return (
      <main className="shell center-page">
        <div className="access-panel">
          <ShieldCheck size={42} />
          <h1>Admin access required</h1>
          <p>Login from the home page using admin@lunamart.com / Admin@123 to manage products and orders.</p>
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
        <Link className="brand" href="/"><span className="brand-mark"><ArrowLeft size={21} /></span><span>Luna Mart Admin</span></Link>
        <button className="ghost-button strong" onClick={() => { void loadProducts(); void loadOrders(); }}><RefreshCcw size={18} /> Refresh</button>
      </header>

      <section className="admin-hero">
        <div>
          <p className="eyebrow"><ShieldCheck size={16} /> Role-based admin panel</p>
          <h1>Control products, inventory, and order movement</h1>
        </div>
        <div className="stat-grid">
          <div><BarChart3 size={21} /><span>Revenue</span><strong>{currency.format(stats.revenue)}</strong></div>
          <div><ClipboardList size={21} /><span>Orders</span><strong>{stats.orders}</strong></div>
          <div><Boxes size={21} /><span>Stock units</span><strong>{stats.inventory}</strong></div>
          <div><Truck size={21} /><span>Low stock</span><strong>{stats.lowStock}</strong></div>
        </div>
      </section>

      <section className="admin-grid">
        <form className="admin-panel" onSubmit={createProduct}>
          <div className="section-heading slim">
            <div>
              <p className="eyebrow"><PackagePlus size={16} /> Product management</p>
              <h2>Add product</h2>
            </div>
            <Save size={20} />
          </div>
          <div className="form-grid">
            <label className="field">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="field">Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label>
            <label className="field">Price<input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} required /></label>
            <label className="field">Stock<input type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} required /></label>
            <label className="field wide">Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} required /></label>
            <label className="field wide">Tags<input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></label>
            <label className="field wide">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} required /></label>
          </div>
          <button className="primary-button checkout" type="submit"><PackagePlus size={18} /> Add product</button>
          {message && <p className="toast-message">{message}</p>}
        </form>

        <div className="admin-panel">
          <div className="section-heading slim">
            <div>
              <p className="eyebrow"><Boxes size={16} /> Inventory</p>
              <h2>Live stock</h2>
            </div>
          </div>
          <div className="table-list">
            {products.map((product) => (
              <div className="table-row" key={product.id}>
                <img src={product.image} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <span>{currency.format(product.price)} · {product.category}</span>
                </div>
                <input type="number" value={product.stock} onChange={(event) => adjustStock(product, Number(event.target.value))} aria-label={`${product.name} stock`} />
                <button className="icon-button danger" onClick={() => removeProduct(product.id)} aria-label={`Delete ${product.name}`}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-panel orders-admin">
        <div className="section-heading slim">
          <div>
            <p className="eyebrow"><ClipboardList size={16} /> Order management</p>
            <h2>Track and update orders</h2>
          </div>
        </div>
        <div className="order-grid">
          {orders.length === 0 && <div className="empty-state">Orders will appear after checkout.</div>}
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-top">
                <div>
                  <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                  <span>{order.customerName} · {order.items.length} item groups</span>
                </div>
                <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <p>{order.address}</p>
              <strong>{currency.format(order.total)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
