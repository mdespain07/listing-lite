"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash after redirect
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!password.trim()) { setError("Please enter a new password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email ?? "";
      await supabase.auth.signOut();
      window.location.href = "/?reset=true&email=" + encodeURIComponent(email);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32] antialiased">
      <header className="border-b border-[#E8EDE9] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6 sm:py-4">
          <a href="/">
            <img src="/logo.svg" alt="BrightListed" className="h-12 w-auto sm:h-14" />
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[20px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] p-8 shadow-[0_8px_40px_rgba(26,58,50,0.10)]">
          {success ? (
            <div className="space-y-4 text-center">
              <p className="font-serif text-2xl font-medium text-[#1A3A32]">Password updated!</p>
              <p className="text-sm leading-relaxed text-[#4A5568]">Your password has been changed. You can now sign in with your new password.</p>
              <a
                href="/"
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[#2A6B52] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              >
                Back to BrightListed
              </a>
            </div>
          ) : !ready ? (
            <div className="space-y-4 text-center">
              <p className="font-serif text-2xl font-medium text-[#1A3A32]">Checking your link…</p>
              <p className="text-sm leading-relaxed text-[#4A5568]">If this takes more than a few seconds, your reset link may have expired. <a href="/" className="font-semibold text-[#2A6B52] underline-offset-2 hover:underline">Go back</a> and request a new one.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#4A5568]">BrightListed</p>
                <h1 className="font-serif mt-2 text-2xl font-medium text-[#1A3A32] sm:text-[1.75rem]">Set a new password</h1>
              </div>
              {error && (
                <p className="rounded-[12px] border-[0.5px] border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-900" role="alert">
                  {error}
                </p>
              )}
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-[#4A5568]">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={busy}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="min-h-11 w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3 text-[15px] text-[#1A3A32] placeholder:text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-[#4A5568]">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={busy}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  className="min-h-11 w-full rounded-[12px] border-[0.5px] border-[#E8EDE9] bg-[#FFFFFF] px-4 py-3 text-[15px] text-[#1A3A32] placeholder:text-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#2A6B52]/35 disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="w-full touch-manipulation min-h-[44px] rounded-[12px] bg-[#2A6B52] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
