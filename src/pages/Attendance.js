import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Attendance() {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState("");
  const [records, setRecords] = useState([]);

  // Load students
  useEffect(() => {
    API.get("/students").then(res => {
      setStudents(res.data);

      // default all present
      const initial = res.data.map(s => ({
        student_id: s.id,
        status: "Present"
      }));
      setRecords(initial);
    });
  }, []);

  // Change status
  const handleChange = (id, status) => {
    const updated = records.map(r =>
      r.student_id === id ? { ...r, status } : r
    );
    setRecords(updated);
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (!date) return alert("Select date");

    try {
      await API.post("/attendance", { records, date });
      alert("Attendance saved");
    } catch (err) {
      alert("Error saving attendance");
    }
  };

  // ✅ LOAD ATTENDANCE (NEW)
  const loadAttendance = async () => {
    if (!date) return alert("Select date first");

    try {
      const res = await API.get(`/attendance/${date}`);

      console.log(res.data); // check in browser console

      // Optional: update UI (basic version)
      const updated = records.map(r => {
        const found = res.data.find(a => a.student_id === r.student_id);
        return found ? { ...r, status: found.status } : r;
      });

      setRecords(updated);

    } catch (err) {
      alert("Error loading attendance");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">

        <h3>Attendance</h3>

        <input
          type="date"
          className="form-control mb-2"
          onChange={(e) => setDate(e.target.value)}
        />

        {/* ✅ Load Attendance Button */}
        <button className="btn btn-info mb-3 me-2" onClick={loadAttendance}>
          Load Attendance
        </button>

        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Present</th>
              <th>Absent</th>
            </tr>
          </thead>

          <tbody>
            {students.map(s => {
              const record = records.find(r => r.student_id === s.id);

              return (
                <tr key={s.id}>
                  <td>{s.name}</td>

                  <td>
                    <input
                      type="radio"
                      name={`status-${s.id}`}
                      checked={record?.status === "Present"}
                      onChange={() => handleChange(s.id, "Present")}
                    />
                  </td>

                  <td>
                    <input
                      type="radio"
                      name={`status-${s.id}`}
                      checked={record?.status === "Absent"}
                      onChange={() => handleChange(s.id, "Absent")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button className="btn btn-success" onClick={handleSubmit}>
          Save Attendance
        </button>

      </div>
    </div>
  );
}

export default Attendance;