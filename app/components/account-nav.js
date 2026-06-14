'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    <header style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0ece6',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: 16,
    }}>
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <img src="/logo.svg" alt="BrightListed" style={{ height: 36 }} />
      </a>

      {/* Center nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { label: 'My Listings', href: '/my-listings' },
          { label: 'Account', href: '/account' },
        ].map(({ label, href }) => (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {credits !== null && (
          <span style={{ fontSize: 13, color: '#7A8F88' }}>
            <span style={{ fontWeight: 600, color: '#1A3A32' }}>{credits}</span> credit{credits !== 1 ? 's' : ''}
          </span>
        )}
        <a
          href="/?buy=true"
          style={{
            backgroundColor: '#F4F9F7',
            border: '1px solid #e0ece6',
            color: '#2A6B52',
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Buy credits
        </a>
        <a
          href="/"
          style={{
            backgroundColor: '#2A6B52',
            color: '#fff',
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          + New Listing
        </a>
      </div>
    </header>
  );
}
