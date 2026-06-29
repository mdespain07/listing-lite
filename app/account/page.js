'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AccountNav from '../components/account-nav';
import BuyCreditsModal from '../components/buy-credits-modal';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [busyCredits, setBusyCredits] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

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
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePasswordChange() {
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user?.email) {
      setDeleteMsg({ type: 'error', text: 'Email does not match.' });
      return;
    }
    setDeleteLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const data = await res.json();
    if (data.error) {
      setDeleteMsg({ type: 'error', text: data.error });
      setDeleteLoading(false);
    } else {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  }


  async function startCheckout(credits) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setBusyCredits(credits);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, user_id: session.user.id, return_path: '/account' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Something went wrong. Please try again.');
        setBusyCredits(null);
      }
    } catch (err) {
      setCheckoutError('Something went wrong. Please try again.');
      setBusyCredits(null);
    }
  }

  if (!user && !loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F9F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, color: '#1A3A32', marginBottom: 12 }}>Sign in to view your account</p>
        <a href="/" style={{ backgroundColor: '#2A6B52', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
          Go to BrightListed →
        </a>
      </div>
    </div>
  );

  const sectionStyle = {
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #e0ece6',
    padding: '28px 32px',
    marginBottom: 20,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#7A8F88',
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #d0e4dc',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#1A3A32',
  };

  const btnStyle = {
    backgroundColor: '#2A6B52',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 16,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F9F7', fontFamily: 'Inter, sans-serif' }}>
      <AccountNav activePage="/account" />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36, color: '#1A3A32', margin: '0 0 32px' }}>Account</h1>

        {/* Profile */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#1A3A32', margin: '0 0 20px' }}>Profile</h2>
          <label style={labelStyle}>Email</label>
          <p style={{ fontSize: 15, color: '#1A3A32', margin: '0 0 4px' }}>{user?.email}</p>
          <p style={{ fontSize: 12, color: '#7A8F88', margin: 0 }}>To change your email, contact us at hello@brightlisted.ai</p>
        </div>

        {/* Credits */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#1A3A32', margin: '0 0 8px' }}>Credits</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 15, color: '#1A3A32', margin: 0 }}>
              You have <span style={{ fontWeight: 700, color: '#2A6B52', fontSize: 20 }}>{credits ?? '—'}</span> credit{credits !== 1 ? 's' : ''} remaining.
            </p>
            <button
              onClick={() => { setCheckoutError(null); setCreditsModalOpen(true); }}
              style={{
                backgroundColor: '#2A6B52',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Buy more credits →
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#7A8F88', margin: '12px 0 0' }}>Each credit = one item analysis. Credits never expire.</p>
        </div>

        {/* Change password */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#1A3A32', margin: '0 0 20px' }}>Change Password</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={inputStyle}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {passwordMsg && (
            <p style={{ fontSize: 13, marginTop: 10, color: passwordMsg.type === 'error' ? '#c0392b' : '#2A6B52' }}>
              {passwordMsg.text}
            </p>
          )}
          <button onClick={handlePasswordChange} disabled={passwordLoading} style={btnStyle}>
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </div>

        {/* My Listings shortcut */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#1A3A32', margin: '0 0 8px' }}>My Listings</h2>
          <p style={{ fontSize: 14, color: '#7A8F88', margin: '0 0 16px' }}>View, copy, and manage all your saved listings.</p>
          <a href="/my-listings" style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block' }}>
            View my listings →
          </a>
        </div>

        {/* Sign out */}
        <div style={sectionStyle}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#1A3A32', margin: '0 0 8px' }}>Sign Out</h2>
          <p style={{ fontSize: 14, color: '#7A8F88', margin: '0 0 16px' }}>Sign out of your BrightListed account on this device.</p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
            style={btnStyle}
          >
            Sign out
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ ...sectionStyle, border: '1px solid #f0c0b8' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, color: '#c0392b', margin: '0 0 8px' }}>Delete Account</h2>
          <p style={{ fontSize: 14, color: '#7A8F88', margin: '0 0 16px' }}>
            This permanently deletes your account, all saved listings, and your remaining credits. This cannot be undone.
          </p>
          <label style={labelStyle}>Type your email to confirm</label>
          <input
            type="email"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            style={{ ...inputStyle, borderColor: '#f0c0b8' }}
            placeholder={user?.email}
          />
          {deleteMsg && (
            <p style={{ fontSize: 13, marginTop: 10, color: deleteMsg.type === 'error' ? '#c0392b' : '#2A6B52' }}>
              {deleteMsg.text}
            </p>
          )}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteLoading || deleteConfirm !== user?.email}
            style={{
              ...btnStyle,
              backgroundColor: deleteConfirm === user?.email ? '#c0392b' : '#e0d0ce',
              cursor: deleteConfirm === user?.email ? 'pointer' : 'not-allowed',
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Permanently delete my account'}
          </button>
        </div>

      </main>

      <BuyCreditsModal
        open={creditsModalOpen}
        onClose={() => {
          if (busyCredits !== null) return;
          setCreditsModalOpen(false);
          setCheckoutError(null);
        }}
        onSelectCredits={(c) => void startCheckout(c)}
        busyCredits={busyCredits}
        error={checkoutError}
      />
    </div>
  );
}
