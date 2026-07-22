// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../services/api";
// import "./AdminDashboard.css";

// function AdminDashboard() {
//   const navigate = useNavigate();

//   const [stats, setStats] = useState({
//     total_users: 0,
//     total_donors: 0,
//     total_patients: 0,
//     total_requests: 0,
//     pending_requests: 0,
//     approved_requests: 0,
//     assigned_requests: 0,
//     completed_donations: 0,
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     loadDashboard();
//   }, []);

//   const loadDashboard = async () => {
//     try {
//       const response = await api.get("/admin/dashboard");
//       setStats(response.data);
//     } catch (err) {
//       if (
//         err.response?.status === 401 ||
//         err.response?.status === 403
//       ) {
//         localStorage.clear();
//         navigate("/login");
//         return;
//       }

//       setError("Could not load dashboard data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/login");
//   };

//   if (loading) {
//     return <h2>Loading dashboard...</h2>;
//   }

//   return (
//     <div className="admin-dashboard">
//       <header className="admin-header">
//         <div>
//           <h1>Admin Dashboard</h1>
//           <p>Blood Donation Management System</p>
//         </div>

//         <button onClick={handleLogout}>Logout</button>
//       </header>

//       {error && <div className="dashboard-error">{error}</div>}

//       <div className="dashboard-grid">
//         <div className="dashboard-card">
//           <h3>Total Users</h3>
//           <strong>{stats.total_users}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Total Donors</h3>
//           <strong>{stats.total_donors}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Total Patients</h3>
//           <strong>{stats.total_patients}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Total Requests</h3>
//           <strong>{stats.total_requests}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Pending Requests</h3>
//           <strong>{stats.pending_requests}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Approved Requests</h3>
//           <strong>{stats.approved_requests}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Assigned Requests</h3>
//           <strong>{stats.assigned_requests}</strong>
//         </div>

//         <div className="dashboard-card">
//           <h3>Completed Donations</h3>
//           <strong>{stats.completed_donations}</strong>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;




import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_users: 0,
    total_donors: 0,
    total_patients: 0,
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    assigned_requests: 0,
    completed_donations: 0,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api.get("/admin/dashboard");
      setStats(statsRes.data);

      try {
        const usersRes = await api.get("/admin/users");
        setUsers(usersRes.data || []);
      } catch (uErr) {
        console.warn("Could not fetch users list:", uErr);
      }
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <h2>Loading admin dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Blood Donation Management System — Administrator Control Panel</p>
        </div>

        <div className="header-actions">
          <Link to="/" className="home-link-btn">Homepage</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Metrics
        </button>
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management ({users.length})
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Total Users</h3>
            <strong>{stats.total_users}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Total Donors</h3>
            <strong>{stats.total_donors}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Total Patients</h3>
            <strong>{stats.total_patients}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Total Requests</h3>
            <strong>{stats.total_requests}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Pending Requests</h3>
            <strong>{stats.pending_requests || 0}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Approved Requests</h3>
            <strong>{stats.approved_requests || 0}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Assigned Requests</h3>
            <strong>{stats.assigned_requests || 0}</strong>
          </div>

          <div className="dashboard-card">
            <h3>Completed Donations</h3>
            <strong>{stats.total_donations || stats.completed_donations || 0}</strong>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="users-section">
          <h2>Registered System Users</h2>
          {users.length === 0 ? (
            <p>No user records found.</p>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td><strong>{user.full_name}</strong></td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className="blood-badge">{user.blood_group || "N/A"}</span>
                      </td>
                      <td>{user.phone || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;