# Blood Donation Management System - Patient Module

This repository contains the full-stack codebase for the **Blood Donation Management System**, focusing on the **Patient Module** implementation. This system connects patients in urgent need of blood with eligible donors nearby, streamlining request management and communication.

---

## 🌟 Key Features (Patient Module)

1. **Patient Dashboard**
   - Live tracking of all personal blood requests and their statuses.
   - Summarized statistics and quick-access panels.

2. **Blood Request Management**
   - **Create Requests**: Create normal or emergency blood requests.
   - **Critical Mode Auto-matching**: Requests marked as *Critical* are automatically approved, triggering a real-time radius-based eligible donor search.
   - **Edit & Track Requests**: Patients can modify request details or track matching progress live.

3. **Donor Matching & Search**
   - Look up eligible blood donors filtered by location coordinates (latitude and longitude) and blood group compatibility.

4. **Notifications & Communication**
   - Automatic email/in-app notifications sent to matching donors when a request is approved.
   - In-app meeting and chat coordination for blood pick-up details.

---

## 🛠️ Project Structure

The project is structured into three main layers:
- **`frontend/`**: A React + Vite SPA using TailwindCSS.
  - The Patient-specific features, routes, and hooks are located under `frontend/src/patient/`.
- **`backend/`**: A high-performance FastAPI service.
  - Patient API endpoints are defined in `backend/app/api/endpoints/patient.py`.
  - Database models (SQLite/PostgreSQL) are managed via SQLAlchemy under `backend/app/models/`.
- **`Patient/`**: A standalone copy of frontend patient assets for module packaging.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)

### 2. Running the Backend
1. Open a terminal and navigate to the backend:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will be available at `http://localhost:8000`.*

### 3. Running the Frontend
1. Open a new terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React app:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:5173`.*

---

## 📝 Author & Contribution
This sub-module represents my individual project contribution: the **Patient Feature Module** for the Blood Donation Management System.
