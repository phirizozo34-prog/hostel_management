import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  pending:     'badge-yellow',
  approved:    'badge-green',
  rejected:    'badge-red',
  checked_out: 'badge-gray',
};

const PAYMENT_BADGE = {
  unpaid: 'badge-orange',
  paid:   'badge-green',
};

export default function Bookings() {
  const { user } = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id, status, payment_status) => {
    setUpdating(id);
    try {
      const res = await api.put(`/bookings/${id}/status`, { status, payment_status });
      setBookings(bookings.map(b => b.id === id ? { ...b, ...res.data } : b));
      setSuccess(`Booking ${status} successfully.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update booking.');
    } finally {
      setUpdating(null);
    }
  };

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      setSuccess('Booking cancelled.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading bookings...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'All Bookings' : 'My Bookings'}</h1>
          <p className="page-subtitle">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {bookings.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <p>{isAdmin ? 'No bookings yet.' : 'You have no bookings. Go to Rooms to book one.'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {isAdmin && <th>Student</th>}
                  <th>Room</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td className="font-mono" style={{color:'var(--text-muted)'}}>#{b.id}</td>

                    {isAdmin && (
                      <td>
                        <div style={{fontWeight:600}}>{b.student_name}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>
                          {b.student_number}
                        </div>
                      </td>
                    )}

                    <td>
                      <div style={{fontWeight:600}}>Room {b.room_number}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)'}}>Block {b.block} · {b.type}</div>
                    </td>

                    <td style={{fontFamily:'var(--mono)', fontSize:12}}>{b.check_in_date?.slice(0,10)}</td>
                    <td style={{fontFamily:'var(--mono)', fontSize:12}}>{b.check_out_date?.slice(0,10)}</td>

                    <td><span className={`badge ${STATUS_BADGE[b.status]}`}>{b.status}</span></td>
                    <td><span className={`badge ${PAYMENT_BADGE[b.payment_status]}`}>{b.payment_status}</span></td>

                    <td>
                      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        {/* Admin actions */}
                        {isAdmin && b.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              disabled={updating === b.id}
                              onClick={() => updateStatus(b.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={updating === b.id}
                              onClick={() => updateStatus(b.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isAdmin && b.status === 'approved' && (
                          <>
                            {b.payment_status === 'unpaid' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                disabled={updating === b.id}
                                onClick={() => updateStatus(b.id, 'approved', 'paid')}
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={updating === b.id}
                              onClick={() => updateStatus(b.id, 'checked_out')}
                            >
                              Check Out
                            </button>
                          </>
                        )}

                        {/* Student actions */}
                        {!isAdmin && b.status === 'pending' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => cancelBooking(b.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
