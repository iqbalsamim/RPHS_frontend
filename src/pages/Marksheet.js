import jsPDF from "jspdf";
import API from "../services/api";
import { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";

function Marksheet() {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState({ student_id: "", exam_id: "" });

  useEffect(() => {
    API.get("/students").then(res => setStudents(res.data));
    API.get("/exams").then(res => setExams(res.data));
  }, []);

  const generate = async () => {
    const res = await API.get(
      `/marks/marksheet/${selected.student_id}/${selected.exam_id}`
    );

    const data = res.data;

    const doc = new jsPDF();

    // HEADER
    doc.setFontSize(18);
    doc.text("SCHOOL MARKSHEET", 70, 20);

    doc.setFontSize(10);
    doc.text("Official Academic Record", 75, 28);

    // LOGO
    doc.addImage(logo, "PNG", 10, 10, 25, 25);

    let y = 50;
    let total = 0;

    doc.text("Subject", 20, y);
    doc.text("Marks", 150, y);

    y += 10;

    data.forEach((m) => {
      doc.text(m.subject, 20, y);
      doc.text(String(m.marks), 150, y);
      total += m.marks;
      y += 10;
    });

    const percentage = (total / (data.length * 100)) * 100;

    doc.text(`Total: ${total}`, 20, y + 10);
    doc.text(`Percentage: ${percentage.toFixed(2)}%`, 20, y + 20);

    doc.save("marksheet.pdf");
  };

  return (
    <div className="container mt-4">
      <h3>Marksheet Generator</h3>

      <select
        onChange={(e) => setSelected({ ...selected, student_id: e.target.value })}
      >
        <option>Select Student</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <select
        onChange={(e) => setSelected({ ...selected, exam_id: e.target.value })}
      >
        <option>Select Exam</option>
        {exams.map(e => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <button className="btn btn-primary mt-3" onClick={generate}>
        Generate Marksheet PDF
      </button>
    </div>
  );
}

export default Marksheet;