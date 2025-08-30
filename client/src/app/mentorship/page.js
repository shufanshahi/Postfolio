"use client";

import React, { useEffect, useState } from 'react';

const cardGradient = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
const accentColor = '#6366f1';
const secondaryColor = '#f1f5f9';

const MentorshipPage = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentorships = async () => {
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
    fetchMentorships();
  }, []);

  if (loading) return <div className="mentorship-loading">Loading mentorships...</div>;
  if (error) return <div className="mentorship-error">Error: {error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
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
