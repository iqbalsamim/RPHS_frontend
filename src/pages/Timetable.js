import { useState, useEffect } from "react";
import API from "../services/api";

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00"
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        API.get("/timetable"),
        API.get("/classes"),
        API.get("/subjects"),
        API.get("/teachers")
      ]);
      setTimetable(timetableRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
      setError("");
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/timetable", formData);
      setShowForm(false);
      setFormData({
        class_id: "",
        subject_id: "",
        teacher_id: "",
        day: "Monday",
        start_time: "09:00",
        end_time: "10:00"
      });
      fetchData();
      alert("Timetable entry added successfully!");
    } catch (err) {
      alert("Failed to add timetable entry");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      await API.delete(`/timetable/${id}`);
      fetchData();
      alert("Entry deleted successfully!");
    } catch (err) {
      alert("Failed to delete entry");
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>📅 Timetable Management</h4>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add New Entry"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-3 mb-4 shadow-sm">
          <h5 className="mb-3">Add Timetable Entry</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-3 mb-2">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-2">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-2">
                <label className="form-label">Teacher</label>
                <select
                  className="form-select"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-2">
                <label className="form-label">Day</label>
                <select
                  className="form-select"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  required
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-2">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-3 mb-2">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6 mb-2 d-flex align-items-end">
                <button type="submit" className="btn btn-success w-100">Save Entry</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Timetable Display */}
      <div className="card p-3 shadow-sm">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-danger text-center">{error}</p>
        ) : timetable.length === 0 ? (
          <p className="text-muted text-center">No timetable entries found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover text-center">
              <thead className="table-dark">
                <tr>
                  <th>Day</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((row) => (
                  <tr key={row.id}>
                    <td>{row.day}</td>
                    <td>{row.class_name || row.class_id}</td>
                    <td>{row.subject_name || row.subject_id}</td>
                    <td>{row.teacher_name || row.teacher_id}</td>
                    <td>{row.start_time?.substring(0, 5)}</td>
                    <td>{row.end_time?.substring(0, 5)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Timetable;