"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
      setConfirmMessage(false);
      setBusy(false);
      setMode("signin");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signUpError) { setError(signUpError.message); return; }
        setConfirmMessage(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (signInError) { setError(signInError.message); return; }
        if (data?.user) { onAuthSuccess(data.user); onClose(); }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-[#1A3A32]/45 backdrop-blur-[2px]" aria-hidden />
      <div
        className="relative z-10 flex max-h-[min(92dvh,520px)] w-full max-w-md flex-col overflow-hidden rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] shadow-[0_24px_80px_rgba(26,58,50,0.18)]"
        role="dialog"
        aria-modal
        aria-labelledby="auth-modal-title"
      >
        <div className="shrink-0 border-b-[0.5px] border-[#E8EDE9] bg-gradient-to-b from-[#F4F9F7] to-[#FFFFFF] px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4A5568] sm:text-sm">BrightListed</p>
              <h2 id="auth-modal-title" className="font-serif mt-2 text-2xl font-medium tracking-[0.02em] text-[#1A3A32] sm:text-[1.75rem]">
                {mode === "signin" ? "Sign in" : "Create account"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="touch-manipulation flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-[0.5px] border-[#E8EDE9] bg-white p-2.5 text-[#1A3A32] transition-colors hover:bg-[#F4F9F7] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
          {confirmMessage ? (
            <div className="space-y-4">
              <p className="rounded-[12px] border-[0.5px] border-[#8FCFB0]/80 bg-[#F4F9F7] px-4 py-4 text-sm leading-relaxed text-[#1A3A32]">
                <span className="font-semibold text-[#2A6B52]">Check your inbox.</span> We sent a confirmation link to <span className="font-medium">{email.trim()}</span>. Click it to activate your account, then come back and sign in.
              </p>
              <button
                type="button"
                onClick={() => { setConfirmMessage(false); setMode("signin"); }}
                className="w-full touch-manipulation min-h-[44px] rounded-[12px] border-[0.5px] border-[#2A6B52] bg-transparent px-4 py-3 text-sm font-semibold text-[#2A6B52] transition-colors hover:bg-[#F4F9F7]"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <p className="rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-900" role="alert">
                  {error}
                </p>
              )}
              <div>
                <label htmlFor="auth-email" className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-[#4A5568]">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={busy}
                  className="min-h-11 w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3 text-[15px] text-[#1A3A32] placeholder:text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:opacity-50"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-[#4A5568]">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={busy}
                  className="min-h-11 w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3 text-[15px] text-[#1A3A32] placeholder:text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:opacity-50"
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="w-full touch-manipulation min-h-[44px] rounded-[12px] bg-[#2A6B52] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (mode === "signup" ? "Creating account…" : "Signing in…") : (mode === "signup" ? "Create account" : "Sign in")}
              </button>
              <p className="text-center text-sm text-[#4A5568]">
                {mode === "signin" ? (
                  <>No account?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="font-semibold text-[#2A6B52] underline-offset-2 hover:underline">Create one</button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="font-semibold text-[#2A6B52] underline-offset-2 hover:underline">Sign in</button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
