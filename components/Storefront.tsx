"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { BadgeCheck, Boxes, CreditCard, LogOut, PackageCheck, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, UserRound } from "lucide-react";
import type { CartItem, Product, PublicUser, Role } from "@/types/commerce";

type AuthMode = "login" | "register";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Storefront() {
  const { data: session, status } = useSession();

  const user: PublicUser | null = session?.user
    ? {
        id: (session.user as any).id || "",
        name: session.user.name || "",
        email: session.user.email || "",
        role: ((session.user as any).role || "user") as Role,
        createdAt: "",
      }
    : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [address, setAddress] = useState("Coimbatore, Tamil Nadu");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("luna-cart");
    if (stored) setCart(JSON.parse(stored));
    void refreshProducts();
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

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const visibleProducts = useMemo(() => {
    const needle = query.toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const haystack = `${p.name} ${p.description} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      return matchesCategory && haystack.includes(needle);
    });
  }, [products, query, category]);

  const cartLines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
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
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
        );
      }
      return [...current, { productId: product.id, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.min(quantity, product?.stock || quantity) } : item
      )
    );
  }

  async function handleGoogleSignIn() {
    setShowAuth(false);
    await signIn("google", { callbackUrl: "/" });
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setAuthLoading(true);

    if (authMode === "login") {
      const result = await signIn("credentials", {
        email: authForm.email,
        password: authForm.password,
        redirect: false,
      });
      if (result?.error) {
        setMessage("Invalid email or password. Please try again.");
      } else {
        setShowAuth(false);
        setMessage("Welcome back!");
      }
    } else {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        setAuthLoading(false);
        return;
      }
      await signIn("credentials", {
        email: authForm.email,
        password: authForm.password,
        redirect: false,
      });
      setShowAuth(false);
      setMessage(`Welcome, ${data.user.name}! Account created.`);
    }
    setAuthLoading(false);
  }

  async function logout() {
    await signOut({ redirect: false });
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
      body: JSON.stringify({ items: cart, address, paymentMethod: "Cash on delivery" }),
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
          {status === "loading" ? (
            <button className="ghost-button" disabled>Loading...</button>
          ) : user ? (
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
            <button
              className="ghost-button strong"
              onClick={() => { setShowAuth(true); setAuthMode("login"); setAuthForm({ name: "", email: "admin@lunamart.com", password: "Admin@123" }); }}
            >
              <ShieldCheck size={18} /> Try admin
            </button>
          </div>
        </div>
        <aside className="insight-panel">
          <div className="insight-header">
            <span><Truck size={20} /> Smart Cart Coach</span>
            <BadgeCheck size={20} />
          </div>
          <p>
            {subtotal === 0
              ? "Add products to unlock stock alerts, free-shipping guidance, and real-time order tracking."
              : freeShippingGap > 0
              ? `Add ${currency.format(freeShippingGap)} more to unlock free delivery.`
              : "Free delivery unlocked. Your cart is optimized."}
          </p>
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
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, tags, categories" />
            </label>
          </div>

          <div className="chips" role="list" aria-label="Product categories">
            {categories.map((item) => (
              <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">Loading the catalog...</div>
          ) : (
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
                    <small className={product.stock < 10 ? "stock low" : "stock"}>
                      {product.stock < 10 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                    </small>
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

          {cartLines.length === 0 ? (
            <div className="empty-state">Your selected items will appear here.</div>
          ) : (
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
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
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
          <div className="auth-modal">
            <div className="section-heading slim">
              <div>
                <p className="eyebrow"><UserRound size={16} /> {authMode === "login" ? "Welcome back" : "Create account"}</p>
                <h2>{authMode === "login" ? "Login" : "Register"}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowAuth(false)}>✕</button>
            </div>

            {authMode === "login" && (
              <>
                <button type="button" className="google-signin-btn" onClick={handleGoogleSignIn}>
                  <GoogleIcon />
                  Continue with Google
                </button>
                <div className="auth-divider"><span>or sign in with email</span></div>
              </>
            )}

            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <label className="field">
                  Name
                  <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                </label>
              )}
              <label className="field">
                Email
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
              </label>
              <label className="field">
                Password
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required minLength={6} />
              </label>
              <button className="primary-button checkout" type="submit" disabled={authLoading}>
                {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}
              </button>
              <button type="button" className="link-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                {authMode === "login" ? "New customer? Register" : "Already have an account? Login"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
