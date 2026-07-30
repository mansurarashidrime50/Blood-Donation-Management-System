# 🩸 Technical Deep Dive — Blood Donation Management System

> Feature used for all examples: **Donor Registration** (`POST /register`)

---

## ⚛️ REACT FRONTEND

### 1. Which React component contains this feature?

**[Register.jsx](file:///c:/Users/RAGIB-MOHONA/Desktop/Blood%20Donation%20Management%20System/frontend/src/pages/Register.jsx)**

This is the main page-level component. It is a self-contained form split into 4 sections:
- Section 1 → Account Credentials (name, email, password)
- Section 2 → Vital Stats (phone, DOB, gender, blood group, weight)
- Section 3 → Location (division, district, area, address)
- Section 4 → Medical Declarations & Terms Consent

---

### 2. Component Hierarchy for Donor Registration

```
<App>                         ← BrowserRouter + AuthProvider
  └── <AppContent>            ← Route switcher + layout
        ├── <Navbar />        ← Sticky top navigation
        ├── <PublicRoute>     ← Guard: redirects logged-in users away
        │     └── <Register> ← Main registration page
        │           └── <form>
        │                 ├── Section 1: Credentials inputs
        │                 ├── Section 2: Vitals inputs
        │                 ├── Section 3: Location selects
        │                 └── Section 4: Medical + Terms checkbox
        └── <Footer />        ← Site footer
```

---

### 3. Which function is executed when the user submits the form?

**`onSubmit(data)`** — defined at [Register.jsx L34](file:///c:/Users/RAGIB-MOHONA/Desktop/Blood%20Donation%20Management%20System/frontend/src/pages/Register.jsx#L34-L71)

```js
const onSubmit = async (data) => {
  setIsLoading(true);       // Show spinner on submit button
  setApiError(null);        // Clear previous errors

  const payload = { ...data, weight: parseFloat(data.weight), availability: true };

  try {
    await authRegister(payload);            // API call via AuthContext
    navigate('/login', { state: { registered: true } }); // Redirect on success
  } catch (err) {
    setApiError(err.response?.data?.detail || 'Registration failed.');
  } finally {
    setIsLoading(false);    // Always hide spinner
  }
};
```

This is wired to the `<form>` via `handleSubmit(onSubmit)` from React Hook Form — `handleSubmit` runs all validators first, and only calls `onSubmit` if ALL fields pass.

---

### 4. Frontend flow from user action → API request

```
User fills form → clicks "Complete Registration"
        ↓
<form onSubmit={handleSubmit(onSubmit)}>
        ↓
React Hook Form runs all field validators synchronously:
  - required checks
  - email pattern regex
  - validatePasswordStrength() custom function
  - validateAge() custom function (must be >= 18)
  - weight min:50 rule
  - confirm_password cross-field match
        ↓
If ANY validator fails → show inline red error message, STOP
        ↓
If ALL pass → onSubmit(data) is called
        ↓
setIsLoading(true) → button shows spinner + disabled
        ↓
authRegister(payload) from AuthContext called
        ↓
AuthContext.register() → api.post('/register', data)
        ↓
Axios fires POST http://localhost:8000/register
  Headers: { Content-Type: application/json }
  Body: JSON payload with all donor fields
        ↓
Response 201 → navigate('/login', { state: { registered: true } })
Response 4xx → setApiError(detail) → red banner shows
```

---

### 5. React Hooks Used and Why

| Hook | File | Why |
|---|---|---|
| `useState` | Register.jsx L21-23 | Tracks `apiError`, `isLoading`, and `selectedDivision` local UI states |
| `useForm()` | Register.jsx L25-30 | Manages form field registration, validation, and submission from `react-hook-form` |
| `watch('password')` | Register.jsx L32 | Watches the `password` field live so `confirm_password` can compare against it |
| `useNavigate` | Register.jsx L20 | Imperative navigation to `/login` after successful registration |
| `useAuth()` | Register.jsx L19 | Custom hook — pulls `register` function from `AuthContext` |
| `useState` | AuthContext.jsx L7-8 | Tracks global `user` object and `loading` state across entire app |
| `useEffect` | AuthContext.jsx L10 | Runs once on mount to rehydrate session from `localStorage` |
| `useContext` | AuthContext.jsx L112 | Powers the `useAuth()` hook to read Context values |

---

### 6. How is State Managed?

**Two levels of state:**

**Local component state** (in `Register.jsx`):
```js
const [apiError, setApiError] = useState(null);     // API error message
const [isLoading, setIsLoading] = useState(false);  // Spinner on/off
const [selectedDivision, setSelectedDivision] = useState(''); // Dynamic district dropdown
```

**Global application state** (in `AuthContext.jsx`):
```js
const [user, setUser] = useState(null);       // Current authenticated donor object
const [loading, setLoading] = useState(true); // Global init loading state
```

React Hook Form manages form field values internally (uncontrolled components backed by refs), not in React state — making it highly performant since it doesn't re-render on every keystroke.

---

### 7. How is User Input Validated?

**Two layers of validation:**

**Client-side (React Hook Form):**
```js
// Required fields
{...register('full_name', { required: 'Full name is required' })}

// Email regex pattern
{...register('email', {
  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i }
})}

// Custom age validator
{...register('dob', { validate: validateAge })}
// validateAge checks: age >= 18

// Custom password strength
{...register('password', { validate: validatePasswordStrength })}
// Checks: length >= 8, uppercase, lowercase, digit, special char

// Weight min value
{...register('weight', { min: { value: 50.0 } })}

// Cross-field confirm password match
validate: (value) => value === passwordValue || 'Passwords do not match'
```

**Server-side (Pydantic in FastAPI):**
```python
# schemas/donor.py
weight: float = Field(..., ge=50.0)           # ge = greater than or equal
@field_validator("dob") → age >= 18
@field_validator("phone") → regex 10-20 digits
@model_validator → passwords must match
email: EmailStr                                # Pydantic email format
```

Both layers enforce the same rules — client-side for UX speed, server-side as the final security gate.

---

### 8. How are Loading States Handled?

```js
// Register.jsx L35, L68-69
setIsLoading(true);    // Set before API call
// ...await authRegister(payload)
setIsLoading(false);   // Always reset in finally block

// In the JSX button:
<button type="submit" disabled={isLoading}>
  {isLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
  {isLoading ? 'Creating Account...' : 'Complete Registration'}
</button>
```

- Button is **disabled** (prevents double-submit)
- A **CSS spinning border** animation shows inside the button
- Text changes from `Complete Registration` → `Creating Account...`

---

## 🌐 BROWSER DEVTOOLS — Network Tab

### Network Tab — What you would see for POST /register:

**Request URL:**
```
http://localhost:8000/register
```

**HTTP Method:**
```
POST
```

**Request Headers:**
```
Content-Type: application/json
Accept: application/json, text/plain, */*
Origin: http://localhost:5173
```

**Request Payload (JSON body):**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "phone": "+8801712345678",
  "dob": "2000-01-15",
  "gender": "Male",
  "blood_group": "O+",
  "division": "Dhaka",
  "district": "Dhaka",
  "area": "Mirpur",
  "address": "House 10, Road 5",
  "weight": 70.0,
  "availability": true,
  "terms_accepted": true
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "uuid": "a1b2c3d4-...",
  "full_name": "John Doe",
  "email": "john@example.com",
  "blood_group": "O+",
  "availability": true,
  "created_at": "2026-07-22T16:55:47Z"
}
```

**HTTP Status Code:** `201 Created`

**Request time:** Typically `8–15ms` on localhost (bcrypt hashing adds ~100-200ms)

> The relevant request in the Network tab is labeled `register` under `localhost:8000`, Method = POST, Status = 201.

---

## ⚛️ REACT DEVELOPER TOOLS

### Component Hierarchy (as seen in React DevTools):

```
<Router>
  <AuthProvider>              ← Context: { user, loading, login, register... }
    <AppContent>
      <Navbar>
        <Link> <NavLink> <button>
      </Navbar>
      <PublicRoute>           ← Checks: user === null
        <Register>            ← Props: none | State: { apiError, isLoading, selectedDivision }
          <form>
            <input>           ← Registered with react-hook-form refs
            <select>
            <textarea>
            <button>
      <Footer />
```

In React DevTools you can click on `<Register>` and see:
- **hooks**: `useState` × 3, `useNavigate`, `useForm` (from RHF)
- **state**: `{ apiError: null, isLoading: false, selectedDivision: "" }`

---

## ⚡ REACT PROFILER

### What to record:
1. Open React DevTools → **Profiler tab**
2. Click **Record** (circle button)
3. Fill in the registration form and click submit
4. Click **Stop**

### What you'd see:
- `<Register>` component re-renders **once** on submit (when `isLoading` changes to `true`)
- `<AuthProvider>` re-render on `user` update is NOT triggered during registration (since we navigate away immediately)
- React Hook Form fields have **zero re-renders** on typing — because it uses uncontrolled refs

---

## 🏗️ BACKEND — FastAPI MVC Flow

### Complete Request Flow: React → Database → React

```
React (POST /register JSON body)
        ↓
FastAPI CORS Middleware (allows localhost:5173)
        ↓
Router: app.include_router(auth.router) in main.py
        ↓
Controller: register() in auth.py
        ↓
Pydantic DonorCreate validates body:
  - email format, password strength, age, weight, passwords match
  ↓ if invalid → 422 Unprocessable Entity returned immediately
  ↓ if valid → continue
        ↓
CRUD Repository: crud_donor.get_by_email(db, email)
  → SELECT * FROM donors WHERE email = ?
  → if exists → raise 400 Bad Request "email already exists"
        ↓
CRUD Repository: crud_donor.create(db, obj_in=donor_in)
  → get_password_hash(password) via bcrypt
  → Donor(**fields) ORM object created
  → db.add(db_obj)
  → await db.commit()
  → await db.refresh(db_obj)
        ↓
FastAPI serializes Donor ORM → DonorResponse Pydantic model
        ↓
HTTP 201 Created JSON response sent to React
        ↓
React: navigate('/login')
```

---

### Which Router receives the request?
**[auth.py](file:///c:/Users/RAGIB-MOHONA/Desktop/Blood%20Donation%20Management%20System/backend/app/api/endpoints/auth.py)** — registered in `main.py`:
```python
app.include_router(auth.router, tags=["Authentication"])
```

### Which Controller function is executed?
```python
# auth.py L14-31
@router.post("/register", response_model=DonorResponse, status_code=201)
async def register(*, db: AsyncSession = Depends(deps.get_db), donor_in: DonorCreate):
```

### Which Service/Repository method is called?
```python
# CRUD Repository — crud/donor.py
await crud_donor.get_by_email(db, email=donor_in.email)  # Check duplicate
await crud_donor.create(db, obj_in=donor_in)             # Insert record
```

### Where is business logic implemented?
- **Email uniqueness check** → `auth.py` controller (line 24-29)
- **Password & age validation** → `schemas/donor.py` Pydantic validators
- **Password hashing** → `core/security.py` → `get_password_hash()`

### Where is database access implemented?
- **`crud/donor.py`** — all SQLAlchemy queries are here:
  ```python
  result = await db.execute(select(Donor).filter(Donor.email == email))
  db.add(db_obj)
  await db.commit()
  await db.refresh(db_obj)
  ```

### Why separate Router / Controller / CRUD / Schema layers?

| Layer | File | Responsibility |
|---|---|---|
| **Router** | `main.py` | URL mounting — maps `/register` to auth router |
| **Controller** | `auth.py` | Orchestrates: validate → check duplicate → create |
| **Schema** | `schemas/donor.py` | Input/output validation & serialization |
| **CRUD Repository** | `crud/donor.py` | All SQLAlchemy DB queries centralized |
| **Model** | `models/donor.py` | Table structure (columns, types) |
| **Core** | `core/security.py` | Shared utilities (hashing, JWT) |

**Separation of concerns** means: if you switch from SQLite to PostgreSQL — only `core/database.py` changes. If you add a new field — only `models/donor.py` and `schemas/donor.py` change. No spaghetti code.

---

## 🔌 API SPECIFICATION — POST /register

| Property | Value |
|---|---|
| **Endpoint** | `POST /register` |
| **HTTP Method** | `POST` — creates a new resource |
| **Authentication** | None (public endpoint) |
| **Content-Type** | `application/json` |

**Why POST?** POST is used because we are **creating** a new donor resource. It is not idempotent (sending twice creates/rejects duplicate), which matches `POST` semantics.

**Request Body:**
```json
{
  "full_name": "string (required)",
  "email": "valid_email@domain.com (required, unique)",
  "password": "Min8+Uppercase+Digit+Symbol (required)",
  "confirm_password": "must match password",
  "phone": "+8801712345678 (10-20 digits)",
  "dob": "YYYY-MM-DD (must be 18+ years ago)",
  "gender": "Male | Female | Other",
  "blood_group": "A+ | A- | B+ | B- | AB+ | AB- | O+ | O-",
  "division": "string",
  "district": "string",
  "area": "string",
  "address": "string",
  "weight": 70.0,  // >= 50.0 kg
  "availability": true,
  "terms_accepted": true,
  "last_donation_date": "YYYY-MM-DD (optional)",
  "medical_conditions": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "uuid": "a1b2c3d4-e5f6-...",
  "full_name": "John Doe",
  "email": "john@example.com",
  "blood_group": "O+",
  "availability": true,
  "created_at": "2026-07-22T16:55:47Z",
  "updated_at": "2026-07-22T16:55:47Z"
}
```

**HTTP Status Codes:**

| Code | Reason |
|---|---|
| `201 Created` | Donor registered successfully |
| `400 Bad Request` | Email already exists |
| `422 Unprocessable Entity` | Pydantic validation failed (age, weight, password, etc.) |
| `500 Internal Server Error` | Unexpected server crash |

---

## 🔧 cURL & POSTMAN

### cURL Command (as seen in Chrome DevTools → Copy as cURL):
```bash
curl -X POST 'http://localhost:8000/register' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirm_password": "SecurePass123!",
    "phone": "+8801712345678",
    "dob": "2000-01-15",
    "gender": "Male",
    "blood_group": "O+",
    "division": "Dhaka",
    "district": "Dhaka",
    "area": "Mirpur",
    "address": "House 10, Road 5",
    "weight": 70.0,
    "availability": true,
    "terms_accepted": true
  }'
