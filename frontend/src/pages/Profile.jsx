import { useState, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview,   setPreview]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const fileRef = useRef();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = preview || user?.profile_photo || '';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('name',  form.name);
      data.append('phone', form.phone);
      if (imageFile) data.append('profile_photo', imageFile);

      const res = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(res.data);
      setSuccess('Profile updated successfully.');
      setImageFile(null);
      setPreview('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account details</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

        {/* ── Edit form ─────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Personal Information</span>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Photo upload */}
            <div className="photo-upload">
              <div className="photo-preview">
                {avatarSrc
                  ? <img src={avatarSrc} alt="profile" />
                  : <span style={{fontSize:24}}>{initials}</span>
                }
              </div>
              <div>
                <div className="photo-upload-btn">
                  <button type="button" className="btn btn-secondary btn-sm">
                    📷 Change Photo
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:5}}>
                  JPEG, PNG, WEBP · Max 5MB
                </div>
                {imageFile && (
                  <button
                    type="button"
                    style={{fontSize:11,color:'var(--red)',background:'none',border:'none',cursor:'pointer',padding:0,marginTop:4}}
                    onClick={() => { setImageFile(null); setPreview(''); if(fileRef.current) fileRef.current.value=''; }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{opacity:0.5, cursor:'not-allowed'}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="+260 9XX XXX XXX"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ── Account info ──────────────────────── */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Account Details</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                { label: 'Role',           value: user?.role,           mono: true  },
                { label: 'Student Number', value: user?.student_number || '—', mono: true  },
                { label: 'Email',          value: user?.email,          mono: false },
                { label: 'Phone',          value: user?.phone || '—',   mono: false },
                { label: 'Member Since',   value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', {year:'numeric',month:'long',day:'numeric'}) : '—', mono: false },
              ].map(item => (
                <div key={item.label} style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:12, borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontFamily: item.mono ? 'var(--mono)' : 'inherit',
                    textTransform: item.label === 'Role' ? 'capitalize' : 'none',
                    color: item.label === 'Role' ? 'var(--accent)' : 'var(--text)',
                    fontWeight: 500,
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Profile Tips</span>
            </div>
            <ul style={{fontSize:13,color:'var(--text-muted)',lineHeight:2,paddingLeft:16}}>
              <li>Upload a clear profile photo for easy identification.</li>
              <li>Keep your phone number up to date for hostel notifications.</li>
              <li>Contact admin if you need to change your email address.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
