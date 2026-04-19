import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";

function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    grandfather_name: "",
    email: "",
    class_id: "",
    roll_no: "",
    phone: "",
    address: "",
    permanent_address: "",
    guardian_name: "",
    date_of_birth: "",
    gender: ""
  });

  const [classes, setClasses] = useState([]);

  // Load student data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        setError("");
        console.log("Fetching student with ID:", id);
        
        // Fetch student details
        const studentRes = await API.get(`/students/${id}`);
        console.log("Student data received:", studentRes.data);
        
        const student = studentRes.data;
        
        setForm({
          first_name: student.first_name || "",
          last_name: student.last_name || "",
          father_name: student.father_name || "",
          grandfather_name: student.grandfather_name || "",
          email: student.email || "",
          class_id: student.class_id || "",
          roll_no: student.roll_no || "",
          phone: student.phone || "",
          address: student.address || "",
          permanent_address: student.permanent_address || "",
          guardian_name: student.guardian_name || "",
          date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : "",
          gender: student.gender || ""
        });
        
        // Fetch classes
        const classesRes = await API.get("/classes");
        setClasses(classesRes.data);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        
        // Show specific error message
        if (err.response) {
          // Server responded with error
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
        } else if (err.request) {
          // Request was made but no response
          setError("Network error: Cannot connect to server. Please check if backend is running.");
        } else {
          // Something else
          setError(`Error: ${err.message}`);
        }
        
        // Don't navigate immediately, let user see the error
      } finally {
        setFetching(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  // Submit update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await API.put(`/students/${id}`, form);
      alert("Student updated successfully");
      navigate("/students");
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.response?.data?.message || "Error updating student");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar />
        <div className="container mt-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading Student Data</h4>
            <p>{error}</p>
            <hr />
            <button 
              className="btn btn-primary" 
              onClick={() => navigate("/students")}
            >
              Back to Students List
            </button>
            <button 
              className="btn btn-secondary ms-2" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card shadow">
              <div className="card-header bg-warning text-white">
                <h4 className="mb-0">Edit Student</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpdate}>
                  {/* Personal Information Section */}
                  <div className="mb-3">
                    <h5 className="text-primary">Personal Information</h5>
                    <hr />
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter first name"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter last name"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Roll Number</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter roll number"
                        value={form.roll_no}
                        onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.date_of_birth}
                        onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-control"
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Class *</label>
                      <select
                        className="form-control"
                        value={form.class_id}
                        onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {c.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Family Information Section */}
                  <div className="mb-3 mt-3">
                    <h5 className="text-primary">Family Information</h5>
                    <hr />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Father's Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter father's full name"
                        value={form.father_name}
                        onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Grandfather's Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter grandfather's name"
                        value={form.grandfather_name}
                        onChange={(e) => setForm({ ...form, grandfather_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Guardian Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter guardian name"
                        value={form.guardian_name}
                        onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Guardian/Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+93 XX XXX XXXX"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="mb-3 mt-3">
                    <h5 className="text-primary">Contact Information</h5>
                    <hr />
                  </div>

                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="student@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Current Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Enter current address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Permanent Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Enter permanent address"
                      value={form.permanent_address}
                      onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                    ></textarea>
                    <small className="text-muted">Leave blank if same as current address</small>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => navigate("/students")}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-warning"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        "Update Student"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditStudent;