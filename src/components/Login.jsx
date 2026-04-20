import React, { useState } from 'react';
import { loginUser, auth } from '../logic/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                const { error: loginError } = await loginUser(email, password);
                if (loginError) setError("Inloggen mislukt: " + loginError);
            }
        } catch (err) {
            setError((isRegister ? "Registratie mislukt: " : "Inloggen mislukt: ") + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" style={{ background: 'var(--bg-color)' }}>
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{isRegister ? '📝' : '🔐'}</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>{isRegister ? 'Account Aanmaken' : 'Bestel Tracker'}</h1>
                    <p className="stat-label">{isRegister ? 'Maak een nieuw account aan' : 'Log in om door te gaan'}</p>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="naam@voorbeeld.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Wachtwoord</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: '3.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '38px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '0.5rem'
                            }}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>

                    {error && (
                        <div className="badge badge-warning" style={{ width: '100%', padding: '1rem', whiteSpace: 'normal', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        {loading ? 'Laden...' : (isRegister ? 'Registreren' : 'Inloggen')}
                    </button>
                </form>

                <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <p>
                        {isRegister ? 'Heb je al een account?' : 'Nog geen account?'}
                        <button 
                            className="secondary" 
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', marginLeft: '0.5rem', textDecoration: 'underline' }}
                            onClick={() => setIsRegister(!isRegister)}
                        >
                            {isRegister ? 'Log in' : 'Registreer hier'}
                        </button>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Login;
