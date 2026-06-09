import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/zuct-logo.jpg" alt="ZUCT Logo" style={{width: 90, height: 90, objectFit: 'contain', marginBottom: 8}} />
          <h1>ZUCT Hostel</h1>
          <p>Zambia University College of Technology</p>
        </div>

        <h2 className="auth-title">Welcome Back</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="you@zuct.ac.zm"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:14,height:14}} /> Logging in...</> : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        {/* Demo credentials hint */}
        <div className="alert alert-info" style={{ marginTop: 20, marginBottom: 0, fontSize: 12 }}>
          <strong>Demo Credentials</strong><br />
          Admin: admin@zuct.ac.zm / admin123<br />
          Student: moses@zuct.ac.zm / student123
        </div>
      </div>
    </div>
  );
}
