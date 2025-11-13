import { useUser, useLogout } from '../hooks/useAuth';
import './Dashboard.css';

const Dashboard = () => {
  const { data: user, isLoading, error } = useUser();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading user data</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          className="logout-button"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.name ?? 'User'}!</h2>
          <p className="welcome-message">
            You have successfully logged in with JWT authentication.
          </p>
        </div>

        <div className="user-info-card">
          <h3>User Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{user?.id ?? '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email ?? '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{user?.name ?? '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{user?.role ?? '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created At:</span>
              <span className="info-value">{user?.createdAt ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="token-info-card">
          <h3>Token Information</h3>
          <div className="token-info">
            <p>
              <strong>Access Token:</strong> Stored in memory (session)
            </p>
            <p>
              <strong>Refresh Token:</strong> Stored in localStorage
            </p>
            <p className="info-note">
              The access token will automatically refresh when it expires using
              the refresh token.
            </p>
          </div>
        </div>

        <div className="features-card">
          <h3>Features Implemented</h3>
          <ul className="features-list">
            <li>✅ JWT Access Token Authentication</li>
            <li>✅ Refresh Token Management</li>
            <li>✅ Automatic Token Refresh on Expiry</li>
            <li>✅ Protected Routes</li>
            <li>✅ React Query for State Management</li>
            <li>✅ React Hook Form with Validation</li>
            <li>✅ Axios Interceptors</li>
            <li>✅ Error Handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

