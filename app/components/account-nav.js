'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const NAV_LINKS = [
  { label: 'My Listings', href: '/my-listings' },
  { label: 'Account', href: '/account' },
];

export default function AccountNav({ activePage }) {
  const [credits, setCredits] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const res = await fetch('/api/credits', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (typeof data.balance === 'number') setCredits(data.balance);
      }
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e0ece6] bg-white">

      {/* Main row — always visible */}
      <div className="flex h-16 items-center justify-between gap-4 px-6">

        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center no-underline">
          <img src="/logo.svg" alt="BrightListed" style={{ height: 36 }} />
        </a>

        {/* Center nav — desktop only */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: activePage === href ? 600 : 400,
                color: activePage === href ? '#2A6B52' : '#7A8F88',
                backgroundColor: activePage === href ? '#F4F9F7' : 'transparent',
                border: activePage === href ? '1px solid #e0ece6' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2.5">

          {/* Credits count — desktop only */}
          {credits !== null && (
            <span className="hidden text-[13px] text-[#7A8F88] sm:inline">
              <span style={{ fontWeight: 600, color: '#1A3A32' }}>{credits}</span>{' '}
              credit{credits !== 1 ? 's' : ''}
            </span>
          )}

          {/* Buy credits — desktop only */}
          <a
            href="/?buy=true"
            className="hidden items-center rounded-[8px] border border-[#e0ece6] bg-[#F4F9F7] px-3.5 py-[7px] text-[13px] font-medium text-[#2A6B52] no-underline sm:inline-flex"
          >
            Buy credits
          </a>

          {/* New Listing — always visible */}
          <a
            href="/"
            className="inline-flex items-center rounded-[8px] bg-[#2A6B52] px-3.5 py-[7px] text-[13px] font-medium text-white no-underline"
          >
            + New Listing
          </a>
        </div>
      </div>

      {/* Mobile second row — nav links + credits count */}
      <div className="flex items-center justify-between gap-3 border-t border-[#e0ece6] px-4 py-2 sm:hidden">
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: activePage === href ? 600 : 400,
                color: activePage === href ? '#2A6B52' : '#7A8F88',
                backgroundColor: activePage === href ? '#F4F9F7' : 'transparent',
                border: activePage === href ? '1px solid #e0ece6' : '1px solid transparent',
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </div>
        {credits !== null && (
          <span className="shrink-0 text-[12px] text-[#7A8F88]">
            <span style={{ fontWeight: 600, color: '#1A3A32' }}>{credits}</span>{' '}
            credit{credits !== 1 ? 's' : ''}
          </span>
        )}
      </div>

    </header>
  );
}
