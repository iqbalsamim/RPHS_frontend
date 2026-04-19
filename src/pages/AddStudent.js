import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function AddStudent() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    father_name: "",
    grandfather_name: "",
    email: "",
    password: "",
    class_id: "",
    roll_no: "",
    phone: "",
    address: "",
    permanent_address: "",
    guardian_name: "",
    date_of_birth: "",
    gender: ""
  });

  // Fetch classes
  useEffect(() => {
    API.get("/classes").then(res => setClasses(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/students", form);
      alert("Student added successfully");
      window.location.href = "/students";
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Add New Student</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
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
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Roll Number</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter roll number"
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
                        onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-control"
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
                        onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Guardian/Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+93 XX XXX XXXX"
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
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="student@example.com"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password"
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Permanent Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Enter permanent address"
                      onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                    ></textarea>
                    <small className="text-muted">Leave blank if same as current address</small>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => window.location.href = "/students"}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding...
                        </>
                      ) : (
                        "Add Student"
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

export default AddStudent;