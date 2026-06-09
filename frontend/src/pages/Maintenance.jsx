import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  open:        'badge-red',
  in_progress: 'badge-yellow',
  resolved:    'badge-green',
};

const STATUS_LABEL = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
};

export default function Maintenance() {
  const { user } = useAuth();
  const isAdmin   = user?.role === 'admin';

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // New request form
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ title: '', description: '', room_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  // Detail modal
  const [viewItem, setViewItem] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/maintenance');
      setRequests(res.data);
    } catch (err) {
      setError('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({ title: '', description: '', room_id: '' });
    setImageFile(null);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title',       form.title);
      data.append('description', form.description);
      if (form.room_id) data.append('room_id', form.room_id);
      if (imageFile)    data.append('image', imageFile);

      const res = await api.post('/maintenance', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setRequests([res.data, ...requests]);
      setSuccess('Maintenance request submitted successfully.');
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/maintenance/${id}/status`, { status });
      setRequests(requests.map(r => r.id === id ? { ...r, status: res.data.status } : r));
      setSuccess(`Request marked as "${STATUS_LABEL[status]}".`);
      if (viewItem?.id === id) setViewItem({ ...viewItem, status: res.data.status });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm('Delete this maintenance request?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      setRequests(requests.filter(r => r.id !== id));
      setSuccess('Request deleted.');
      if (viewItem?.id === id) setViewItem(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete request.');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Requests</h1>
          <p className="page-subtitle">{requests.length} request{requests.length !== 1 ? 's' : ''} total</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + New Request
          </button>
        )}
      </div>

      {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success}</div>}

      {requests.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔧</div>
          <p>{isAdmin ? 'No maintenance requests yet.' : 'No requests submitted. Click "New Request" to report an issue.'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {isAdmin && <th>Student</th>}
                  <th>Title</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono" style={{color:'var(--text-muted)'}}>#{r.id}</td>

                    {isAdmin && (
                      <td>
                        <div style={{fontWeight:600}}>{r.student_name}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>
                          {r.student_number}
                        </div>
                      </td>
                    )}

                    <td>
                      <div style={{fontWeight:600}}>{r.title}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',maxWidth:240,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {r.description}
                      </div>
                    </td>

                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>
                      {r.room_number ? `${r.room_number} (Block ${r.block})` : '—'}
                    </td>

                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>

                    <td style={{fontSize:12,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewItem(r)}>
                          View
                        </button>

                        {isAdmin && r.status !== 'resolved' && (
                          <>
                            {r.status === 'open' && (
                              <button className="btn btn-secondary btn-sm"
                                onClick={() => updateStatus(r.id, 'in_progress')}>
                                Start
                              </button>
                            )}
                            <button className="btn btn-success btn-sm"
                              onClick={() => updateStatus(r.id, 'resolved')}>
                              Resolve
                            </button>
                          </>
                        )}

                        {(!isAdmin || isAdmin) && (
                          <button className="btn btn-danger btn-sm" onClick={() => deleteRequest(r.id)}>
                            Delete
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

      {/* ─── Submit Request Modal ───────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Report an Issue</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Broken window lock"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room Number (Optional)</label>
                <input
                  className="form-control"
                  value={form.room_id}
                  onChange={e => setForm({...form, room_id: e.target.value})}
                  placeholder="Room ID or leave blank"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>

              {/* File upload */}
              <div className="form-group">
                <label className="form-label">Attach Photo (Optional)</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'border-color 0.15s',
                }}
                  onDragOver={e => e.preventDefault()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: 'absolute', inset: 0, opacity: 0,
                      cursor: 'pointer', width: '100%', height: '100%'
                    }}
                  />
                  {preview ? (
                    <img src={preview} alt="preview" style={{
                      maxHeight: 160, maxWidth: '100%', borderRadius: 6,
                      border: '1px solid var(--border)'
                    }} />
                  ) : (
                    <>
                      <div style={{fontSize:28,marginBottom:8}}>📷</div>
                      <div style={{fontSize:13,color:'var(--text-muted)'}}>
                        Click or drag an image here
                      </div>
                      <div style={{fontSize:11,color:'var(--text-dim)',marginTop:4}}>
                        JPEG, PNG, WEBP up to 10MB
                      </div>
                    </>
                  )}
                </div>
                {imageFile && (
                  <button type="button"
                    style={{marginTop:8,fontSize:12,color:'var(--red)',background:'none',border:'none',cursor:'pointer'}}
                    onClick={() => { setImageFile(null); setPreview(''); if(fileRef.current) fileRef.current.value=''; }}>
                    ✕ Remove image
                  </button>
                )}
              </div>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Request Detail Modal ──────────────────── */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request #{viewItem.id}</h2>
              <button className="modal-close" onClick={() => setViewItem(null)}>✕</button>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
              <span className={`badge ${STATUS_BADGE[viewItem.status]}`}>{STATUS_LABEL[viewItem.status]}</span>
              <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>
                {new Date(viewItem.created_at).toLocaleString()}
              </span>
            </div>

            <h3 style={{fontSize:16,fontWeight:700,marginBottom:10}}>{viewItem.title}</h3>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.7,marginBottom:16}}>
              {viewItem.description}
            </p>

            {viewItem.room_number && (
              <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                📍 Room {viewItem.room_number}, Block {viewItem.block}
              </p>
            )}

            {isAdmin && viewItem.student_name && (
              <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                👤 {viewItem.student_name} ({viewItem.student_number})
              </p>
            )}

            {viewItem.image_path && (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:6}}>Attached Photo:</div>
                <img
                  src={viewItem.image_path}
                  alt="issue"
                  className="issue-image"
                  style={{maxHeight:240}}
                />
              </div>
            )}

            {isAdmin && viewItem.status !== 'resolved' && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}>
                {viewItem.status === 'open' && (
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => updateStatus(viewItem.id, 'in_progress')}>
                    Mark In Progress
                  </button>
                )}
                <button className="btn btn-success btn-sm"
                  onClick={() => updateStatus(viewItem.id, 'resolved')}>
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
