"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
  return Math.max(0, (item.days_listed || 45) - daysAgo(item.created_at));
}

function StatusBadge({ status, item }) {
  const remaining = daysUntilDeadline(item);
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
    available: urgent ? `⏰ ${remaining}d left` : "Active",
    sold: "Sold",
    donated: "Donated",
    picked_up: "Picked Up",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? map.available}`}>
      {labels[status] ?? status}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-[#2A6B52]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

const SCREENS = {
  LOADING: "loading",
  REQUEST: "request",
  SENT: "sent",
  PORTAL: "portal",
};

export default function MyItemsPage() {
  const [screen, setScreen] = useState(SCREENS.LOADING);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // Handle magic link redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setScreen(SCREENS.PORTAL);
      } else {
        setScreen(SCREENS.REQUEST);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setScreen(SCREENS.PORTAL);
      } else {
        setUser(null);
        setScreen(SCREENS.REQUEST);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (screen !== SCREENS.PORTAL || !user) return;
    fetchClientData();
  }, [screen, user]);

  const fetchClientData = async () => {
    setLoadingData(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/my-items", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load items");
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRequestLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setError("Please enter your email address."); return; }
    setBusy(true);
    setError("");
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/my-items`,
        },
      });
      if (otpError) throw new Error(otpError.message);
      setScreen(SCREENS.SENT);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessions([]);
    setScreen(SCREENS.REQUEST);
  };

  // Flatten all items across all sessions
  const allItems = sessions.flatMap((s) =>
    (s.intake_items || []).map((item) => ({ ...item, session: s }))
  );

  const filteredItems = allItems.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  // Earnings summary
  const soldItems = allItems.filter((i) => i.status === "sold");
  const totalSales = soldItems.reduce((sum, i) => sum + (i.sale_price || 0), 0);
  const clientEarnings = totalSales * 0.60;
  const totalPaid = sessions.reduce((sum, s) => sum + (s.payout_amount || 0), 0);
  const pendingPayout = Math.max(0, clientEarnings - totalPaid);

  return (
    <div className="min-h-dvh bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      {/* Header */}
      <header className="border-b border-[#E8EDE9] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-10 w-auto" />
          </a>
          {screen === SCREENS.PORTAL && user && (
            <div className="flex items-center gap-4">
              <p className="hidden text-sm text-[#7A8F88] sm:block">{user.email}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-semibold text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">

        {/* LOADING */}
        {screen === SCREENS.LOADING && (
          <div className="flex justify-center pt-20">
            <Spinner />
          </div>
        )}

        {/* REQUEST MAGIC LINK */}
        {screen === SCREENS.REQUEST && (
          <div className="flex flex-col items-center gap-6 pt-12">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">BrightListed Consignment</p>
              <h1 className="font-serif mt-4 text-4xl font-medium text-[#1A3A32]">My Items</h1>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#7A8F88]">
                Enter the email address you gave us when you dropped off your items. We'll send you a secure link to view your items and earnings.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-4">
              {error && (
                <p className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              <div>
                <label htmlFor="client-email" className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-[#4A5568]">
                  Email Address
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRequestLink(); }}
                  placeholder="you@example.com"
                  className="min-h-[52px] w-full rounded-[12px] border border-[#E8EDE9] bg-white px-4 py-3 text-lg text-[#1A3A32] placeholder:text-[#C5D4CC] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30"
                  autoComplete="email"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestLink}
                disabled={busy}
                className="w-full min-h-[52px] rounded-[12px] bg-[#2A6B52] text-base font-semibold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Sending…" : "Send my secure link"}
              </button>
            </div>
          </div>
        )}

        {/* LINK SENT */}
        {screen === SCREENS.SENT && (
          <div className="flex flex-col items-center gap-6 pt-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2A6B52]/10 border border-[#8FCFB0]/40">
              <svg className="h-10 w-10 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#1A3A32]">Check your inbox!</h2>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#7A8F88]">
                We sent a secure link to <span className="font-semibold text-[#1A3A32]">{email}</span>. Click it to view your items — the link expires in 1 hour.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setScreen(SCREENS.REQUEST); setEmail(""); }}
              className="text-sm font-semibold text-[#2A6B52] underline-offset-2 hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* PORTAL */}
        {screen === SCREENS.PORTAL && (
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">BrightListed Consignment</p>
              <h1 className="font-serif mt-3 text-4xl font-medium text-[#1A3A32]">My Items</h1>
            </div>

            {error && (
              <p className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            {/* Earnings Summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Items", value: allItems.length },
                { label: "Items Sold", value: soldItems.length },
                { label: "My Earnings", value: formatMoney(clientEarnings) },
                { label: "Pending Payout", value: formatMoney(pendingPayout) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[16px] border border-[#E8EDE9] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88]">{label}</p>
                  <p className="font-serif mt-2 text-2xl font-medium text-[#1A3A32]">{value}</p>
                </div>
              ))}
            </div>

            {/* Payout History */}
            {sessions.some((s) => s.payout_date) && (
              <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88] mb-4">Payout History</p>
                <div className="space-y-3">
                  {sessions.filter((s) => s.payout_date).map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-medium text-[#1A3A32]">{formatMoney(s.payout_amount)}</p>
                        <p className="text-sm text-[#7A8F88]">
                          {new Date(s.payout_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          {s.payout_method ? ` · ${s.payout_method}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Paid
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {["all", "available", "sold", "donated", "picked_up"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`min-h-[36px] rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.12em] transition-colors ${filterStatus === status ? "border-[#2A6B52] bg-[#2A6B52] text-white" : "border-[#E8EDE9] bg-white text-[#4A5568] hover:border-[#8FCFB0]/60"}`}
                >
                  {status === "all" ? "All" : status === "available" ? "Active" : status === "picked_up" ? "Picked Up" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Items List */}
            {loadingData ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-12 text-center">
                <p className="text-lg text-[#7A8F88]">
                  {filterStatus === "all"
                    ? "No items found for your email address. Make sure you're using the same email you gave us at drop-off."
                    : `No ${filterStatus} items.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                    className="w-full text-left rounded-[16px] border border-[#E8EDE9] bg-white overflow-hidden hover:border-[#8FCFB0]/60 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.item_title} className="h-16 w-16 rounded-[8px] object-cover shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-[8px] bg-[#F4F9F7] shrink-0 flex items-center justify-center">
                          <svg className="h-6 w-6 text-[#C5D4CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">{item.item_number || "—"}</p>
                            <p className="mt-0.5 font-medium text-[#1A3A32] leading-snug">{item.item_title}</p>
                          </div>
                          <StatusBadge status={item.status} item={item} />
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-sm text-[#7A8F88]">
                          <span>Listed: {formatMoney(item.current_price || item.price_ceiling)}</span>
                          {item.status === "sold" && (
                            <span className="font-semibold text-blue-600">Sold: {formatMoney(item.sale_price)}</span>
                          )}
                          {item.status === "available" && (
                            <span>{daysUntilDeadline(item)}d remaining</span>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`h-5 w-5 shrink-0 text-[#C5D4CC] transition-transform ${selectedItem?.id === item.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Expanded detail */}
                    {selectedItem?.id === item.id && (
                      <div className="border-t border-[#E8EDE9] bg-[#F4F9F7] px-4 py-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#7A8F88]">Item number</span>
                          <span className="font-medium text-[#1A3A32]">{item.item_number || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A8F88]">Intake date</span>
                          <span className="text-[#1A3A32]">{new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A8F88]">Price range</span>
                          <span className="text-[#1A3A32]">{formatMoney(item.price_floor)} – {formatMoney(item.price_ceiling)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A8F88]">Current price</span>
                          <span className="font-medium text-[#1A3A32]">{formatMoney(item.current_price || item.price_ceiling)}</span>
                        </div>
                        {item.status === "available" && (
                          <div className="flex justify-between">
                            <span className="text-[#7A8F88]">Listing expires</span>
                            <span className="text-[#1A3A32]">
                              {item.deadline_date
                                ? new Date(item.deadline_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                                : "—"}
                            </span>
                          </div>
                        )}
                        {item.status === "available" && (
                          <div className="flex justify-between">
                            <span className="text-[#7A8F88]">If unsold</span>
                            <span className="text-[#1A3A32]">{item.if_unsold === "donate" ? "Donate to charity" : "Client pickup"}</span>
                          </div>
                        )}
                        {item.status === "sold" && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-[#7A8F88]">Sale price</span>
                              <span className="font-semibold text-[#1A3A32]">{formatMoney(item.sale_price)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#7A8F88]">Your earnings (60%)</span>
                              <span className="font-semibold text-[#2A6B52]">{formatMoney((item.sale_price || 0) * 0.60)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#7A8F88]">Sold on</span>
                              <span className="text-[#1A3A32]">{item.sold_at ? new Date(item.sold_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</span>
                            </div>
                          </>
                        )}
                        {item.listing_url_1 && (
                          <div className="pt-2 border-t border-[#E8EDE9]">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7A8F88] mb-2">Live Listings</p>
                            <div className="flex flex-col gap-1">
                              {[item.listing_url_1, item.listing_url_2, item.listing_url_3, item.listing_url_4]
                                .filter(Boolean)
                                .map((url, i) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm text-[#2A6B52] underline-offset-2 hover:underline truncate"
                                  >
                                    View listing {i + 1} →
                                  </a>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#E8EDE9] bg-white py-6 text-center mt-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#7A8F88]">BrightListed · Listings in a Snap</p>
      </footer>
    </div>
  );
}