```

**Explanation line by line:**
- `-X POST` → HTTP method is POST
- `'http://localhost:8000/register'` → endpoint URL
- `-H 'Content-Type: application/json'` → tells server we are sending JSON
- `-d '{...}'` → the request body (data payload)

### What happens if required data is missing?
```bash
# Missing email
curl -X POST 'http://localhost:8000/register' \
  -H 'Content-Type: application/json' \
  -d '{ "full_name": "John" }'

# Response: 422 Unprocessable Entity
{
  "detail": [
    { "loc": ["body", "email"], "msg": "Field required", "type": "missing" },
    ...
  ]
}
```

### What happens if invalid data is sent?
```bash
# Age under 18 (dob too recent)
"dob": "2015-01-01"
# → 422: "You must be at least 18 years old to register"

# Password too weak
"password": "abc"
# → 422: "Password must be at least 8 characters"

# Weight too low
"weight": 40.0
# → 422: "Input should be greater than or equal to 50"

# Duplicate email (second registration)
# → 400: "The user with this email already exists in the system."
```

---

## 🗄️ DATABASE

### Tables Involved:
Only **one table**: `donors`

### Database Schema:

```sql
CREATE TABLE donors (
    id              INTEGER  PRIMARY KEY AUTOINCREMENT,
    uuid            VARCHAR(36) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    dob             DATE NOT NULL,
    gender          VARCHAR(20) NOT NULL,
    blood_group     VARCHAR(10) NOT NULL,
    division        VARCHAR(100) NOT NULL,
    district        VARCHAR(100) NOT NULL,
    area            VARCHAR(100) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    weight          FLOAT NOT NULL,
    last_donation_date DATE,
    medical_conditions VARCHAR(500),
    profile_image   VARCHAR(255),
    availability    BOOLEAN DEFAULT TRUE,
    created_at      DATETIME,
    updated_at      DATETIME
);
```

### Which Model represents this table?
**[models/donor.py](file:///c:/Users/RAGIB-MOHONA/Desktop/Blood%20Donation%20Management%20System/backend/app/models/donor.py)** — `class Donor(Base, TimeStampedModel)`

### What CRUD operation is performed on registration?
**CREATE** — `INSERT INTO donors (...) VALUES (...)`

Executed via:
```python
db.add(db_obj)        # Stage object for insert
await db.commit()     # Commit transaction to DB
await db.refresh(db_obj)  # Reload from DB to get generated id, uuid, timestamps
```

### What happens if the requested record does not exist?
For `GET /donors/{id}`:
```python
donor = await crud_donor.get(db, id=id)
if not donor:
    raise HTTPException(status_code=404, detail="Donor not found.")
