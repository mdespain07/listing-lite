"use client";

import { useState, useEffect, useCallback } from "react";

const PIN = "2847";
const COMMISSION_CLIENT = 0.60;
const COMMISSION_BRYNN = 0.30;
const COMMISSION_BL = 0.10;
const UNSOLD_DAYS = 45;

function formatMoney(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function daysAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntilDeadline(item) {
  if (item.deadline_date) {
    const diff = new Date(item.deadline_date).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
  const startDate = item.listed_at || item.created_at;
  return Math.max(0, (item.days_listed || 45) - daysAgo(startDate));
}

function markdownStatus(item) {
  if (item.status !== "available") return null;
  const startDate = item.listed_at || item.created_at;
  const age = daysAgo(startDate);
  const total = item.days_listed || 45;
  const firstMarkdownDay = Math.floor(total * 0.31); // ~14 days on 45-day listing
  const finalMarkdownDay = Math.floor(total * 0.67); // ~30 days on 45-day listing
  if (age >= finalMarkdownDay && !item.final_markdown_at) return "final";
  if (age >= firstMarkdownDay && !item.first_markdown_at) return "first";
  return null;
}

function statusBadge(status, item) {
  const remaining = typeof item === "object" ? daysUntilDeadline(item) : Math.max(0, (45) - daysAgo(item));
  const urgent = status === "available" && remaining <= 7;
  const map = {
    available: urgent
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-emerald-50 border-emerald-200 text-emerald-800",
    sold: "bg-blue-50 border-blue-200 text-blue-800",
    donated: "bg-gray-50 border-gray-200 text-gray-600",
    picked_up: "bg-gray-50 border-gray-200 text-gray-600",
  };
  const labels = {
    available: urgent ? `⚠ ${remaining}d left` : "Available",
    sold: "Sold",
    donated: "Donated",
    picked_up: "Picked Up",
  };
  return { cls: map[status] ?? map.available, label: labels[status] ?? status };
}

function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`${className} animate-spin text-[#2A6B52]`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", className = "" }) {
  const base = "touch-manipulation inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#2A6B52] text-white hover:opacity-90 min-h-[40px]",
    outline: "border-2 border-[#2A6B52] text-[#2A6B52] hover:bg-[#F4F9F7] min-h-[40px]",
    ghost: "border border-[#E8EDE9] text-[#4A5568] hover:bg-[#F4F9F7] min-h-[40px]",
    danger: "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 min-h-[40px]",
    sm: "bg-[#2A6B52] text-white hover:opacity-90 min-h-[34px] text-xs px-3 py-1.5",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, itemNumber, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#1A3A32]/40 backdrop-blur-[2px]" aria-hidden />
      <div className="relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[20px] border border-[#E8EDE9] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8EDE9] px-6 py-4">
          <div>
            {itemNumber ? (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">{itemNumber}</p>
            ) : null}
            <h3 className="font-serif text-xl font-medium text-[#1A3A32]">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F4F9F7] text-[#7A8F88]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  useEffect(() => {
    const expiry = localStorage.getItem("bl_admin_authed");
    if (expiry && Date.now() < Number(expiry)) {
      setAuthed(true);
    }
  }, []);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [sortBy, setSortBy] = useState("intake_date");

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // Mark sold modal
  const [soldModal, setSoldModal] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [soldBusy, setSoldBusy] = useState(false);

  // Generate listing
  const [generatingListing, setGeneratingListing] = useState(false);
  const [selectedListingPlatform, setSelectedListingPlatform] = useState("general");
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    facebook: false,
    poshmark: false,
    ebay: false,
    general: false,
  });

  // Listing URLs
  const [listingUrls, setListingUrls] = useState(["", "", "", ""]);
  const [savingUrls, setSavingUrls] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [selectedClientSession, setSelectedClientSession] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  const handlePin = () => {
    if (pin === PIN) {
      const expiry = Date.now() + 3 * 60 * 60 * 1000;
      localStorage.setItem("bl_admin_authed", String(expiry));
      setAuthed(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN.");
      setPin("");
    }
  };

  // Flatten all items with session info
  const allItems = sessions.flatMap((s) =>
    (s.intake_items || []).map((item) => ({ ...item, session: s }))
  );

  // Filter + sort
  const filteredItems = allItems
    .filter((item) => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterClient && !item.session.client_name.toLowerCase().includes(filterClient.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "intake_date") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "intake_date_asc") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "deadline") return daysUntilDeadline(a) - daysUntilDeadline(b);
      if (sortBy === "client") return a.session.client_name.localeCompare(b.session.client_name);
      if (sortBy === "client_desc") return b.session.client_name.localeCompare(a.session.client_name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "price_high") return (b.price_ceiling || 0) - (a.price_ceiling || 0);
      if (sortBy === "price_low") return (a.price_floor || 0) - (b.price_floor || 0);
      if (sortBy === "sale_price") return (b.sale_price || 0) - (a.sale_price || 0);
      return 0;
    });

  // Stats
  const availableItems = allItems.filter((i) => i.status === "available");
  const soldItems = allItems.filter((i) => i.status === "sold");
  const totalRevenue = soldItems.reduce((sum, i) => sum + (i.sale_price || 0), 0);
  const brynnEarnings = totalRevenue * COMMISSION_BRYNN;
  const blEarnings = totalRevenue * COMMISSION_BL;
  const urgentItems = availableItems.filter((i) => daysUntilDeadline(i) <= 7);

  const openItem = (item) => {
    setSelectedItem(item);
    setSelectedSession(item.session);
    setListingUrls([
      item.listing_url_1 || "",
      item.listing_url_2 || "",
      item.listing_url_3 || "",
      item.listing_url_4 || "",
    ]);
    setSoldModal(false);
    setSalePrice("");
    setSelectedListingPlatform("general");
  };

  const closeItem = () => {
    setSelectedItem(null);
    setSelectedSession(null);
    setSelectedPlatforms({ facebook: false, poshmark: false, ebay: false, general: false });
  };

  const patchItem = async (itemId, updates) => {
    const res = await fetch("/api/dashboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    return data.item;
  };

  const patchSession = async (sessionId, updates) => {
    const res = await fetch("/api/dashboard/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    return data.session;
  };

  const deleteItem = async (itemId) => {
    const res = await fetch("/api/dashboard", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    return data;
  };

  const deleteSession = async (sessionId, eraseAll = false) => {
    const res = await fetch("/api/dashboard/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, eraseAll }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    return data;
  };

  const addToCart = (item) => {
    if (cart.find((c) => c.id === item.id)) return;
    setCart((prev) => [...prev, {
      id: item.id,
      item_number: item.item_number,
      item_title: item.item_title,
      photo_url: item.photo_url,
      price_floor: item.price_floor,
      price_ceiling: item.price_ceiling,
      current_price: item.current_price || item.price_ceiling,
      session: item.session,
      salePrice: item.current_price || item.price_ceiling,
    }]);
    setCartOpen(true);
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const updateCartPrice = (itemId, price) => {
    setCart((prev) => prev.map((c) => c.id === itemId ? { ...c, salePrice: price } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (parseFloat(c.salePrice) || 0), 0);

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/dashboard/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, salePrice: parseFloat(c.salePrice) || 0 })),
          paymentMethod,
          total: cartTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setCheckoutSuccess(paymentMethod);
      setCart([]);
      await fetchData();
      setTimeout(() => { setCheckoutSuccess(null); setCartOpen(false); }, 3000);
    } catch (e) {
      alert(e.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  const handleMarkSold = async () => {
    if (!salePrice || !selectedItem) return;
    setSoldBusy(true);
    try {
      const updated = await patchItem(selectedItem.id, {
        status: "sold",
        sale_price: parseFloat(salePrice),
        sold_at: new Date().toISOString(),
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
      setSoldModal(false);
      setSalePrice("");
      // Fire sale notification emails — don't block on failure
      fetch("/api/notifications/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItem.id, salePrice: parseFloat(salePrice) }),
      }).catch((e) => console.error("Sale notification failed:", e));
    } catch (e) {
      alert(e.message);
    } finally {
      setSoldBusy(false);
    }
  };

  const handleUndoSold = async () => {
    if (!selectedItem) return;
    if (!confirm("Undo this sale? The item will be marked available again and the sale price cleared.")) return;
    try {
      const updated = await patchItem(selectedItem.id, {
        status: "available",
        sale_price: null,
        sold_at: null,
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMarkResolved = async (status) => {
    if (!selectedItem) return;
    try {
      const updated = await patchItem(selectedItem.id, {
        status,
        resolved_at: new Date().toISOString(),
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMarkListed = async () => {
    if (!selectedItem) return;
    try {
      const updated = await patchItem(selectedItem.id, {
        listed_at: new Date().toISOString(),
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleGenerateListing = async () => {
    if (!selectedItem?.photo_url) {
      alert("No photo available for this item. Make sure a photo was uploaded during intake.");
      return;
    }
    setGeneratingListing(true);
    try {
      // Fetch the image from Supabase Storage and convert to base64
      const imgRes = await fetch(selectedItem.photo_url);
      if (!imgRes.ok) throw new Error("Could not load item photo.");
      const blob = await imgRes.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const activePlatforms = Object.entries(selectedPlatforms)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [base64],
          platforms: activePlatforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      const updated = await patchItem(selectedItem.id, {
        listing_title: data.listingTitle,
        listing_description: data.listingDescription,
        listing_data: data.listings ?? null,
        listing_generated_at: new Date().toISOString(),
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message);
    } finally {
      setGeneratingListing(false);
    }
  };

  const handleSaveUrls = async () => {
    if (!selectedItem) return;
    setSavingUrls(true);
    try {
      const updated = await patchItem(selectedItem.id, {
        listing_url_1: listingUrls[0] || null,
        listing_url_2: listingUrls[1] || null,
        listing_url_3: listingUrls[2] || null,
        listing_url_4: listingUrls[3] || null,
      });
      await fetchData();
      setSelectedItem((prev) => ({ ...prev, ...updated }));
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingUrls(false);
    }
  };

  // Commission for a session
  const sessionCommission = (session) => {
    const sold = (session.intake_items || []).filter((i) => i.status === "sold");
    const total = sold.reduce((sum, i) => sum + (i.sale_price || 0), 0);
    return {
      total,
      client: total * COMMISSION_CLIENT,
      brynn: total * COMMISSION_BRYNN,
      bl: total * COMMISSION_BL,
    };
  };

  // PIN SCREEN
  if (!authed) {
    return (
      <div className="min-h-dvh bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased flex flex-col">
        <header className="border-b border-[#E8EDE9] bg-white px-4 py-4">
          <div className="mx-auto max-w-6xl">
            <img src="/logo.svg" alt="BrightListed" className="h-10 w-auto" />
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">BrightListed</p>
            <h1 className="font-serif mt-3 text-4xl font-medium text-[#1A3A32]">Inventory Dashboard</h1>
            <p className="mt-2 text-lg text-[#7A8F88]">Enter your PIN to continue</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            {pinError && <p className="rounded-[10px] bg-red-50 px-4 py-3 text-base text-red-700">{pinError}</p>}
            <input
              type="password" inputMode="numeric" value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePin(); }}
              placeholder="••••"
              className="min-h-[56px] w-full rounded-[12px] border border-[#E8EDE9] bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#1A3A32] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30"
            />
            <button type="button" onClick={handlePin}
              className="w-full min-h-[52px] rounded-[12px] bg-[#2A6B52] text-white text-base font-semibold uppercase tracking-[0.16em] hover:opacity-90">
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <header className="border-b border-[#E8EDE9] bg-white px-4 py-4 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="BrightListed" className="h-10 w-auto" />
            <span className="hidden sm:block text-sm font-semibold uppercase tracking-[0.18em] text-[#7A8F88]">Inventory Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/intake" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52] hover:underline underline-offset-2">
              + New Intake
            </a>
            <button type="button" onClick={fetchData} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8EDE9] hover:bg-[#F4F9F7] text-[#7A8F88]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 items-center gap-2 rounded-full border border-[#E8EDE9] px-3 hover:bg-[#F4F9F7] text-[#1A3A32] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span className="text-sm font-semibold">Sale</span>
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2A6B52] text-[10px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {error && <p className="rounded-[10px] bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active Items", value: availableItems.length, sub: `${urgentItems.length} expiring soon`, urgent: urgentItems.length > 0 },
            { label: "Sold Items", value: soldItems.length, sub: "all time" },
            { label: "Total Revenue", value: formatMoney(totalRevenue), sub: "from sales" },
            { label: "Brynn Earnings", value: formatMoney(brynnEarnings), sub: `BL: ${formatMoney(blEarnings)}` },
          ].map(({ label, value, sub, urgent }) => (
            <div key={label} className={`rounded-[16px] border bg-white p-5 ${urgent ? "border-amber-200 bg-amber-50/50" : "border-[#E8EDE9]"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">{label}</p>
              <p className={`font-serif mt-2 text-3xl font-medium ${urgent ? "text-amber-700" : "text-[#1A3A32]"}`}>{value}</p>
              <p className="mt-1 text-sm text-[#7A8F88]">{sub}</p>
            </div>
          ))}
        </div>
        {(() => {
          // Find most recent Friday
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
          const daysSinceFriday = dayOfWeek >= 5 ? dayOfWeek - 5 : dayOfWeek + 2;
          const lastFriday = new Date(now);
          lastFriday.setDate(now.getDate() - daysSinceFriday);
          lastFriday.setHours(0, 0, 0, 0);

          const weekItems = sessions
            .flatMap((s) => s.intake_items || [])
            .filter((i) => i.status === "sold" && i.sold_at && new Date(i.sold_at) >= lastFriday);

          const weekRevenue = weekItems.reduce((sum, i) => sum + (i.sale_price || 0), 0);
          const weekBrynn = weekRevenue * COMMISSION_BRYNN;

          const totalPaidBrynn = sessions
            .filter((s) => s.payout_date)
            .flatMap((s) => s.intake_items || [])
            .filter((i) => i.status === "sold")
            .reduce((sum, i) => sum + (i.sale_price || 0) * COMMISSION_BRYNN, 0);

          return (
            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">
                    Brynn — This Pay Period
                  </p>
                  <p className="font-serif mt-1 text-3xl font-medium text-[#1A3A32]">
                    {formatMoney(weekBrynn)}
                  </p>
                  <p className="mt-1 text-sm text-[#7A8F88]">
                    {weekItems.length} item{weekItems.length !== 1 ? "s" : ""} sold since {lastFriday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Total Paid to Brynn</p>
                  <p className="font-serif mt-1 text-2xl font-medium text-[#2A6B52]">
                    {formatMoney(totalPaidBrynn)}
                  </p>
                  <p className="mt-1 text-sm text-[#7A8F88]">all time</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text" value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            placeholder="Search by client name…"
            className="min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-4 py-2 text-sm text-[#1A3A32] placeholder:text-[#C5D4CC] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30 w-56"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-3 py-2 text-sm text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30">
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="donated">Donated</option>
            <option value="picked_up">Picked Up</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-3 py-2 text-sm text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30">
            <option value="intake_date">Sort: Newest First</option>
            <option value="intake_date_asc">Sort: Oldest First</option>
            <option value="deadline">Sort: Deadline Soonest</option>
            <option value="client">Sort: Client Name (A–Z)</option>
            <option value="client_desc">Sort: Client Name (Z–A)</option>
            <option value="status">Sort: Status</option>
            <option value="price_high">Sort: Price High–Low</option>
            <option value="price_low">Sort: Price Low–High</option>
            <option value="sale_price">Sort: Sale Price</option>
          </select>
          {loading && <Spinner />}
        </div>

        {/* ITEMS GRID */}
        {filteredItems.length === 0 && !loading ? (
          <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-12 text-center">
            <p className="text-lg text-[#7A8F88]">No items found.</p>
            <a href="/intake" className="mt-4 inline-block text-sm font-semibold text-[#2A6B52] underline-offset-2 hover:underline">Start a new intake →</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const { cls, label } = statusBadge(item.status, item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="text-left rounded-[16px] border border-[#E8EDE9] bg-white overflow-hidden hover:shadow-[0_4px_20px_rgba(26,58,50,0.10)] hover:border-[#8FCFB0]/60 transition-all"
                >
                  <div className="aspect-[4/3] bg-[#F4F9F7] overflow-hidden">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.item_title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-10 w-10 text-[#C5D4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88] mb-0.5">{item.item_number || "—"}</p>
                      <p className="font-medium text-[#1A3A32] leading-snug line-clamp-2">{item.item_title}</p>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                      {markdownStatus(item) && (
                        <span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                          {markdownStatus(item) === "first" ? "1st Markdown" : "Final Markdown"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#7A8F88]">{item.session.client_name}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#4A5568]">{formatMoney(item.price_floor)} – {formatMoney(item.price_ceiling)}</span>
                      {item.status === "available" && (
                        <span className={`text-xs ${daysUntilDeadline(item) <= 7 ? "text-amber-600 font-semibold" : "text-[#7A8F88]"}`}>
                          {daysUntilDeadline(item)}d left
                        </span>
                      )}
                      {item.status === "sold" && (
                        <span className="text-blue-600 font-semibold text-xs">Sold {formatMoney(item.sale_price)}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#C5D4CC]">
                      Intake: {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CLIENT COMMISSION SUMMARY */}
        {sessions.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#1A3A32] mb-4">Client Payouts</h2>
            <div className="rounded-[16px] border border-[#E8EDE9] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-[#E8EDE9] bg-[#F4F9F7]">
                  <tr>
                    {["Client", "Items", "Sold", "Client Earnings", "Brynn Commission", "BrightListed", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const comm = sessionCommission(s);
                    const itemCount = (s.intake_items || []).length;
                    const soldCount = (s.intake_items || []).filter((i) => i.status === "sold").length;
                    return (
                      <tr key={s.id} className="border-b border-[#E8EDE9] last:border-0 hover:bg-[#F4F9F7]/50">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => setSelectedClientSession(s)} className="text-left hover:underline underline-offset-2">
                            <p className="font-medium text-[#2A6B52]">{s.client_name}</p>
                            <p className="text-xs text-[#7A8F88]">{s.client_email}</p>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#4A5568]">{itemCount}</td>
                        <td className="px-4 py-3 text-[#4A5568]">{soldCount}</td>
                        <td className="px-4 py-3 font-semibold text-[#1A3A32]">{formatMoney(comm.client)}</td>
                        <td className="px-4 py-3 text-[#4A5568]">{formatMoney(comm.brynn)}</td>
                        <td className="px-4 py-3 text-[#4A5568]">{formatMoney(comm.bl)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.payout_date ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#E8EDE9] bg-[#F4F9F7] text-[#7A8F88]"}`}>
                            {s.payout_date ? "Paid" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ITEM DETAIL MODAL */}
      <Modal open={!!selectedItem} onClose={closeItem} title={selectedItem?.item_title || "Item Detail"} itemNumber={selectedItem?.item_number}>
        {selectedItem && (
          <div className="space-y-5">
            {/* Photo */}
            {selectedItem.photo_url ? (
              <img src={selectedItem.photo_url} alt={selectedItem.item_title} className="w-full rounded-[12px] object-cover max-h-64" />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-[12px] bg-[#F4F9F7] border border-[#E8EDE9]">
                <p className="text-sm text-[#7A8F88]">No photo available</p>
              </div>
            )}

            {/* Status badge */}
            {(() => {
              const { cls, label } = statusBadge(selectedItem.status, selectedItem);
              return <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${cls}`}>{label}</span>;
            })()}

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">Item Number</span>
                <span className="font-medium text-[#1A3A32]">{selectedItem?.item_number || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">Client</span>
                <span className="font-medium text-[#1A3A32]">{selectedSession?.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">Contact</span>
                <span className="text-[#4A5568]">{selectedSession?.client_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">Intake Date</span>
                <span className="text-[#4A5568]">{new Date(selectedItem.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">Price Range</span>
                <span className="text-[#4A5568]">{formatMoney(selectedItem.price_floor)} – {formatMoney(selectedItem.price_ceiling)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8F88]">If Unsold</span>
                <span className="text-[#4A5568]">{selectedItem.if_unsold === "donate" ? "Donate" : "Client Pickup"}</span>
              </div>
              {selectedItem.status === "available" && (
                <div className="flex justify-between items-center">
                  <span className="text-[#7A8F88]">Days Remaining</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${daysUntilDeadline(selectedItem) <= 7 ? "text-amber-600" : "text-[#2A6B52]"}`}>
                      {daysUntilDeadline(selectedItem)} days
                    </span>
                    <div className="flex gap-1">
                      {[15, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={async () => {
                            const newDeadline = new Date(selectedItem.deadline_date || new Date(selectedItem.created_at).getTime() + (selectedItem.days_listed || 45) * 24 * 60 * 60 * 1000);
                            newDeadline.setDate(newDeadline.getDate() + days);
                            try {
                              const updated = await patchItem(selectedItem.id, {
                                deadline_date: newDeadline.toISOString(),
                                days_listed: (selectedItem.days_listed || 45) + days,
                              });
                              await fetchData();
                              setSelectedItem((prev) => ({ ...prev, ...updated }));
                            } catch (e) { alert(e.message); }
                          }}
                          className="rounded-full border border-[#E8EDE9] bg-[#F4F9F7] px-2 py-0.5 text-xs font-medium text-[#2A6B52] hover:bg-[#E8EDE9] transition-colors"
                        >
                          +{days}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedItem.status === "sold" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#7A8F88]">Sale Price</span>
                    <span className="font-semibold text-[#1A3A32]">{formatMoney(selectedItem.sale_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A8F88]">Client Payout</span>
                    <span className="font-semibold text-[#2A6B52]">{formatMoney((selectedItem.sale_price || 0) * COMMISSION_CLIENT)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[#7A8F88]">Marked sold in error?</span>
                    <button
                      type="button"
                      onClick={handleUndoSold}
                      className="text-xs font-semibold text-red-500 underline-offset-2 hover:underline transition-colors"
                    >
                      Undo Sale
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {selectedItem.status === "available" && (
              <div className="flex flex-wrap gap-2 border-t border-[#E8EDE9] pt-4">
                <Btn onClick={() => { addToCart(selectedItem); closeItem(); }} className="w-full">
                  {cart.find((c) => c.id === selectedItem.id) ? "✓ Already in Sale" : "Add to Sale"}
                </Btn>
                <Btn onClick={() => setSoldModal(true)} variant="outline">Mark Sold Online</Btn>
                <Btn variant="ghost" onClick={() => handleMarkResolved("donated")}>Mark Donated</Btn>
                <Btn variant="ghost" onClick={() => handleMarkResolved("picked_up")}>Mark Picked Up</Btn>
              </div>
            )}

            {selectedItem.status === "available" && markdownStatus(selectedItem) && (
              <div className="border-t border-[#E8EDE9] pt-4 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-600">
                  {markdownStatus(selectedItem) === "first" ? "First Markdown Due" : "Final Markdown Due"}
                </p>
                <div className="rounded-[10px] border border-orange-200 bg-orange-50/80 px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A5568]">Current price</span>
                    <span className="font-semibold text-[#1A3A32]">{formatMoney(selectedItem.current_price || selectedItem.price_ceiling)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A5568]">Suggested markdown</span>
                    <span className="font-semibold text-orange-700">
                      {markdownStatus(selectedItem) === "first"
                        ? formatMoney(((selectedItem.current_price || selectedItem.price_ceiling) + selectedItem.price_floor) / 2)
                        : formatMoney(selectedItem.price_floor)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={selectedItem.price_floor}
                    max={selectedItem.price_ceiling}
                    step="0.01"
                    placeholder="New price"
                    id="markdown-price-input"
                    className="flex-1 min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-3 py-2 text-sm text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
                  />
                  <Btn variant="sm" onClick={async () => {
                    const input = document.getElementById("markdown-price-input");
                    const newPrice = parseFloat(input?.value);
                    if (!newPrice || newPrice < selectedItem.price_floor) {
                      alert(`Price cannot be below the minimum of ${formatMoney(selectedItem.price_floor)}`);
                      return;
                    }
                    const isFirst = markdownStatus(selectedItem) === "first";
                    const updates = {
                      current_price: newPrice,
                      ...(isFirst ? { first_markdown_at: new Date().toISOString() } : { final_markdown_at: new Date().toISOString() }),
                    };
                    try {
                      const updated = await patchItem(selectedItem.id, updates);
                      await fetchData();
                      setSelectedItem((prev) => ({ ...prev, ...updated }));
                    } catch (e) { alert(e.message); }
                  }}>
                    Apply Markdown
                  </Btn>
                </div>
                <p className="text-xs text-[#7A8F88]">
                  Cannot go below minimum price of {formatMoney(selectedItem.price_floor)}.
                  Remember to update all live listings after applying.
                </p>
              </div>
            )}

            {selectedItem.status === "available" && (
              <div className="border-t border-[#E8EDE9] pt-4">
                <Btn variant="danger" className="w-full" onClick={async () => {
                  if (!confirm("Delete this item? This cannot be undone.")) return;
                  try {
                    await deleteItem(selectedItem.id);
                    await fetchData();
                    closeItem();
                  } catch (e) { alert(e.message); }
                }}>
                  Delete Item
                </Btn>
              </div>
            )}

            {/* Mark Sold inline */}
            {soldModal && selectedItem.status === "available" && (
              <div className="rounded-[12px] border border-[#E8EDE9] bg-[#F4F9F7] p-4 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52]">Enter Sale Price</p>
                <div className="flex gap-2">
                  <input
                    type="number" min="0" step="0.01"
                    value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-4 py-2 text-base text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
                  />
                  <Btn onClick={handleMarkSold} disabled={soldBusy || !salePrice}>
                    {soldBusy ? <Spinner className="h-4 w-4" /> : "Confirm"}
                  </Btn>
                </div>
              </div>
            )}

            {selectedItem.status !== "available" && (
              <div className="border-t border-[#E8EDE9] pt-4">
                <Btn variant="danger" className="w-full" onClick={async () => {
                  if (!confirm("Delete this item? This cannot be undone.")) return;
                  try {
                    await deleteItem(selectedItem.id);
                    await fetchData();
                    closeItem();
                  } catch (e) { alert(e.message); }
                }}>
                  Delete Item
                </Btn>
              </div>
            )}

            {/* Generate Listing */}
            <div className="border-t border-[#E8EDE9] pt-4 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">Generate Listing</p>
              <div className="space-y-2">
                <p className="text-xs text-[#7A8F88] uppercase tracking-[0.12em] font-semibold">Select platforms:</p>
                {[
                  { key: "facebook", label: "Facebook Marketplace" },
                  { key: "poshmark", label: "Poshmark" },
                  { key: "ebay", label: "eBay" },
                  { key: "general", label: "General (KSL, Craigslist, etc.)" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms[key]}
                      onChange={(e) => setSelectedPlatforms((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-[#C5D4CC] accent-[#2A6B52]"
                    />
                    <span className="text-sm text-[#1A3A32]">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn
                  variant="sm"
                  onClick={handleGenerateListing}
                  disabled={generatingListing || !Object.values(selectedPlatforms).some(Boolean)}
                  className="flex-1"
                >
                  {generatingListing
                    ? <span className="flex items-center gap-1.5"><Spinner className="h-3.5 w-3.5" /> Generating…</span>
                    : "Generate Listing"}
                </Btn>
                {selectedItem.photo_url && (
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      const platforms = Object.entries(selectedPlatforms)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(",");
                      const url = `/?item_id=${encodeURIComponent(selectedItem.item_number || "")}&photo_url=${encodeURIComponent(selectedItem.photo_url)}&platforms=${encodeURIComponent(platforms || "general")}`;
                      window.open(url, "_blank");
                    }}
                    className="flex-1"
                  >
                    Open in Listing Tool →
                  </Btn>
                )}
              </div>
              {selectedItem.listing_title && (
                <div className="rounded-[10px] border border-[#E8EDE9] bg-[#F4F9F7] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">Generated Listing</p>
                    {selectedItem.listing_generated_at && (
                      <p className="text-xs text-[#C5D4CC]">
                        {new Date(selectedItem.listing_generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  {selectedItem.listing_data && (
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "general", label: "General" },
                        { key: "facebook", label: "Facebook" },
                        { key: "ebay", label: "eBay" },
                        { key: "poshmark", label: "Poshmark" },
                      ].filter(({ key }) => {
                        const l = selectedItem.listing_data[key];
                        return l?.title || l?.description;
                      }).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedListingPlatform(key)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${selectedListingPlatform === key ? "border-[#2A6B52] bg-[#2A6B52] text-white" : "border-[#E8EDE9] bg-white text-[#4A5568] hover:border-[#8FCFB0]/60"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const listings = selectedItem.listing_data;
                    const title = listings?.[selectedListingPlatform]?.title || selectedItem.listing_title || "";
                    const description = listings?.[selectedListingPlatform]?.description || selectedItem.listing_description || "";
                    return (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8F88] mb-1">Title</p>
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-sm font-medium text-[#1A3A32] leading-snug">{title}</p>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(title)}
                              className="shrink-0 rounded-[6px] border border-[#E8EDE9] bg-white px-2 py-1 text-xs font-semibold text-[#4A5568] hover:bg-[#F4F9F7] transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        {description && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8F88] mb-1">Description</p>
                            <div className="flex items-start gap-2">
                              <p className="flex-1 text-sm text-[#4A5568] leading-relaxed whitespace-pre-wrap">{description}</p>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(description)}
                                className="shrink-0 rounded-[6px] border border-[#E8EDE9] bg-white px-2 py-1 text-xs font-semibold text-[#4A5568] hover:bg-[#F4F9F7] transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Listing URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">Live Listing URLs</p>
                {selectedItem.listed_at ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Listed {new Date(selectedItem.listed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkListed}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2A6B52] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#2A6B52] hover:bg-[#F4F9F7] transition-colors"
                  >
                    Mark as Listed
                  </button>
                )}
              </div>
              {listingUrls.map((url, i) => (
                <input
                  key={i}
                  type="url"
                  value={url}
                  onChange={(e) => setListingUrls((prev) => prev.map((u, j) => j === i ? e.target.value : u))}
                  placeholder={`Listing URL ${i + 1}`}
                  className="w-full min-h-[40px] rounded-[10px] border border-[#E8EDE9] bg-white px-3 py-2 text-sm text-[#1A3A32] placeholder:text-[#C5D4CC] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
                />
              ))}
              <Btn variant="ghost" onClick={handleSaveUrls} disabled={savingUrls} className="w-full">
                {savingUrls ? "Saving…" : "Save URLs"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!selectedClientSession}
        onClose={() => setSelectedClientSession(null)}
        title={selectedClientSession?.client_name || "Client Detail"}
      >
        {selectedClientSession && (() => {
          const comm = sessionCommission(selectedClientSession);
          const items = selectedClientSession.intake_items || [];
          return (
            <div className="space-y-5">
              <div className="rounded-[12px] border border-[#E8EDE9] bg-[#F4F9F7] p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Phone</span>
                  <span className="text-[#1A3A32]">{selectedClientSession.client_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Email</span>
                  <span className="text-[#1A3A32]">{selectedClientSession.client_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Payment</span>
                  <span className="text-[#1A3A32]">
                    {selectedClientSession.payment_preference === "venmo"
                      ? `Venmo: ${selectedClientSession.venmo_username}`
                      : `Check: ${selectedClientSession.mailing_address}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Intake Date</span>
                  <span className="text-[#1A3A32]">{new Date(selectedClientSession.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>

              <div className="rounded-[12px] border border-[#8FCFB0]/60 bg-[#F4F9F7] p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2A6B52]">Earnings Summary</p>
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Total Sales</span>
                  <span className="font-semibold text-[#1A3A32]">{formatMoney(comm.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8F88]">Client Earnings (60%)</span>
                  <span className="font-semibold text-[#2A6B52]">{formatMoney(comm.client)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7A8F88]">Payout Status</span>
                  <span className={`font-semibold ${selectedClientSession.payout_date ? "text-emerald-600" : "text-amber-600"}`}>
                    {selectedClientSession.payout_date
                      ? `Paid ${new Date(selectedClientSession.payout_date).toLocaleDateString()}`
                      : "Pending"}
                  </span>
                </div>
                {!selectedClientSession.payout_date && comm.client > 0 && (
                  <div className="space-y-2 border-t border-[#E8EDE9] pt-3 mt-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">Record Payout</p>
                    <div className="flex gap-2">
                      <select
                        id="payout-method-select"
                        defaultValue="venmo"
                        className="flex-1 min-h-[36px] rounded-[8px] border border-[#E8EDE9] bg-white px-3 py-1.5 text-sm text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
                      >
                        <option value="venmo">Venmo</option>
                        <option value="check">Check</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                      </select>
                      <Btn variant="sm" onClick={async () => {
                        const method = document.getElementById("payout-method-select").value;
                        try {
                          await patchSession(selectedClientSession.id, {
                            payout_amount: comm.client,
                            payout_date: new Date().toISOString(),
                            payout_method: method,
                          });
                          await fetchData();
                          setSelectedClientSession((prev) => ({
                            ...prev,
                            payout_amount: comm.client,
                            payout_date: new Date().toISOString(),
                            payout_method: method,
                          }));
                        } catch (e) { alert(e.message); }
                      }}>
                        Mark Paid {formatMoney(comm.client)}
                      </Btn>
                    </div>
                  </div>
                )}
                {selectedClientSession.payout_date && (
                  <div className="border-t border-[#E8EDE9] pt-3 mt-2">
                    <p className="text-xs text-[#7A8F88]">
                      Paid via {selectedClientSession.payout_method || "—"} on {new Date(selectedClientSession.payout_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <button type="button" onClick={async () => {
                      if (!confirm("Undo this payout? This will mark the client as unpaid.")) return;
                      try {
                        await patchSession(selectedClientSession.id, {
                          payout_amount: null,
                          payout_date: null,
                          payout_method: null,
                        });
                        await fetchData();
                        setSelectedClientSession((prev) => ({
                          ...prev,
                          payout_amount: null,
                          payout_date: null,
                          payout_method: null,
                        }));
                      } catch (e) { alert(e.message); }
                    }} className="mt-1 text-xs text-red-500 hover:underline underline-offset-2">
                      Undo payout
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">All Items ({items.length})</p>
                {items.map((item) => {
                  const { cls, label } = statusBadge(item.status, item);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-[10px] border border-[#E8EDE9] bg-white p-3">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.item_title} className="h-12 w-12 rounded-[6px] object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-[6px] bg-[#F4F9F7] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">{item.item_number || "—"}</p>
                        <p className="text-sm font-medium text-[#1A3A32] truncate">{item.item_title}</p>
                        <p className="text-xs text-[#7A8F88]">{formatMoney(item.price_floor)} – {formatMoney(item.price_ceiling)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                        {item.status === "sold" && (
                          <span className="text-xs font-semibold text-[#2A6B52]">{formatMoney(item.sale_price)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#E8EDE9] pt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">Data Management</p>
                <div className="flex flex-col gap-2">
                  <Btn
                    variant="danger"
                    className="w-full"
                    onClick={async () => {
                      if (!confirm(`Delete ${selectedClientSession.client_name} and all their items? This cannot be undone.`)) return;
                      try {
                        await deleteSession(selectedClientSession.id, false);
                        await fetchData();
                        setSelectedClientSession(null);
                      } catch (e) { alert(e.message); }
                    }}
                  >
                    Delete Client & All Items
                  </Btn>
                  <Btn
                    variant="ghost"
                    className="w-full"
                    onClick={async () => {
                      if (!confirm(`Erase all identifying information for ${selectedClientSession.client_name}? Sales records will be kept but all personal data will be anonymized. This cannot be undone.`)) return;
                      try {
                        await deleteSession(selectedClientSession.id, true);
                        await fetchData();
                        setSelectedClientSession(null);
                      } catch (e) { alert(e.message); }
                    }}
                  >
                    Erase Personal Data Only
                  </Btn>
                  <p className="text-xs leading-relaxed text-[#7A8F88]">
                    "Erase Personal Data" anonymizes all identifying information while keeping sales records intact — use this to comply with privacy deletion requests.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* CART PANEL */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#1A3A32]/30 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8EDE9] px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">BrightListed</p>
                <h3 className="font-serif text-2xl font-medium text-[#1A3A32]">Current Sale</h3>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8EDE9] hover:bg-[#F4F9F7] text-[#7A8F88]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {checkoutSuccess ? (
                <div className="flex flex-col items-center gap-4 pt-12 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2A6B52]/10 border border-[#8FCFB0]/40">
                    <svg className="h-10 w-10 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="font-serif text-2xl font-medium text-[#1A3A32]">Sale Complete!</p>
                  <p className="text-base text-[#7A8F88]">
                    Payment received via {checkoutSuccess}. Items marked as sold and client payouts queued.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center gap-3 pt-12 text-center">
                  <svg className="h-12 w-12 text-[#C5D4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  <p className="text-lg font-medium text-[#1A3A32]">No items in sale</p>
                  <p className="text-sm text-[#7A8F88]">Open an item and tap "Add to Sale" to get started.</p>
                </div>
              ) : (
                cart.map((cartItem) => (
                  <div key={cartItem.id} className="rounded-[14px] border border-[#E8EDE9] bg-[#F4F9F7] p-4">
                    <div className="flex items-start gap-3">
                      {cartItem.photo_url ? (
                        <img src={cartItem.photo_url} alt={cartItem.item_title} className="h-14 w-14 rounded-[8px] object-cover shrink-0" />
                      ) : (
                        <div className="h-14 w-14 rounded-[8px] bg-[#E8EDE9] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">{cartItem.item_number}</p>
                        <p className="text-sm font-medium text-[#1A3A32] leading-snug truncate">{cartItem.item_title}</p>
                        <p className="text-xs text-[#7A8F88] mt-0.5">{cartItem.session?.client_name}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(cartItem.id)} className="shrink-0 text-[#7A8F88] hover:text-red-500 transition-colors p-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88] mb-1">Sale Price</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7A8F88]">$</span>
                          <input
                            type="number"
                            min={cartItem.price_floor}
                            max={cartItem.price_ceiling * 2}
                            step="0.01"
                            value={cartItem.salePrice}
                            onChange={(e) => updateCartPrice(cartItem.id, e.target.value)}
                            className="w-full min-h-[40px] rounded-[8px] border border-[#E8EDE9] bg-white pl-7 pr-3 py-2 text-base font-medium text-[#1A3A32] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/30"
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88] mb-1">Client Gets</p>
                        <p className="text-base font-semibold text-[#2A6B52]">
                          {formatMoney((parseFloat(cartItem.salePrice) || 0) * 0.60)}
                        </p>
                      </div>
                    </div>
                    {parseFloat(cartItem.salePrice) < cartItem.price_floor && (
                      <p className="mt-2 text-xs text-amber-600 font-medium">
                        Below agreed minimum of {formatMoney(cartItem.price_floor)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="border-t border-[#E8EDE9] px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-[#1A3A32]">Total</p>
                  <p className="font-serif text-3xl font-medium text-[#1A3A32]">{formatMoney(cartTotal)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { method: "cash", label: "Cash" },
                      { method: "venmo", label: "Venmo" },
                      { method: "card", label: "Card (coming soon)", disabled: true },
                    ].map(({ method, label, disabled }) => (
                      <button
                        key={method}
                        type="button"
                        disabled={checkoutBusy || disabled}
                        onClick={() => !disabled && handleCheckout(method)}
                        className={`min-h-[52px] rounded-[10px] border text-sm font-semibold uppercase tracking-[0.12em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${disabled ? "border-[#E8EDE9] bg-[#F4F9F7] text-[#C5D4CC]" : "border-[#2A6B52] bg-[#2A6B52] text-white hover:opacity-90"}`}
                      >
                        {checkoutBusy ? <Spinner className="h-4 w-4 mx-auto" /> : label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="w-full text-center text-sm text-[#7A8F88] hover:text-red-500 transition-colors"
                >
                  Clear sale
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
