import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    api.get('/auth/students')
      .then(res => setStudents(res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.student_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (loading) return <div className="loading"><div className="spinner" /> Loading students...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} registered student{students.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Search */}
      <div className="filter-bar">
        <input
          className="form-control"
          style={{maxWidth: 320}}
          placeholder="Search by name, email, or student number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎓</div>
          <p>{search ? 'No students match your search.' : 'No students registered yet.'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student Number</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div className="user-avatar" style={{width:34,height:34,fontSize:12}}>
                          {s.profile_photo
                            ? <img src={s.profile_photo} alt={s.name} />
                            : initials(s.name)
                          }
                        </div>
                        <span style={{fontWeight:600}}>{s.name}</span>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono" style={{fontSize:12}}>
                        {s.student_number || <span style={{color:'var(--text-dim)'}}>—</span>}
                      </span>
                    </td>

                    <td style={{fontSize:13,color:'var(--text-muted)'}}>{s.email}</td>

                    <td style={{fontSize:13,color:'var(--text-muted)'}}>
                      {s.phone || <span style={{color:'var(--text-dim)'}}>—</span>}
                    </td>

                    <td style={{fontSize:12,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>
                      {new Date(s.created_at).toLocaleDateString()}
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
