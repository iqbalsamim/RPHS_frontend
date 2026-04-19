import { useEffect, useState } from "react";
import API from "../services/api";

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");

  const loadSubjects = async () => {
    const res = await API.get("/subjects");
    setSubjects(res.data);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const addSubject = async (e) => {
    e.preventDefault();
    if (!name) return alert("Enter subject name");

    await API.post("/subjects", { name });
    setName("");
    loadSubjects();
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete subject?")) return;
    await API.delete(`/subjects/${id}`);
    loadSubjects();
  };

  return (
    <div>
      <h4 className="mb-3">📚 Subjects Management</h4>

      {/* ADD */}
      <form onSubmit={addSubject} className="card p-3 mb-3 shadow-sm">
        <input
          className="form-control mb-2"
          placeholder="Subject Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary">Add Subject</button>
      </form>

      {/* LIST */}
      <div className="card p-3 shadow-sm">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td>{s.name}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteSubject(s.id)}
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

export default Subjects;