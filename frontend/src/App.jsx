// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />

//         <Route path="/login" element={<Login />} />

//         <Route path="/register" element={<Register />} />

//         <Route path="/dashboard" element={<Dashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;







// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import Login from "./Pages/Login";
// import Register from "./Pages/Register";
// import AdminDashboard from "./admin/AdminDashboard";
// import AdminProtectedRoute from "./components/AdminProtectedRoute";

// function DonorDashboard() {
//   return <h1>Donor Dashboard</h1>;
// }

// function PatientDashboard() {
//   return <h1>Patient Dashboard</h1>;
// }

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route
//           path="/"
//           element={<Navigate to="/login" replace />}
//         />

//         <Route
//           path="/login"
//           element={<Login />}
//         />

//         <Route
//           path="/register"
//           element={<Register />}
//         />

//         <Route
//           path="/admin/dashboard"
//           element={
//             <AdminProtectedRoute>
//               <AdminDashboard />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="/donor/dashboard"
//           element={<DonorDashboard />}
//         />

//         <Route
//           path="/patient/dashboard"
//           element={<PatientDashboard />}
//         />

//         <Route
//           path="*"
//           element={<Navigate to="/login" replace />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import Home from "./Pages/Home";
// import Login from "./Pages/Login";
// import Register from "./Pages/Register";
// import AdminDashboard from "./admin/AdminDashboard";
// import AdminProtectedRoute from "./components/AdminProtectedRoute";

// function DonorDashboard() {
//   return <h1>Donor Dashboard</h1>;
// }

// function PatientDashboard() {
//   return <h1>Patient Dashboard</h1>;
// }

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route
//           path="/"
//           element={<Home />}
//         />

//         <Route
//           path="/login"
//           element={<Login />}
//         />

//         <Route
//           path="/register"
//           element={<Register />}
//         />

//         <Route
//           path="/admin/dashboard"
//           element={
//             <AdminProtectedRoute>
//               <AdminDashboard />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="/donor/dashboard"
//           element={<DonorDashboard />}
//         />

//         <Route
//           path="/patient/dashboard"
//           element={<PatientDashboard />}
//         />

//         <Route
//           path="*"
//           element={<Navigate to="/" replace />}
//         />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;



import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate
} from "react-router-dom";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

function DonorDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Donor Dashboard</h1>
          <p>Blood Donation Management System — Donor Portal</p>
        </div>
        <div className="header-actions">
          <Link to="/" className="home-link-btn">Homepage</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="users-section">
        <h2>Welcome, Donor!</h2>
        <p>Thank you for offering to save lives. Manage your donation history and active requests here.</p>
      </div>
    </div>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Patient Dashboard</h1>
          <p>Blood Donation Management System — Patient Portal</p>
        </div>
        <div className="header-actions">
          <Link to="/" className="home-link-btn">Homepage</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="users-section">
        <h2>Welcome, Patient!</h2>
        <p>Request blood and track blood donation request statuses here.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/donor/dashboard"
          element={<DonorDashboard />}
        />

        <Route
          path="/patient/dashboard"
          element={<PatientDashboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;