```
→ Returns `404 Not Found`

---

## 💡 CODE UNDERSTANDING

### `onSubmit()` — Line by Line (Register.jsx L34-71)

```js
const onSubmit = async (data) => {
  // 1. Set loading = true → spinner appears, button disabled
  setIsLoading(true);

  // 2. Clear any previous API error message
  setApiError(null);

  // 3. Build the exact payload the backend expects
  const payload = {
    ...data,
    weight: parseFloat(data.weight),  // Convert string "70" → number 70.0
    availability: true                // Always default to available on register
  };

  try {
    // 4. Call AuthContext.register() which calls api.post('/register', payload)
    await authRegister(payload);

    // 5. On success (no exception thrown), redirect to login
    //    state.registered = true can be used to show a success banner on login page
    navigate('/login', { state: { registered: true } });

  } catch (err) {
    // 6. API returned 4xx/5xx — extract the detail message from response
    //    Optional chaining (?.) prevents crash if err.response is undefined
    setApiError(
      err.response?.data?.detail || 'Registration failed. Please check the entered data.'
    );
  } finally {
    // 7. Always hide spinner regardless of success or failure
    setIsLoading(false);
  }
};
```

### `crud_donor.create()` — Line by Line (crud/donor.py L30-55)

```python
async def create(self, db: AsyncSession, *, obj_in: DonorCreate) -> Donor:
    db_obj = Donor(
        # 1. Map each validated Pydantic field to the SQLAlchemy column
        full_name=obj_in.full_name,
        email=obj_in.email,
        # 2. NEVER store plain password — hash it first using bcrypt
        password_hash=get_password_hash(obj_in.password),
        ...
    )
    # 3. Add the new object to the database session (not committed yet)
    db.add(db_obj)

    # 4. Commit the transaction — physically writes to DB
    await db.commit()

    # 5. Refresh — reloads the object from DB to populate server-generated
    #    fields like id (autoincrement), uuid (default lambda), created_at
    await db.refresh(db_obj)

    return db_obj  # Return fully populated Donor ORM object
