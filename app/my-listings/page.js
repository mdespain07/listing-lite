'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PLATFORMS = ['general', 'facebook', 'ebay', 'poshmark'];
const PLATFORM_LABELS = { general: 'General', facebook: 'Facebook', ebay: 'eBay', poshmark: 'Poshmark' };

export default function MyListingsPage() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [copied, setCopied] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadListings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadListings(session.user.id);
      } else {
        setUser(null);
        setListings([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadListings(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setListings(data || []);
    setLoading(false);
  }

  async function deleteListing(id) {
    setDeleting(id);
    await supabase.from('saved_listings').delete().eq('id', id);
    setListings(prev => prev.filter(l => l.id !== id));
    setDeleting(null);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 1500);
  }

  function getAvailablePlatforms(listing) {
    if (!listing.listings) return [];
    return PLATFORMS.filter(p => listing.listings[p]?.title || listing.listings[p]?.description);
  }

  function getActiveTab(listing) {
    return activeTabs[listing.id] || getAvailablePlatforms(listing)[0] || 'general';
  }

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!user && !loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F9F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, color: '#1A3A32', marginBottom: 12 }}>Sign in to view your listings</p>
        <a href="/" style={{ backgroundColor: '#2A6B52', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
          Go to BrightListed →
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F9F7', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e0ece6', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="BrightListed" style={{ height: 36 }} />
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, color: '#1A3A32', fontWeight: 600 }}>
            Bright<span style={{ color: '#8FCFB0' }}>Listed</span>
          </span>
        </a>
        <a href="/" style={{ backgroundColor: '#2A6B52', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          + New Listing
        </a>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 36, color: '#1A3A32', margin: '0 0 8px' }}>My Listings</h1>
          {!loading && <p style={{ color: '#7A8F88', fontSize: 14, margin: 0 }}>{listings.length} saved listing{listings.length !== 1 ? 's' : ''}</p>}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A8F88' }}>Loading your listings...</div>
        )}

        {!loading && listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, color: '#1A3A32', marginBottom: 8 }}>No listings yet</p>
            <p style={{ color: '#7A8F88', marginBottom: 24 }}>Analyze an item to get started.</p>
            <a href="/" style={{ backgroundColor: '#2A6B52', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
              Create your first listing →
            </a>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {listings.map(listing => {
            const isExpanded = expandedId === listing.id;
            const availablePlatforms = getAvailablePlatforms(listing);
            const activeTab = getActiveTab(listing);
            const activeListing = listing.listings?.[activeTab];

            return (
              <div key={listing.id} style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e0ece6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(42,107,82,0.05)' }}>

                {/* Card header — always visible */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}
                >
                  {listing.photo_url && (
                    <img src={listing.photo_url} alt={listing.item_name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: '#1A3A32', margin: '0 0 4px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {listing.item_name || 'Untitled listing'}
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {listing.condition && <span style={{ fontSize: 12, color: '#7A8F88' }}>{listing.condition}</span>}
                      {listing.recommended_first_price && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2A6B52' }}>
                          List at ${listing.recommended_first_price}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#b0bfba' }}>{formatDate(listing.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); deleteListing(listing.id); }}
                      disabled={deleting === listing.id}
                      style={{ background: 'none', border: 'none', color: '#c0bab8', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}
                      title="Delete listing"
                    >
                      {deleting === listing.id ? '...' : '×'}
                    </button>
                    <span style={{ color: '#8FCFB0', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e0ece6', padding: '20px' }}>

                    {/* Price cards */}
                    {(listing.recommended_first_price || listing.recommended_discount_price) && (
                      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        {listing.recommended_first_price && (
                          <div style={{ flex: 1, minWidth: 140, backgroundColor: '#f0faf4', border: '1px solid #b8dece', borderRadius: 10, padding: '12px 16px' }}>
                            <p style={{ fontSize: 11, color: '#7A8F88', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>List at</p>
                            <p style={{ fontSize: 22, fontWeight: 700, color: '#2A6B52', margin: 0 }}>${listing.recommended_first_price}</p>
                          </div>
                        )}
                        {listing.recommended_discount_price && (
                          <div style={{ flex: 1, minWidth: 140, backgroundColor: '#F4F9F7', border: '1px solid #e0ece6', borderRadius: 10, padding: '12px 16px' }}>
                            <p style={{ fontSize: 11, color: '#7A8F88', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Discount to</p>
                            <p style={{ fontSize: 22, fontWeight: 700, color: '#1A3A32', margin: 0 }}>${listing.recommended_discount_price}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Platform tabs */}
                    {availablePlatforms.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                          {availablePlatforms.map(p => (
                            <button
                              key={p}
                              onClick={() => setActiveTabs(prev => ({ ...prev, [listing.id]: p }))}
                              style={{
                                padding: '5px 14px',
                                borderRadius: 20,
                                border: activeTab === p ? '2px solid #2A6B52' : '1px solid #d0e4dc',
                                backgroundColor: activeTab === p ? '#2A6B52' : '#fff',
                                color: activeTab === p ? '#fff' : '#4a6b5f',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              {PLATFORM_LABELS[p]}
                            </button>
                          ))}
                        </div>

                        {activeListing && (
                          <div style={{ backgroundColor: '#F4F9F7', borderRadius: 10, padding: 16 }}>
                            {activeListing.title && (
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <p style={{ fontSize: 11, color: '#7A8F88', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Title</p>
                                  <button
                                    onClick={() => copyText(activeListing.title, `${listing.id}-${activeTab}-title`)}
                                    style={{ fontSize: 12, color: '#2A6B52', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                  >
                                    {copied[`${listing.id}-${activeTab}-title`] ? '✓ Copied' : 'Copy'}
                                  </button>
                                </div>
                                <p style={{ fontSize: 14, color: '#1A3A32', margin: 0, lineHeight: 1.5 }}>{activeListing.title}</p>
                              </div>
                            )}
                            {activeListing.description && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <p style={{ fontSize: 11, color: '#7A8F88', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Description</p>
                                  <button
                                    onClick={() => copyText(activeListing.description, `${listing.id}-${activeTab}-desc`)}
                                    style={{ fontSize: 12, color: '#2A6B52', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                                  >
                                    {copied[`${listing.id}-${activeTab}-desc`] ? '✓ Copied' : 'Copy'}
                                  </button>
                                </div>
                                <p style={{ fontSize: 14, color: '#1A3A32', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{activeListing.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {listing.caveat && (
                      <div style={{ marginTop: 14, backgroundColor: '#fffbf0', border: '1px solid #f0e0a0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#8a6a00' }}>
                        💡 {listing.caveat}
                      </div>
                    )}

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <a href="/" style={{ fontSize: 13, color: '#2A6B52', fontWeight: 500, textDecoration: 'none' }}>
                        + Analyze another item →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
