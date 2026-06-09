import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  available:   'badge-green',
  full:        'badge-red',
  maintenance: 'badge-yellow',
};

const EMPTY_ROOM = {
  room_number: '', block: '', type: 'Single',
  capacity: 1, price_per_month: '', amenities: '', status: 'available',
};

export default function Rooms() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [filterBlock,  setFilterBlock]  = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [editRoom,  setEditRoom]    = useState(null);
  const [form,      setForm]        = useState(EMPTY_ROOM);
  const [saving,    setSaving]      = useState(false);

  // Booking modal
  const [showBook, setShowBook] = useState(false);
  const [bookRoom, setBookRoom] = useState(null);
  const [bookForm, setBookForm] = useState({ check_in_date: '', check_out_date: '', notes: '' });
  const [booking,  setBooking]  = useState(false);

  const fetchRooms = async () => {
    try {
      const params = {};
      if (filterBlock)  params.block  = filterBlock;
      if (filterType)   params.type   = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/rooms', { params });
      setRooms(res.data);
    } catch (err) {
      setError('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [filterBlock, filterType, filterStatus]);

  const openCreate = () => { setEditRoom(null); setForm(EMPTY_ROOM); setShowModal(true); };
  const openEdit   = (room) => {
    setEditRoom(room);
    setForm({ ...room });
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editRoom) {
        const res = await api.put(`/rooms/${editRoom.id}`, form);
        setRooms(rooms.map(r => r.id === editRoom.id ? res.data : r));
        setSuccess('Room updated successfully.');
      } else {
        const res = await api.post('/rooms', form);
        setRooms([res.data, ...rooms]);
        setSuccess('Room created successfully.');
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      setRooms(rooms.filter(r => r.id !== id));
      setSuccess('Room deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room.');
    }
  };

  const openBook = (room) => {
    setBookRoom(room);
    setBookForm({ check_in_date: '', check_out_date: '', notes: '' });
    setShowBook(true);
  };

  const handleBook = async e => {
    e.preventDefault();
    setBooking(true);
    setError('');
    try {
      await api.post('/bookings', { room_id: bookRoom.id, ...bookForm });
      setSuccess('Booking submitted! Awaiting admin approval.');
      setShowBook(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading rooms...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-subtitle">{rooms.length} rooms found</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Room</button>
        )}
      </div>

      {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {/* Filters */}
      <div className="filter-bar">
        <select className="form-control" value={filterBlock} onChange={e => setFilterBlock(e.target.value)}>
          <option value="">All Blocks</option>
          {['A','B','C','D'].map(b => <option key={b} value={b}>Block {b}</option>)}
        </select>
        <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {['Single','Double','Triple'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="full">Full</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterBlock(''); setFilterType(''); setFilterStatus(''); }}>
          Clear
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🚪</div>
          <p>No rooms found matching your filters.</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <div>
                  <div className="room-number">Room {room.room_number}</div>
                  <div className="room-type">Block {room.block} · {room.type}</div>
                </div>
                <span className={`badge ${STATUS_BADGE[room.status]}`}>{room.status}</span>
              </div>

              <div className="room-price">ZMW {Number(room.price_per_month).toLocaleString()}<span style={{fontSize:11,color:'var(--text-muted)',fontWeight:400}}>/mo</span></div>

              <div className="room-meta">
                <span>👥 Capacity: {room.occupied}/{room.capacity}</span>
                <span>🏢 Block {room.block}</span>
              </div>

              {room.amenities && (
                <div className="room-amenities">✓ {room.amenities}</div>
              )}

              <div className="room-actions">
                {!isAdmin && room.status === 'available' && room.occupied < room.capacity && (
                  <button className="btn btn-primary btn-sm" onClick={() => openBook(room)}>
                    Book Room
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(room)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(room.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Admin: Add/Edit Room Modal ─────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input className="form-control" value={form.room_number}
                    onChange={e => setForm({...form, room_number: e.target.value})} required placeholder="A101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Block</label>
                  <input className="form-control" value={form.block}
                    onChange={e => setForm({...form, block: e.target.value})} required placeholder="A" maxLength={10} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Type</label>
                  <select className="form-control" value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}>
                    <option>Single</option><option>Double</option><option>Triple</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input type="number" className="form-control" value={form.capacity} min={1} max={10}
                    onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price / Month (ZMW)</label>
                  <input type="number" className="form-control" value={form.price_per_month} min={0} step="0.01"
                    onChange={e => setForm({...form, price_per_month: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities</label>
                <input className="form-control" value={form.amenities}
                  onChange={e => setForm({...form, amenities: e.target.value})}
                  placeholder="Wi-Fi, Study Desk, Wardrobe, En-Suite" />
              </div>

              <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Student: Book Room Modal ────────────────────── */}
      {showBook && bookRoom && (
        <div className="modal-overlay" onClick={() => setShowBook(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Book Room {bookRoom.room_number}</h2>
              <button className="modal-close" onClick={() => setShowBook(false)}>✕</button>
            </div>

            <div className="alert alert-info" style={{marginBottom:20}}>
              Block {bookRoom.block} · {bookRoom.type} · ZMW {Number(bookRoom.price_per_month).toLocaleString()}/mo
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleBook}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Check-In Date</label>
                  <input type="date" className="form-control" value={bookForm.check_in_date}
                    onChange={e => setBookForm({...bookForm, check_in_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Check-Out Date</label>
                  <input type="date" className="form-control" value={bookForm.check_out_date}
                    onChange={e => setBookForm({...bookForm, check_out_date: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-control" value={bookForm.notes}
                  onChange={e => setBookForm({...bookForm, notes: e.target.value})}
                  placeholder="Any special requirements..." rows={3} />
              </div>

              <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBook(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={booking}>
                  {booking ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
