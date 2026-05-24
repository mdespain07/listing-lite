"use client";

import { useState, useCallback, useEffect } from "react";
import SignaturePad from "../components/signature-pad";

const PIN = "2847";
const COMMISSION_CLIENT = 60;
const COMMISSION_BRYNN = 30;
const COMMISSION_BL = 10;
const UNSOLD_DAYS = 45;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const long = Math.max(w, h);
        if (long > 1200) {
          const scale = 1200 / long;
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not process image"));
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image")); };
    img.src = objectUrl;
  });
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#2A6B52]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold uppercase tracking-[0.16em] text-[#4A5568]">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      className="min-h-[48px] w-full rounded-[10px] border border-[#E8EDE9] bg-white px-4 py-3 text-lg text-[#1A3A32] placeholder:text-[#C5D4CC] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30"
      {...props}
    />
  );
}

function Btn({ children, onClick, disabled, variant = "primary", className = "" }) {
  const base = "touch-manipulation inline-flex min-h-[52px] items-center justify-center rounded-[12px] px-6 py-3 text-base font-semibold uppercase tracking-[0.16em] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#2A6B52] text-white hover:opacity-90",
    outline: "border-2 border-[#2A6B52] text-[#2A6B52] hover:bg-[#F4F9F7]",
    ghost: "border border-[#E8EDE9] text-[#4A5568] hover:bg-[#F4F9F7]",
    danger: "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// SCREENS
const SCREEN = {
  PIN: "pin",
  CLIENT: "client",
  ITEMS: "items",
  ADD_ITEM: "add_item",
  REVIEW: "review",
  SUCCESS: "success",
};

export default function IntakePage() {
  const [screen, setScreen] = useState(SCREEN.PIN);
  const [pin, setPin] = useState("");
  useEffect(() => {
    const expiry = localStorage.getItem("bl_admin_authed");
    if (expiry && Date.now() < Number(expiry)) {
      setScreen(SCREEN.CLIENT);
    }
  }, []);
  const [pinError, setPinError] = useState("");

  // Client info
  const [client, setClient] = useState({
    name: "", phone: "", email: "",
    paymentPref: "venmo", venmo: "", address: "",
  });

  // Items
  const [items, setItems] = useState([]);

  // Add item state
  const [itemPhoto, setItemPhoto] = useState(null);
  const [itemPhotoPreview, setItemPhotoPreview] = useState(null);
  const [itemAnalyzing, setItemAnalyzing] = useState(false);
  const [itemSuggestion, setItemSuggestion] = useState(null);
  const [itemFloor, setItemFloor] = useState("");
  const [itemCeiling, setItemCeiling] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemUnsold, setItemUnsold] = useState("donate");
  const [itemError, setItemError] = useState("");
  const [manualMode, setManualMode] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [signature, setSignature] = useState(null);
  const [signatureError, setSignatureError] = useState("");

  // PIN
  const handlePin = () => {
    if (pin === PIN) {
      const expiry = Date.now() + 3 * 60 * 60 * 1000;
      localStorage.setItem("bl_admin_authed", String(expiry));
      setScreen(SCREEN.CLIENT);
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  // Client validation
  const clientValid = client.name.trim() && client.phone.trim() && client.email.trim() &&
    (client.paymentPref === "venmo" ? client.venmo.trim() : client.address.trim());

  // Analyze photo
  const handleAnalyzePhoto = async (file) => {
    setItemAnalyzing(true);
    setItemError("");
    setItemSuggestion(null);
    try {
      const dataUrl = await compressImage(file);
      setItemPhotoPreview(dataUrl);
      let uploadedUrl = dataUrl;
      try {
        const uploadRes = await fetch("/api/intake/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl: dataUrl,
            fileName: file.name || "photo.jpg",
          }),
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          uploadedUrl = uploadData.url;
        }
      } catch {
        // silently fall back to data URL if upload fails
      }
      setItemPhoto(uploadedUrl);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [dataUrl] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        setItemSuggestion(data);
        setItemTitle(data.listingTitle || "");
        setItemFloor(data.priceLow ? String(data.priceLow) : "");
        setItemCeiling(data.priceHigh ? String(data.priceHigh) : "");
      } catch (e) {
        console.error("AI analysis failed:", e);
        setItemError("AI pricing unavailable — please enter item details manually below.");
        setManualMode(true);
      }
    } catch (e) {
      setItemError(e.message || "Could not process photo. Try again.");
    } finally {
      setItemAnalyzing(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleAnalyzePhoto(file);
  };

  const resetItemForm = () => {
    setItemPhoto(null);
    setItemPhotoPreview(null);
    setItemSuggestion(null);
    setItemFloor("");
    setItemCeiling("");
    setItemTitle("");
    setItemUnsold("donate");
    setItemError("");
    setManualMode(false);
  };

  const handleAddItem = () => {
    if (!itemTitle || !itemFloor || !itemCeiling) {
      setItemError("Please enter item title and price range before adding.");
      return;
    }
    setItems((prev) => [...prev, {
      id: crypto.randomUUID(),
      photo: itemPhoto || null,
      title: itemTitle,
      floor: parseFloat(itemFloor),
      ceiling: parseFloat(itemCeiling),
      unsold: itemUnsold,
    }]);
    resetItemForm();
    setScreen(SCREEN.ITEMS);
  };

  const handleRemoveItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  // Submit intake
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client, items, signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setScreen(SCREEN.SUCCESS);
    } catch (e) {
      setSubmitError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setScreen(SCREEN.CLIENT);
    setClient({ name: "", phone: "", email: "", paymentPref: "venmo", venmo: "", address: "" });
    setItems([]);
    resetItemForm();
    setSubmitError("");
  };

  return (
    <div className="min-h-dvh bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      {/* Header */}
      <header className="border-b border-[#E8EDE9] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <img src="/logo.svg" alt="BrightListed" className="h-10 w-auto" />
          <a href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52] hover:underline underline-offset-2">
            Dashboard →
          </a>
          {screen !== SCREEN.PIN && screen !== SCREEN.SUCCESS && (
            <p className="text-sm font-medium text-[#7A8F88]">
              {screen === SCREEN.CLIENT ? "Step 1 of 3 — Client Info" :
               screen === SCREEN.ITEMS || screen === SCREEN.ADD_ITEM ? `Step 2 of 3 — Items (${items.length} added)` :
               "Step 3 of 3 — Review & Submit"}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">

        {/* PIN SCREEN */}
        {screen === SCREEN.PIN && (
          <div className="flex flex-col items-center gap-6 pt-12">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2A6B52]">BrightListed</p>
              <h1 className="font-serif mt-3 text-4xl font-medium text-[#1A3A32]">Consignment Intake</h1>
              <p className="mt-2 text-lg text-[#7A8F88]">Enter your PIN to continue</p>
            </div>
            <div className="w-full max-w-xs space-y-4">
              {pinError && <p className="rounded-[10px] bg-red-50 px-4 py-3 text-base text-red-700">{pinError}</p>}
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePin(); }}
                placeholder="••••"
                className="min-h-[56px] w-full rounded-[12px] border border-[#E8EDE9] bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#1A3A32] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30"
              />
              <Btn onClick={handlePin} className="w-full">Unlock</Btn>
            </div>
          </div>
        )}

        {/* CLIENT INFO SCREEN */}
        {screen === SCREEN.CLIENT && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#1A3A32]">Client Information</h2>
              <p className="mt-1 text-lg text-[#7A8F88]">Enter the seller's contact details.</p>
            </div>
            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6 space-y-5">
              <Field label="Full Name">
                <Input value={client.name} onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))} placeholder="Jane Smith" />
              </Field>
              <Field label="Phone Number">
                <Input type="tel" value={client.phone} onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))} placeholder="(801) 555-0100" />
              </Field>
              <Field label="Email Address">
                <Input type="email" value={client.email} onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))} placeholder="jane@email.com" />
              </Field>
              <Field label="Payment Preference">
                <div className="flex gap-3">
                  {["venmo", "check"].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setClient((c) => ({ ...c, paymentPref: pref }))}
                      className={`flex-1 min-h-[48px] rounded-[10px] border text-base font-semibold uppercase tracking-[0.14em] transition-colors ${client.paymentPref === pref ? "border-[#2A6B52] bg-[#2A6B52] text-white" : "border-[#E8EDE9] bg-white text-[#1A3A32]"}`}
                    >
                      {pref === "venmo" ? "Venmo" : "Check"}
                    </button>
                  ))}
                </div>
              </Field>
              {client.paymentPref === "venmo" ? (
                <Field label="Venmo Username">
                  <Input value={client.venmo} onChange={(e) => setClient((c) => ({ ...c, venmo: e.target.value }))} placeholder="@username" />
                </Field>
              ) : (
                <Field label="Mailing Address">
                  <textarea
                    value={client.address}
                    onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))}
                    rows={3}
                    placeholder="123 Main St, Salt Lake City, UT 84101"
                    className="w-full rounded-[10px] border border-[#E8EDE9] bg-white px-4 py-3 text-lg text-[#1A3A32] placeholder:text-[#C5D4CC] focus:outline-none focus:ring-2 focus:ring-[#2A6B52]/30"
                  />
                </Field>
              )}
            </div>
            <Btn onClick={() => setScreen(SCREEN.ITEMS)} disabled={!clientValid} className="w-full">
              Continue to Items →
            </Btn>
          </div>
        )}

        {/* ITEMS LIST SCREEN */}
        {screen === SCREEN.ITEMS && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#1A3A32]">Items</h2>
              <p className="mt-1 text-lg text-[#7A8F88]">
                {items.length === 0 ? "Add the first item to get started." : `${items.length} item${items.length !== 1 ? "s" : ""} added.`}
              </p>
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-[14px] border border-[#E8EDE9] bg-white p-4">
                    {item.photo && (
                      <img src={item.photo} alt={item.title} className="h-16 w-16 rounded-[8px] object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">{item.itemNumber || "Pending #"}</p>
                      <p className="font-medium text-[#1A3A32] truncate">{item.title}</p>
                      <p className="text-sm text-[#7A8F88]">${item.floor} – ${item.ceiling} · {item.unsold === "donate" ? "Donate if unsold" : "Pickup if unsold"}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="shrink-0 text-[#7A8F88] hover:text-red-500 transition-colors p-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Btn onClick={() => { resetItemForm(); setScreen(SCREEN.ADD_ITEM); }} variant="outline" className="w-full">
              + Add {items.length > 0 ? "Another" : "an"} Item
            </Btn>

            {items.length > 0 && (
              <Btn onClick={() => setScreen(SCREEN.REVIEW)} className="w-full">
                Review & Submit →
              </Btn>
            )}
          </div>
        )}

        {/* ADD ITEM SCREEN */}
        {screen === SCREEN.ADD_ITEM && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#1A3A32]">Add Item</h2>
              <p className="mt-1 text-lg text-[#7A8F88]">Take or upload a photo for AI pricing.</p>
            </div>

            {itemError && (
              <p className="rounded-[10px] bg-red-50 px-4 py-3 text-base text-red-700">{itemError}</p>
            )}

            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6 space-y-5">
              {/* Photo Upload */}
              <Field label="Item Photo">
                {itemPhotoPreview ? (
                  <div className="relative">
                    <img src={itemPhotoPreview} alt="Item" className="w-full rounded-[10px] object-cover max-h-64" />
                    <button
                      type="button"
                      onClick={() => { setItemPhotoPreview(null); setItemPhoto(null); setItemSuggestion(null); setItemTitle(""); setItemFloor(""); setItemCeiling(""); }}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-[#1A3A32] hover:bg-[#F4F9F7]"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {itemAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-white/80">
                        <div className="flex flex-col items-center gap-2">
                          <Spinner />
                          <p className="text-sm font-medium text-[#2A6B52]">Analyzing item…</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[#E8EDE9] bg-[#F4F9F7] transition-colors hover:border-[#8FCFB0]">
                    {itemAnalyzing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Spinner />
                        <p className="text-base font-medium text-[#2A6B52]">Analyzing…</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A6B52]">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                        <p className="text-base font-medium text-[#1A3A32]">Take or upload a photo</p>
                        <p className="text-sm text-[#7A8F88]">AI will suggest a price automatically</p>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="sr-only" disabled={itemAnalyzing} />
                  </label>
                )}
              </Field>

              {/* Manual entry toggle */}
              {!itemSuggestion && !itemAnalyzing && !itemPhotoPreview && (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => { setManualMode(true); setItemError(""); }}
                    className="text-sm font-medium text-[#7A8F88] underline-offset-2 hover:text-[#2A6B52] hover:underline transition-colors"
                  >
                    Skip photo — enter manually
                  </button>
                </div>
              )}

              {/* Manual mode notice */}
              {manualMode && !itemSuggestion && (
                <div className="rounded-[10px] border border-amber-200/90 bg-amber-50/90 px-4 py-3">
                  <p className="text-sm font-medium text-amber-800">
                    {itemPhotoPreview
                      ? "AI pricing unavailable — enter item details manually below."
                      : "Manual entry mode — fill in item details below. You can still add a photo above."}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setManualMode(false); setItemError(""); }}
                    className="mt-1 text-xs text-amber-700 underline-offset-2 hover:underline"
                  >
                    Try AI again
                  </button>
                </div>
              )}

              {/* AI Suggestion Banner */}
              {itemSuggestion && !itemAnalyzing && (
                <div className="rounded-[10px] border border-[#8FCFB0]/60 bg-[#F4F9F7] px-4 py-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2A6B52]">AI Suggestion</p>
                  <p className="mt-1 text-base font-medium text-[#1A3A32]">{itemSuggestion.itemName}</p>
                  <p className="text-sm text-[#4A5568]">Suggested range: ${itemSuggestion.priceLow} – ${itemSuggestion.priceHigh}</p>
                </div>
              )}

              {/* Item Title */}
              <Field label="Item Title">
                <Input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="e.g. Blue Linen Button-Down Shirt" disabled={itemAnalyzing} />
              </Field>

              {/* Price Floor / Ceiling */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Minimum Price ($)">
                  <Input type="number" min="0" step="0.01" value={itemFloor} onChange={(e) => setItemFloor(e.target.value)} placeholder="e.g. 15" disabled={itemAnalyzing} />
                </Field>
                <Field label="Maximum Price ($)">
                  <Input type="number" min="0" step="0.01" value={itemCeiling} onChange={(e) => setItemCeiling(e.target.value)} placeholder="e.g. 25" disabled={itemAnalyzing} />
                </Field>
              </div>

              {/* If Unsold */}
              <Field label={`If unsold after ${UNSOLD_DAYS} days`}>
                <div className="flex gap-3">
                  {[
                    { value: "donate", label: "Donate" },
                    { value: "pickup", label: "Client Pickup" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setItemUnsold(value)}
                      className={`flex-1 min-h-[48px] rounded-[10px] border text-base font-semibold uppercase tracking-[0.14em] transition-colors ${itemUnsold === value ? "border-[#2A6B52] bg-[#2A6B52] text-white" : "border-[#E8EDE9] bg-white text-[#1A3A32]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="flex gap-3">
              <Btn variant="ghost" onClick={() => { resetItemForm(); setScreen(SCREEN.ITEMS); }} className="flex-1">
                Cancel
              </Btn>
              <Btn
                onClick={handleAddItem}
                disabled={itemAnalyzing || !itemTitle || !itemFloor || !itemCeiling}
                className="flex-1"
              >
                Add Item →
              </Btn>
            </div>
          </div>
        )}

        {/* REVIEW SCREEN */}
        {screen === SCREEN.REVIEW && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#1A3A32]">Review & Submit</h2>
              <p className="mt-1 text-lg text-[#7A8F88]">Confirm all details before submitting.</p>
            </div>

            {submitError && (
              <p className="rounded-[10px] bg-red-50 px-4 py-3 text-base text-red-700">{submitError}</p>
            )}

            {/* Client Summary */}
            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Client</p>
              <p className="text-xl font-medium text-[#1A3A32]">{client.name}</p>
              <p className="text-base text-[#4A5568]">{client.phone} · {client.email}</p>
              <p className="text-base text-[#4A5568]">
                Payment: {client.paymentPref === "venmo" ? `Venmo — ${client.venmo}` : `Check — ${client.address}`}
              </p>
            </div>

            {/* Items Summary */}
            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Items ({items.length})</p>
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-4 border-t border-[#E8EDE9] pt-4 first:border-0 first:pt-0">
                  {item.photo && <img src={item.photo} alt={item.title} className="h-14 w-14 rounded-[8px] object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7A8F88]">Item # assigned on submit</p>
                    <p className="font-medium text-[#1A3A32]">{item.title}</p>
                    <p className="text-sm text-[#7A8F88]">${item.floor} – ${item.ceiling} · {item.unsold === "donate" ? "Donate if unsold" : "Pickup if unsold"}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Commission */}
            <div className="rounded-[16px] border border-[#8FCFB0]/60 bg-[#F4F9F7] p-6 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2A6B52]">Commission Agreement</p>
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-[#4A5568]">Seller receives</span>
                  <span className="font-semibold text-[#2A6B52]">60%</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-[#4A5568]">BrightListed commission</span>
                  <span className="font-semibold text-[#1A3A32]">40%</span>
                </div>
              </div>
              <p className="text-sm text-[#7A8F88] border-t border-[#E8EDE9] pt-3">
                Items not sold within {UNSOLD_DAYS} days will be handled per client preference above. Payment issued within 7 days of sale.
              </p>
            </div>

            <div className="rounded-[16px] border border-[#E8EDE9] bg-white p-6 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7A8F88]">Client Signature</p>
              <p className="text-sm leading-relaxed text-[#4A5568]">
                By signing below, {client.name} agrees to the consignment terms above, including the 60/30/10 commission split, the {UNSOLD_DAYS}-day sales window, and the selected handling of unsold items.
              </p>
              {signatureError && (
                <p className="rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-700">{signatureError}</p>
              )}
              {signature ? (
                <div className="space-y-3">
                  <div className="rounded-[12px] border border-[#8FCFB0]/60 bg-[#F4F9F7] p-3">
                    <img src={signature} alt="Client signature" className="max-h-24 w-auto" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#2A6B52] font-semibold">✓ Signed</p>
                    <button
                      type="button"
                      onClick={() => setSignature(null)}
                      className="text-sm text-[#7A8F88] underline-offset-2 hover:underline"
                    >
                      Re-sign
                    </button>
                  </div>
                </div>
              ) : (
                <SignaturePad
                  onSave={(dataUrl) => { setSignature(dataUrl); setSignatureError(""); }}
                  onClear={() => setSignature(null)}
                />
              )}
            </div>

            <div className="flex gap-3">
              <Btn variant="ghost" onClick={() => setScreen(SCREEN.ITEMS)} className="flex-1">
                ← Back
              </Btn>
              <Btn onClick={() => {
                if (!signature) { setSignatureError("Please have the client sign before submitting."); return; }
                handleSubmit();
              }} disabled={submitting} className="flex-1">
                {submitting ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span> : "Submit Intake →"}
              </Btn>
            </div>
          </div>
        )}

        {/* SUCCESS SCREEN */}
        {screen === SCREEN.SUCCESS && (
          <div className="flex flex-col items-center gap-6 pt-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2A6B52]/10 border border-[#8FCFB0]/40">
              <svg className="h-10 w-10 text-[#2A6B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-4xl font-medium text-[#1A3A32]">Intake Complete!</h2>
              <p className="mt-3 text-lg text-[#7A8F88]">
                {client.name}'s items have been saved. A confirmation will be sent to {client.email}.
              </p>
            </div>
            <Btn onClick={resetAll} className="mt-4">
              Start New Intake
            </Btn>
          </div>
        )}

      </main>
    </div>
  );
}
