import { useEffect, useState } from "react";
import API from "../services/api";

function Exams() {
  const [exams, setExams] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const loadExams = async () => {
    const res = await API.get("/exams");
    setExams(res.data);
  };

  useEffect(() => {
    loadExams();
  }, []);

  const addExam = async (e) => {
    e.preventDefault();
    if (!name || !date) return alert("Fill all fields");

    await API.post("/exams", { name, date });
    setName("");
    setDate("");
    loadExams();
  };

  const deleteExam = async (id) => {
    if (!window.confirm("Delete exam?")) return;
    await API.delete(`/exams/${id}`);
    loadExams();
  };

  return (
    <div>
      <h4 className="mb-3">📝 Exams</h4>

      {/* ADD */}
      <form onSubmit={addExam} className="card p-3 mb-3 shadow-sm">
        <input
          className="form-control mb-2"
          placeholder="Exam Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="date"
          className="form-control mb-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="btn btn-primary">Add Exam</button>
      </form>

      {/* LIST */}
      <div className="card p-3 shadow-sm">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Exam</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.name}</td>
                <td>{e.date}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteExam(e.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Exams;