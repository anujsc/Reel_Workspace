// Example usage of AuthContext and PrivateRoute
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

// Example: Login Component
export const LoginExample = () => {
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login("user@example.com", "password123");
      // User is now logged in, token stored in localStorage
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <form onSubmit={handleLogin}>{/* Your login form fields */}</form>;
};

// Example: Protected Dashboard Component
export const DashboardExample = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

// Example: Route Setup with PrivateRoute
export const RouteExample = () => {
  return (
    <>
      {/* Public route */}
      {/* <Route path="/login" element={<LoginExample />} /> */}

      {/* Protected route */}
      {/* <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardExample />
        </PrivateRoute>
      } /> */}
    </>
  );
};

// Example: Using React Query with API
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const ReelsListExample = () => {
  const {
    data: reels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const response = await api.get("/api/reels");
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading reels</div>;

  return (
    <div>
      {reels?.map((reel: any) => (
        <div key={reel.id}>{reel.title}</div>
      ))}
    </div>
  );
};
