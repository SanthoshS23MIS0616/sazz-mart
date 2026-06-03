"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BadgeCheck, Boxes, CreditCard, LogOut, PackageCheck, Search, ShieldCheck, ShoppingBag, Sparkles, Star,Truck, UserRound } from "lucide-react";
import type { CartItem, Product, PublicUser } from "@/types/commerce";

type AuthMode = "login" | "register";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "user@lunamart.com", password: "User@123" });
  const [address, setAddress] = useState("Coimbatore, Tamil Nadu");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("luna-cart");
    if (stored) setCart(JSON.parse(stored));
    void refreshProducts();
    void fetch("/api/auth/me").then((response) => response.json()).then((data) => setUser(data.user));
  }, []);

  useEffect(() => {
    localStorage.setItem("luna-cart", JSON.stringify(cart));
  }, [cart]);

  async function refreshProducts() {
    setLoading(true);
    const response = await fetch("/api/products", { cache: "no-store" });
    const data = await response.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);

  const visibleProducts = useMemo(() => {
    const needle = query.toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const haystack = `${product.name} ${product.description} ${product.category} ${product.tags.join(" ")}`.toLowerCase();
      return matchesCategory && haystack.includes(needle);
    });
  }, [products, query, category]);

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        return product ? { product, quantity: item.quantity } : null;
      })
      .filter(Boolean) as Array<{ product: Product; quantity: number }>;
  }, [cart, products]);

  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal > 3999 ? 0 : 149;
  const total = subtotal + shipping;
  const freeShippingGap = Math.max(0, 4000 - subtotal);

  function addToCart(product: Product) {
    setMessage(`${product.name} added to cart`);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) => (item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item));
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    const product = products.find((candidate) => candidate.id === productId);
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, quantity: Math.min(quantity, product?.stock || quantity) } : item)));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Authentication failed");
      return;
    }
    setUser(data.user);
    setShowAuth(false);
    setMessage(`Welcome, ${data.user.name}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMessage("Logged out successfully");
  }

  async function checkout() {
    if (!user) {
      setShowAuth(true);
      setMessage("Login to place your order");
      return;
    }
    if (cart.length === 0) {
      setMessage("Your cart is empty");
      return;
    }
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, address, paymentMethod: "Cash on delivery" })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Checkout failed");
      return;
    }
    setCart([]);
    await refreshProducts();
    setMessage(`Order ${data.order.id.slice(-6).toUpperCase()} placed. Live tracking is ready.`);
  }

  return (
    <main className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <Link href="/" className="brand" aria-label="Sazz Mart home">
          <span className="brand-mark"><ShoppingBag size={22} /></span>
          <span>SAZZ MART</span>
        </Link>
        <nav className="nav-actions">
          <Link href="/orders" className="ghost-button"><PackageCheck size={18} /> Orders</Link>
          {user?.role === "admin" && <Link href="/admin" className="ghost-button"><ShieldCheck size={18} /> Admin</Link>}
          {user ? (
            <button className="ghost-button" onClick={logout}><LogOut size={18} /> {user.name}</button>
          ) : (
            <button className="primary-button compact" onClick={() => setShowAuth(true)}><UserRound size={18} /> Login</button>
          )}
        </nav>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} /> Find it. Love it. Own it.</p>
          <h1>Sazz Mart</h1>
          <p className="hero-text">Trendy picks, smooth shopping, and everyday favorites brought together in one place you will remember.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#catalog"><ShoppingBag size={19} /> Shop catalog</a>
            <button className="ghost-button strong" onClick={() => { setShowAuth(true); setAuthMode("login"); setAuthForm((form) => ({ ...form, email: "admin@lunamart.com", password: "Admin@123" })); }}>
              <ShieldCheck size={18} /> Try admin
            </button>
          </div>
        </div>
            <aside className="insight-panel">
          <div className="insight-header">
            <span><Truck size={20} /> Smart Cart Coach</span>
            <BadgeCheck size={20} />
          </div>
          <p>{subtotal === 0 ? "Add products to unlock stock alerts, free-shipping guidance, and real-time order tracking." : freeShippingGap > 0 ? `Add ${currency.format(freeShippingGap)} more to unlock free delivery.` : "Free delivery unlocked. Your cart is optimized."}</p>
          <div className="metric-row">
            <span>Cart value</span>
            <strong>{currency.format(subtotal)}</strong>
          </div>
          <div className="progress"><span style={{ width: `${Math.min(100, (subtotal / 4000) * 100)}%` }} /></div>
        </aside>
      </section>

      <section id="catalog" className="workbench">
        <div className="catalog">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Boxes size={16} /> Product catalog</p>
              <h2>Curated products</h2>
            </div>
            <label className="search-box">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, tags, categories" />
            </label>
          </div>

          <div className="chips" role="list" aria-label="Product categories">
            {categories.map((item) => (
              <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>

          {loading ? <div className="empty-state">Loading the catalog...</div> : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image" style={{ backgroundImage: `url(${product.image})` }}>
                    <span>{product.category}</span>
                  </div>
                  <div className="product-body">
                    <div className="product-title">
                      <h3>{product.name}</h3>
                      <span><Star size={15} fill="currentColor" /> {product.rating}</span>
                    </div>
                    <p>{product.description}</p>
                    <div className="tag-row">{product.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <div className="buy-row">
                      <strong>{currency.format(product.price)}</strong>
                      <button className="primary-button compact" disabled={product.stock === 0} onClick={() => addToCart(product)}>
                        <ShoppingBag size={17} /> {product.stock ? "Add" : "Sold"}
                      </button>
                    </div>
                    <small className={product.stock < 10 ? "stock low" : "stock"}>{product.stock < 10 ? `Only ${product.stock} left` : `${product.stock} in stock`}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-panel">
          <div className="section-heading slim">
            <div>
              <p className="eyebrow"><CreditCard size={16} /> Checkout</p>
              <h2>Your cart</h2>
            </div>
            <span className="cart-count">{cartLines.length}</span>
          </div>

          {cartLines.length === 0 ? <div className="empty-state">Your selected items will appear here.</div> : (
            <div className="cart-list">
              {cartLines.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <img src={product.image} alt="" />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{currency.format(product.price)} each</span>
                    <div className="quantity-control">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="field">
            Delivery address
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} />
          </label>

          <div className="summary">
            <span>Subtotal <strong>{currency.format(subtotal)}</strong></span>
            <span>Shipping <strong>{shipping ? currency.format(shipping) : "Free"}</strong></span>
            <span className="total">Total <strong>{currency.format(total)}</strong></span>
          </div>
          <button className="primary-button checkout" onClick={checkout}><CreditCard size={19} /> Place order</button>
          {message && <p className="toast-message">{message}</p>}
        </aside>
      </section>

      {showAuth && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="auth-modal" onSubmit={submitAuth}>
            <div className="section-heading slim">
              <div>
                <p className="eyebrow"><UserRound size={16} /> {authMode === "login" ? "Welcome back" : "Create account"}</p>
                <h2>{authMode === "login" ? "Login" : "Register"}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowAuth(false)}>x</button>
            </div>
            {authMode === "register" && (
              <label className="field">Name<input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} /></label>
            )}
            <label className="field">Email<input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} /></label>
            <label className="field">Password<input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} /></label>
            <button className="primary-button checkout" type="submit">{authMode === "login" ? "Login" : "Create account"}</button>
            <button type="button" className="link-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "New customer? Register" : "Already have an account? Login"}
            </button>
            <p className="hint">Demo admin: admin@lunamart.com / Admin@123</p>
            <p className="hint">Demo user: user@lunamart.com / User@123</p>
          </form>
        </div>
      )}
    </main>
  );
}
