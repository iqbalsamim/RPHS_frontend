import { useEffect, useState } from "react";
import API from "../services/api";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject_id: ""
  });

  const loadData = async () => {
    const t = await API.get("/teachers");
    const s = await API.get("/subjects");
    setTeachers(t.data);
    setSubjects(s.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/teachers", form);
    setForm({ name: "", email: "", phone: "", subject_id: "" });
    loadData();
  };

  return (
    <div className="container mt-4">
      <h3>Teachers</h3>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="card p-3 mb-3">
        <input placeholder="Name" className="form-control mb-2"
          value={form.name}
          onChange={(e)=>setForm({...form,name:e.target.value})} />

        <input placeholder="Email" className="form-control mb-2"
          value={form.email}
          onChange={(e)=>setForm({...form,email:e.target.value})} />

        <input placeholder="Phone" className="form-control mb-2"
          value={form.phone}
          onChange={(e)=>setForm({...form,phone:e.target.value})} />

        <select className="form-control mb-2"
          value={form.subject_id}
          onChange={(e)=>setForm({...form,subject_id:e.target.value})}>
          <option>Select Subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button className="btn btn-primary">Add Teacher</button>
      </form>

      {/* TABLE */}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Subject</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.email}</td>
              <td>{t.phone}</td>
              <td>{t.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Teachers;