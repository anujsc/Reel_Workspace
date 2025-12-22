# Authentication Flow Examples

## User Registration Flow

```typescript
// User visits /register
// Fills form: email, password, confirmPassword
// Clicks "Create Account"

// Behind the scenes:
1. Form validation runs (email format, password length, passwords match)
2. If valid, calls: await register(email, password)
3. AuthContext makes POST /api/auth/register
4. Backend returns: { token: "jwt...", user: { id, email, createdAt } }
5. Token saved to localStorage as "authToken"
6. User state updated in AuthContext
7. toast.success("Account created!")
8. navigate("/dashboard")
```

## User Login Flow

```typescript
// User visits /login
// Fills form: email, password
// Clicks "Sign In"

// Behind the scenes:
1. Form validation runs (email format, password length)
2. If valid, calls: await login(email, password)
3. AuthContext makes POST /api/auth/login
4. Backend returns: { token: "jwt...", user: { id, email, createdAt } }
5. Token saved to localStorage as "authToken"
6. User state updated in AuthContext
7. toast.success("Welcome back!")
8. navigate("/dashboard")
```

## Protected Route Access

```typescript
// User tries to access /dashboard

// PrivateRoute component checks:
1. Is authentication loading? → Show spinner
2. Is user authenticated? → Render Dashboard
3. Not authenticated? → <Navigate to="/login" />

// All API calls automatically include:
headers: {
  Authorization: `Bearer ${token}`
}
```

## Token Persistence

```typescript
// User refreshes page or closes/reopens browser

// On app mount, AuthContext:
1. Checks localStorage for "authToken"
2. If found, makes GET /api/auth/me
3. If valid, sets user state (user stays logged in)
4. If invalid (401), clears token and redirects to login
```

## Logout Flow

```typescript
// User clicks logout button in Dashboard

// Behind the scenes:
1. logout() called from AuthContext
2. localStorage.removeItem("authToken")
3. User state set to null
4. toast.success("Signed out successfully")
5. navigate("/login")
```

## Error Handling Examples

### Invalid Credentials (Login)

```typescript
// User enters wrong password
// Backend returns 401
// UI shows: "Invalid credentials. Please check your email and password."
// toast.error("Invalid credentials")
```

### User Already Exists (Register)

```typescript
// User tries to register with existing email
// Backend returns 400 or 409
// UI shows: "User already exists. Please login instead."
// toast.error("User already exists")
```

### Network Error

```typescript
// Backend is down or network issue
// UI shows: "Network error. Please check your connection and try again."
// toast.error("Network error. Please try again.")
```

## API Request Example

```typescript
// Any component can make authenticated API calls:
import api from "../services/api";

const fetchReels = async () => {
  // Token automatically attached by axios interceptor
  const response = await api.get("/api/reels");
  return response.data;
};

// If token is invalid (401), interceptor:
// 1. Clears localStorage
// 2. Redirects to /login
// User sees: "Session expired, please login again"
```

## Using Auth in Components

```typescript
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Route Configuration

```typescript
// Public routes (anyone can access)
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

// Protected routes (must be authenticated)
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />

// Smart redirect (based on auth state)
<Route path="/" element={<RootRedirect />} />
// Authenticated → /dashboard
// Not authenticated → /login
```
