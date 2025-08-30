"use client";

import React, { useEffect, useState } from 'react';

const cardGradient = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
const accentColor = '#6366f1';
const secondaryColor = '#f1f5f9';

const menuOptions = [
  { label: 'Create', value: 'create' },
  { label: 'Purchased', value: 'purchased' },
  { label: 'All', value: 'all' },
  { label: 'My Programs', value: 'my-programs' },
];

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
];

const MentorshipPage = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specialization: '',
    status: 'ACTIVE',
    price: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchMentorships = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('http://localhost:8080/api/mentorships', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch mentorships');
      const data = await res.json();
      setMentorships(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorships();
  }, []);

  const handleMenuClick = (option) => {
    setMenuOpen(false);
    if (option.value === 'create') setShowCreate(true);
    // Other options can be handled here
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const token = localStorage.getItem("token");
      // Fetch profileId
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profile = await profileRes.json();
      const profileId = profile.id;
      // Prepare mentorship data
      const mentorshipData = {
        name: form.name,
        specialization: form.specialization,
        status: form.status,
        price: parseFloat(form.price),
        totalEnrolled: 0,
        rating: 0.0,
        profileId,
        enrolledIds: []
      };
      // POST mentorship
      const postRes = await fetch('http://localhost:8080/api/mentorships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mentorshipData)
      });
      if (!postRes.ok) throw new Error('Failed to create mentorship');
      setShowCreate(false);
      setForm({ name: '', specialization: '', status: 'ACTIVE', price: '' });
      fetchMentorships();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="mentorship-loading">Loading mentorships...</div>;
  if (error) return <div className="mentorship-error">Error: {error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, position: 'relative' }}>
        {/* Hamburger menu button */}
        <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            style={{
              background: 'white',
              border: `1.5px solid ${secondaryColor}`,
              borderRadius: 10,
              width: 44,
              height: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: menuOpen ? '0 4px 16px 0 rgba(99,102,241,0.10)' : 'none',
              transition: 'box-shadow 0.2s',
              outline: 'none',
              position: 'relative',
            }}
            aria-label="Open menu"
          >
            <span style={{ width: 22, height: 3, background: accentColor, borderRadius: 2, marginBottom: 4, display: 'block' }}></span>
            <span style={{ width: 22, height: 3, background: accentColor, borderRadius: 2, marginBottom: 4, display: 'block' }}></span>
            <span style={{ width: 22, height: 3, background: accentColor, borderRadius: 2, display: 'block' }}></span>
            {/* Dropdown menu */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 0,
                  background: 'white',
                  border: `1.5px solid ${secondaryColor}`,
                  borderRadius: 12,
                  boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)',
                  minWidth: 160,
                  padding: '8px 0',
                  zIndex: 100,
                  marginTop: 8
                }}
              >
                {menuOptions.map((option) => (
                  <div
                    key={option.value}
                    style={{
                      padding: '10px 20px',
                      cursor: 'pointer',
                      color: accentColor,
                      fontWeight: 600,
                      fontSize: 15,
                      transition: 'background 0.15s',
                      borderRadius: 8,
                    }}
                    onClick={() => handleMenuClick(option)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
        {/* Create Mentorship Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(30,41,59,0.18)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 18,
              boxShadow: '0 8px 32px 0 rgba(99,102,241,0.13)',
              padding: 36,
              minWidth: 340,
              maxWidth: 95,
              width: 400,
              position: 'relative',
            }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
                aria-label="Close"
              >×</button>
              <h2 style={{ color: accentColor, fontWeight: 800, fontSize: 24, marginBottom: 18 }}>Create Mentorship</h2>
              <form onSubmit={handleFormSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${secondaryColor}`,
                      fontSize: 16
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={form.specialization}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${secondaryColor}`,
                      fontSize: 16
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${secondaryColor}`,
                      fontSize: 16
                    }}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Price (USD)</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${secondaryColor}`,
                      fontSize: 16
                    }}
                  />
                </div>
                {formError && <div style={{ color: '#dc2626', marginBottom: 12 }}>{formError}</div>}
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    width: '100%',
                    background: accentColor,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 17,
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 0',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    opacity: formLoading ? 0.7 : 1
                  }}
                >
                  {formLoading ? 'Creating...' : 'Create Mentorship'}
                </button>
              </form>
            </div>
          </div>
        )}
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          color: accentColor,
          marginBottom: 32,
          letterSpacing: -1
        }}>🌟 Explore Mentorships</h1>
        {mentorships.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 20, textAlign: 'center', marginTop: 60 }}>No mentorships found.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32
          }}>
            {mentorships.map((m) => (
              <div
                key={m.id}
                style={{
                  background: cardGradient,
                  borderRadius: 18,
                  boxShadow: '0 4px 24px 0 rgba(99,102,241,0.08)',
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  border: `1.5px solid ${secondaryColor}`,
                  transition: 'box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 260
                }}
              >
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: accentColor,
                  marginBottom: 8
                }}>{m.name}</h2>
                <div style={{ color: '#64748b', fontWeight: 500, marginBottom: 16 }}>{m.specialization}</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{
                    background: '#e0e7ff',
                    color: accentColor,
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontWeight: 600,
                    fontSize: 13
                  }}>{m.status}</span>
                  <span style={{
                    background: '#fef9c3',
                    color: '#b45309',
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontWeight: 600,
                    fontSize: 13
                  }}>Enrolled: {m.totalEnrolled}</span>
                  <span style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontWeight: 600,
                    fontSize: 13
                  }}>Rating: {m.rating}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Price:</span> <span style={{ color: accentColor, fontWeight: 700 }}>${m.price}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Profile ID:</span> <span>{m.profileId}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Enrolled Profiles:</span> <span>{m.enrolledIds && m.enrolledIds.length > 0 ? m.enrolledIds.join(', ') : 'None'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorshipPage;
