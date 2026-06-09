import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Hostel Administration Panel' : `Student • ${user?.student_number || 'No student number'}`}
          </p>
        </div>
      </div>

      {/* ── Admin stats ───────────────────────────────── */}
      {isAdmin && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Rooms</div>
              <div className="stat-value">{stats.rooms?.total ?? 0}</div>
              <div className="stat-sub">{stats.rooms?.available ?? 0} available</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Students</div>
              <div className="stat-value">{stats.students?.total ?? 0}</div>
              <div className="stat-sub">Registered accounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bookings</div>
              <div className="stat-value">{stats.bookings?.total ?? 0}</div>
              <div className="stat-sub" style={{color:'var(--yellow)'}}>
                {stats.bookings?.pending ?? 0} pending approval
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Maintenance</div>
              <div className="stat-value">{stats.maintenance?.open ?? 0}</div>
              <div className="stat-sub">Open requests</div>
            </div>
          </div>

          {/* Quick status breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Room Status</span>
                <Link to="/rooms" className="btn btn-secondary btn-sm">Manage</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Available', value: stats.rooms?.available ?? 0, color: 'var(--green)' },
                  { label: 'Full',      value: stats.rooms?.full ?? 0,      color: 'var(--red)'   },
                  { label: 'Maintenance', value: stats.rooms?.maintenance ?? 0, color: 'var(--yellow)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: 'var(--mono)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Booking Requests</span>
                <Link to="/bookings" className="btn btn-secondary btn-sm">Review</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Pending',  value: stats.bookings?.pending ?? 0,  color: 'var(--yellow)' },
                  { label: 'Approved', value: stats.bookings?.approved ?? 0, color: 'var(--green)'  },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: 'var(--mono)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Student stats ─────────────────────────────── */}
      {!isAdmin && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">My Bookings</div>
              <div className="stat-value">{stats.bookings?.total ?? 0}</div>
              <div className="stat-sub">{stats.bookings?.approved ?? 0} approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{color:'var(--yellow)'}}>{stats.bookings?.pending ?? 0}</div>
              <div className="stat-sub">Awaiting approval</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Maintenance</div>
              <div className="stat-value">{stats.maintenance?.total ?? 0}</div>
              <div className="stat-sub">Submitted requests</div>
            </div>
          </div>

          {/* Quick actions for student */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Actions</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/rooms" className="btn btn-primary">🚪 Browse Rooms</Link>
              <Link to="/bookings" className="btn btn-secondary">📋 View My Bookings</Link>
              <Link to="/maintenance" className="btn btn-secondary">🔧 Report an Issue</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
