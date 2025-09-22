import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export const AuthWrapper = ({ children }) => {
  const { user, loading, login, register, confirmRegistration, logout, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
          Welcome, {user.username}!
          <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
        </div>
        {children}
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (needsConfirmation) {
        await confirmRegistration(email, confirmationCode);
        setNeedsConfirmation(false);
        await login(email, password);
      } else if (isLogin) {
        await login(email, password);
      } else {
        const result = await register(email, password);
        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          setNeedsConfirmation(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  if (needsConfirmation) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
        <h2>Confirm Registration</h2>
        <p>Please check your email for a confirmation code.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Confirmation Code:</label>
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: '10px' }}>
            Confirm
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
        >
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
};