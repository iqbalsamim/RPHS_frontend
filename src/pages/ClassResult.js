import { useEffect, useState } from "react";
import API from "../services/api";

function ClassResult() {
  const [exam, setExam] = useState("");
  const [classId, setClassId] = useState("");
  const [data, setData] = useState([]);

  const load = async () => {
    if (!exam || !classId) return;

    const res = await API.get(`/marks/class-result/${exam}/${classId}`);
    setData(res.data);
  };

  useEffect(() => {
    load();
  }, [exam, classId]);

  return (
    <div className="container mt-4">

      <h3>🏆 Class Result System</h3>

      <div className="row mb-3">

        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Exam ID"
            onChange={(e) => setExam(e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <input
            className="form-control"
            placeholder="Class ID"
            onChange={(e) => setClassId(e.target.value)}
          />
        </div>

      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            <th>Total</th>
            <th>GPA</th>
            <th>Grade</th>
          </tr>
        </thead>

        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td>🥇 {r.rank}</td>
              <td>{r.student}</td>
              <td>{r.total}</td>
              <td>{r.gpa}</td>
              <td>{r.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default ClassResult;