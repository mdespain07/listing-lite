'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ShopPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceFilter, setPriceFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/shop')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setItems(data.items);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under $25', value: '0-25' },
    { label: '$25 – $75', value: '25-75' },
    { label: '$75 – $150', value: '75-150' },
    { label: '$150+', value: '150-999999' },
  ];

  const filtered = items.filter(item => {
    const price = parseFloat(item.current_price) || 0;
    const matchesSearch = !search || item.item_title?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (priceFilter === 'all') return true;
    const [min, max] = priceFilter.split('-').map(Number);
    return price >= min && price <= max;
  });

  const listingLinks = (item) => {
    return [item.listing_url_1, item.listing_url_2, item.listing_url_3, item.listing_url_4]
      .filter(Boolean);
  };

  const platformLabel = (url) => {
    if (!url) return 'View';
    if (url.includes('facebook')) return 'Facebook';
    if (url.includes('poshmark')) return 'Poshmark';
    if (url.includes('ebay')) return 'eBay';
    return 'View Listing';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F9F7', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
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
      }}>
        <Link href="/welcome" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="BrightListed" style={{ height: 36 }} />
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, color: '#1A3A32', fontWeight: 600 }}>
            Bright<span style={{ color: '#8FCFB0' }}>Listed</span>
          </span>
        </Link>
        <Link href="/sell" style={{
          backgroundColor: '#2A6B52',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          Sell with us →
        </Link>
      </header>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3A32 0%, #2A6B52 100%)',
        padding: '48px 24px 40px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#8FCFB0', fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          Browse Live Inventory
        </p>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(32px, 6vw, 52px)',
          color: '#fff',
          fontWeight: 700,
          margin: '0 0 12px',
          lineHeight: 1.15,
        }}>
          Shop BrightListed
        </h1>
        <p style={{ color: '#b8dece', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
          Quality pre-loved items, professionally listed. Everything here is available now.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0ece6',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        position: 'sticky',
        top: 64,
        zIndex: 40,
      }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: '1px solid #d0e4dc',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 14,
            outline: 'none',
            width: 200,
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {priceRanges.map(r => (
            <button
              key={r.value}
              onClick={() => setPriceFilter(r.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: priceFilter === r.value ? '2px solid #2A6B52' : '1px solid #d0e4dc',
                backgroundColor: priceFilter === r.value ? '#2A6B52' : '#fff',
                color: priceFilter === r.value ? '#fff' : '#4a6b5f',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#7A8F88' }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#7A8F88' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <p>Loading inventory...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#c0392b' }}>
            <p>Couldn't load items. Please try refreshing.</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, color: '#1A3A32', marginBottom: 8 }}>
              {items.length === 0 ? 'New items coming soon' : 'No items match your filters'}
            </h2>
            <p style={{ color: '#7A8F88', marginBottom: 24 }}>
              {items.length === 0
                ? 'We\'re adding inventory regularly - check back soon!'
                : 'Try adjusting your search or price filter.'}
            </p>
            {items.length === 0 && (
              <Link href="/sell" style={{
                backgroundColor: '#2A6B52',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                Sell with BrightListed →
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(item => {
              const links = listingLinks(item);
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #e0ece6',
                    boxShadow: '0 2px 8px rgba(42,107,82,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,107,82,0.14)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(42,107,82,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Photo */}
                  <div style={{ position: 'relative', paddingBottom: '100%', backgroundColor: '#f0f7f4' }}>
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.item_title || 'Item'}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8FCFB0',
                        fontSize: 40,
                      }}>
                        ✦
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      color: '#7A8F88',
                      fontWeight: 500,
                    }}>
                      {item.item_number}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h3 style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#1A3A32',
                      margin: 0,
                      lineHeight: 1.3,
                    }}>
                      {item.item_title || 'Unlisted Item'}
                    </h3>
                    <p style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#2A6B52',
                      margin: 0,
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                    }}>
                      ${parseFloat(item.current_price || 0).toFixed(2)}
                    </p>

                    {/* Links */}
                    {links.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                        {links.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: '#F4F9F7',
                              border: '1px solid #c5dfd3',
                              color: '#2A6B52',
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              textDecoration: 'none',
                              transition: 'background 0.15s',
                            }}
                          >
                            {platformLabel(url)} →
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: '#7A8F88', marginTop: 'auto', paddingTop: 8 }}>
                        Contact us to purchase
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e0ece6',
        backgroundColor: '#fff',
        padding: '32px 24px',
        textAlign: 'center',
        marginTop: 40,
      }}>
        <p style={{ fontSize: 13, color: '#7A8F88', margin: 0 }}>
          &copy; 2026 BrightListed · <Link href="/terms" style={{ color: '#7A8F88' }}>Terms</Link> · <Link href="/privacy" style={{ color: '#7A8F88' }}>Privacy</Link> · <Link href="/contact" style={{ color: '#7A8F88' }}>Contact</Link>
        </p>
      </footer>
    </div>
  );
}
