import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  
  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      console.log("Fetched students:", res.data); // Debug log
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await API.delete(`/students/${id}`);
        fetchStudents();
        alert("Student deleted successfully");
      } catch (err) {
        console.error("Error deleting student:", err);
        alert("Failed to delete student");
      }
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Helper function to format student name
  const formatStudentName = (student) => {
    const firstName = student.first_name || student.name || "";
    const lastName = student.last_name || "";
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || "N/A";
  };

  // Helper function to format null/empty values
  const formatValue = (value) => {
    return value && value !== null && value !== "" ? value : "—";
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        {user?.role === "admin" && (
          <a href="/add-student" className="btn btn-primary mb-2">
            + Add Student
          </a>
        )}
        
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search student by name, father name, phone, or email..."
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <h3>Students Management</h3>

        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th>Grandfather's Name</th>
                <th>Email</th>
                <th>Class</th>
                <th>Phone/Guardian Mobile</th>
                <th>Current Address</th>
                <th>Permanent Address</th>
                {user?.role === "admin" && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {students
                .filter(s => {
                  const fullName = formatStudentName(s).toLowerCase();
                  const fatherName = (s.father_name || "").toLowerCase();
                  const email = (s.email || "").toLowerCase();
                  const phone = (s.phone || "").toLowerCase();
                  const searchTerm = search.toLowerCase();
                  
                  return fullName.includes(searchTerm) || 
                         fatherName.includes(searchTerm) || 
                         email.includes(searchTerm) || 
                         phone.includes(searchTerm);
                })
                .map(s => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge bg-secondary">
                        {s.roll_no && s.roll_no !== null && s.roll_no !== "" ? s.roll_no : "—"}
                      </span>
                    </td>
                    <td>
                      <strong>{formatStudentName(s)}</strong>
                    </td>
                    <td>{formatValue(s.father_name)}</td>
                    <td>{formatValue(s.grandfather_name)}</td>
                    <td>{formatValue(s.email)}</td>
                    <td>
                      <span className="badge bg-info">
                        {formatValue(s.class_name)}
                      </span>
                    </td>
                    <td>{formatValue(s.phone)}</td>
                    <td>
                      <small>{formatValue(s.address)}</small>
                    </td>
                    <td>
                      <small>{formatValue(s.permanent_address)}</small>
                    </td>
                    
                    {user?.role === "admin" && (
                      <td>
                        <a href={`/edit-student/${s.id}`} className="btn btn-warning btn-sm me-2">
                          <i className="bi bi-pencil"></i> Edit
                        </a>
                    
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteStudent(s.id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="alert alert-info text-center">
            No students found. Click "Add Student" to add your first student.
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;