```

### Why this implementation?
- **`obj_in.model_dump(exclude_unset=True)`** in `update()` → only patches fields the client actually sent, not all fields. Prevents accidentally nullifying fields.
- **`ilike`** in search → case-insensitive matching so "dhaka" matches "Dhaka"
- **`and_(*filters)`** → dynamically builds SQL WHERE clause from only provided filter parameters

---

## 🔍 WHAT IS MISSING FROM YOUR PROJECT?

After reviewing the complete codebase, here are things that are **not yet implemented** that would be expected in a truly production system:

| Missing Feature | Impact |
|---|---|
| **Toast notifications** (e.g. react-hot-toast) | No success/error flash messages after actions |
| **Password show/hide toggle** on register/login forms | UX improvement — currently always hidden |
| **Rate limiting** on `/login` and `/register` | Brute force protection not implemented |
| **Email verification** on registration | Donors can register with fake emails |
| **Forgot password / password reset flow** | No recovery if password is forgotten |
| **Profile image preview** before upload | User must upload blind — no preview |
| **Donor detail public page** (`/donors/:id`) | `GET /donors/{id}` API exists but no frontend page |
| **Input sanitization middleware** | XSS prevention on backend is partial |
| **Logging system** (e.g. Python `logging` module) | No structured server logs |
| **`pytest.ini` `__init__.py` files** in `backend/tests/` | Minor — tests work but not packaged |
| **`VITE_API_URL` `.env` file** in `frontend/` | Hardcoded fallback to `localhost:8000` works but isn't configurable |
| **`last_donation_date` validation** | No check that donation date isn't in the future |
| **Donor search on full-text name** | Can only search by blood, division, district, availability |
