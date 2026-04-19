import { useState } from "react";
import API from "../services/api";
import logo from "../assets/logo.jpg";
import schoolBackground from "../assets/school-background.jpg"; // Add your school background image

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get current year
  const currentYear = new Date().getFullYear();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;

      if (role === "admin") {
        window.location.href = "/dashboard";
      } else if (role === "teacher") {
        window.location.href = "/attendance";
      } else {
        window.location.href = "/dashboard"; // student
      }

    } catch (err) {
      console.log(err.response?.data);
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ 
           backgroundImage: `url(${schoolBackground})`,
           backgroundSize: "cover",
           backgroundPosition: "center",
           backgroundRepeat: "no-repeat",
           position: "relative"
         }}>
      
      {/* Overlay with low opacity */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 25, 1) 100%)",
        zIndex: 1
      }}></div>
      
      <style>
        {`
          .bg-gradient-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .login-card {
            animation: fadeInUp 0.6s ease-out;
            position: relative;
            z-index: 2;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .input-group-custom {
            transition: all 0.3s ease;
          }
          .input-group-custom:focus {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .btn-login {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            transition: all 0.3s ease;
          }
          .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          }
          .btn-login:disabled {
            opacity: 0.7;
            transform: none;
          }
        `}
      </style>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden login-card">
              {/* Header with Logo */}
              <div className="text-center pt-5 pb-3 bg-white">
                <div className="d-flex justify-content-center mb-3">
                  <div className="rounded-circle bg-gradient-primary p-3 shadow-sm" 
                       style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                      src={logo} 
                      alt="School Logo" 
                      style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  </div>
                </div>
                <h2 className="fw-bold" style={{ color: "#333" }}>Welcome Back</h2>
                <p className="text-muted">Sign in to access your dashboard</p>
              </div>

              {/* Form Body */}
              <div className="card-body p-5 pt-0">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="bi bi-envelope-fill me-2"></i>Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg rounded-3 input-group-custom"
                      placeholder="teacher@school.com"
                      style={{ border: "2px solid #e1e5e9" }}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-secondary">
                      <i className="bi bi-lock-fill me-2"></i>Password
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg rounded-3 input-group-custom"
                      placeholder="••••••••"
                      style={{ border: "2px solid #e1e5e9" }}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-login btn-lg text-white fw-bold py-3 rounded-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Logging in...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Login to Dashboard
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <small className="text-muted">
                      <i className="bi bi-shield-check me-1"></i>
                      Secure login • All rights reserved
                    </small>
                  </div>
                </form>
              </div>

              {/* Footer with dynamic year */}
              <div className="card-footer bg-light text-center py-3 border-0">
                <small className="text-muted">
                  © {currentYear} Reshad Private High School. IqbalTechnology.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;