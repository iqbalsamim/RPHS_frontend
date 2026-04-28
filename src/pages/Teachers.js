import { useEffect, useState } from "react";
import API from "../services/api";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [assignmentData, setAssignmentData] = useState({
    teacher_id: "",
    subject_id: ""
  });
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Load all teachers (simple list)
  const loadTeachers = async () => {
    try {
      const res = await API.get("/teachers");
      console.log("Teachers loaded:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error loading teachers:", err);
      return [];
    }
  };

  // Load all subjects
  const loadSubjects = async () => {
    try {
      const res = await API.get("/subjects");
      console.log("Subjects loaded:", res.data);
      setSubjects(res.data);
      return res.data;
    } catch (err) {
      console.error("Error loading subjects:", err);
      return [];
    }
  };

  // Load assignments from the assignments endpoint
  const loadAssignments = async () => {
    try {
      const res = await API.get("/teachers/assignments");
      console.log("Assignments loaded:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error loading assignments:", err);
      return [];
    }
  };

  // Load all data and combine
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [teachersData, subjectsData, assignmentsData] = await Promise.all([
        loadTeachers(),
        loadSubjects(),
        loadAssignments()
      ]);
      
      // Combine teachers with their subjects
      const teachersWithSubjects = teachersData.map(teacher => {
        // Find all subjects for this teacher
        const teacherSubjects = assignmentsData
          .filter(assignment => assignment.teacher_id === teacher.id)
          .map(assignment => assignment.subject_name)
          .join(', ');
        
        return {
          id: teacher.id,
          teacher: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          subject: teacherSubjects || ""
        };
      });
      
      console.log("Teachers with subjects:", teachersWithSubjects);
      setTeachers(teachersWithSubjects);
      
    } catch (err) {
      console.error("Error loading all data:", err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // CREATE TEACHER
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTeacher) {
        await API.put(`/teachers/${editingTeacher.id}`, form);
        alert("Teacher updated successfully!");
      } else {
        await API.post("/teachers", form);
        alert("Teacher added successfully!");
      }
      
      setForm({ name: "", email: "", phone: "" });
      setEditingTeacher(null);
      setShowForm(false);
      
      // Reload all data
      await loadAllData();
      
    } catch (err) {
      console.error("Error saving teacher:", err);
      alert(err.response?.data?.error || "Failed to save teacher");
    }
  };

  // EDIT TEACHER
  const handleEdit = (teacher) => {
    setEditingTeacher({
      id: teacher.id,
      name: teacher.teacher,
      email: teacher.email,
      phone: teacher.phone
    });
    setForm({
      name: teacher.teacher,
      email: teacher.email || "",
      phone: teacher.phone || ""
    });
    setShowForm(true);
  };

  // DELETE TEACHER
  const handleDelete = async (id, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete "${teacherName}"?`)) return;
    try {
      await API.delete(`/teachers/${id}`);
      alert("Teacher deleted successfully!");
      await loadAllData();
    } catch (err) {
      console.error("Error deleting teacher:", err);
      alert(err.response?.data?.error || "Failed to delete teacher");
    }
  };

  // ASSIGN SUBJECT TO TEACHER
  const handleAssignSubject = async (e) => {
    e.preventDefault();
    
    if (!assignmentData.teacher_id || !assignmentData.subject_id) {
      alert("Please select both teacher and subject");
      return;
    }
    
    try {
      await API.post("/teachers/assign", assignmentData);
      alert("Subject assigned successfully!");
      setAssignmentData({ teacher_id: "", subject_id: "" });
      setShowAssignModal(false);
      
      // Reload all data to show new assignment
      await loadAllData();
      
    } catch (err) {
      console.error("Error assigning subject:", err);
      alert(err.response?.data?.error || "Failed to assign subject");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading teachers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>👨‍🏫 Teachers Management</h4>
        <div>
          <button 
            className="btn btn-success me-2" 
            onClick={() => setShowAssignModal(true)}
            disabled={teachers.length === 0 || subjects.length === 0}
          >
            Assign Subject to Teacher
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingTeacher(null);
              setForm({ name: "", email: "", phone: "" });
              setShowForm(!showForm);
            }}
          >
            {showForm ? "Cancel" : "+ Add New Teacher"}
          </button>
        </div>
      </div>

      {/* Add/Edit Teacher Form */}
      {showForm && (
        <div className="card p-3 mb-4 shadow-sm">
          <h5 className="mb-3">{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-2">
                <label className="form-label">Name *</label>
                <input
                  placeholder="Full Name"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label">Email *</label>
                <input
                  placeholder="Email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label">Phone</label>
                <input
                  placeholder="Phone"
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-md-12 mt-2">
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? "Update Teacher" : "Add Teacher"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTeacher(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssignModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ 
            backgroundColor: "rgba(0,0,0,0.5)", 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 1050 
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Subject to Teacher</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAssignSubject}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Teacher</label>
                    <select
                      className="form-select"
                      value={assignmentData.teacher_id}
                      onChange={(e) => setAssignmentData({ ...assignmentData, teacher_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Teacher --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.teacher}
                        </option>
                      ))}
                    </select>
                    {teachers.length === 0 && (
                      <div className="alert alert-warning mt-2">
                        No teachers available. Please add teachers first.
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Select Subject</label>
                    <select
                      className="form-select"
                      value={assignmentData.subject_id}
                      onChange={(e) => setAssignmentData({ ...assignmentData, subject_id: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {subjects.length === 0 && (
                      <div className="alert alert-warning mt-2">
                        No subjects available. Please add subjects first.
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Assign Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teachers Table */}
      <div className="card p-3 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Subjects Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No teachers found. Click "Add New Teacher" to create one.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, idx) => (
                  <tr key={teacher.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{teacher.teacher}</strong></td>
                    <td>{teacher.email || "-"}</td>
                    <td>{teacher.phone || "-"}</td>
                    <td style={{ maxWidth: "300px" }}>
                      {teacher.subject && teacher.subject !== "" ? (
                        <div className="d-flex flex-wrap gap-1">
                          {teacher.subject.split(', ').map((sub, i) => (
                            <span key={i} className="badge bg-info text-dark me-1 mb-1">
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="badge bg-secondary">No subjects assigned</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-1"
                        onClick={() => handleEdit(teacher)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(teacher.id, teacher.teacher)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Teachers;