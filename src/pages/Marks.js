import { useEffect, useState } from "react";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.jpg";

function Marks() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [rows, setRows] = useState([]);
  const [marksList, setMarksList] = useState([]);
  const [filterExam, setFilterExam] = useState("");
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  
  // Search states for each row
  const [rowSearchTerms, setRowSearchTerms] = useState({});
  
  // Helper function to get student full name
  const getStudentFullName = (student) => {
    if (!student) return "Unknown";
    
    const firstName = student.first_name || student.name || "";
    const lastName = student.last_name || "";
    const rollNo = student.roll_no;
    
    let name = "";
    if (firstName && lastName) {
      name = `${firstName} ${lastName}`;
    } else if (firstName) {
      name = firstName;
    } else if (lastName) {
      name = lastName;
    } else if (student.name) {
      name = student.name;
    } else {
      name = `Student ${student.id || ""}`;
    }
    
    if (rollNo) {
      name = `${name} (Roll: ${rollNo})`;
    }
    
    return name;
  };

  // Filter students based on search term
  const filterStudents = (searchTerm) => {
    if (!searchTerm) return students;
    return students.filter(student => 
      getStudentFullName(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.roll_no && student.roll_no.toString().includes(searchTerm)) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      const [s, sub, e, m, c] = await Promise.all([
        API.get("/students"),
        API.get("/subjects"),
        API.get("/exams"),
        API.get("/marks"),
        API.get("/classes")
      ]);
  
      setStudents(s.data);
      setSubjects(sub.data);
      setExams(e.data);
      setMarksList(m.data);
      setClasses(c.data);
  
    } catch (err) {
      console.log("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= ROW =================
  const addRow = () => {
    const newIndex = rows.length;
    setRows([
      ...rows,
      { student_id: "", subject_id: "", exam_id: "", marks: "" }
    ]);
    setRowSearchTerms({
      ...rowSearchTerms,
      [newIndex]: ""
    });
  };

  const updateRow = (i, key, value) => {
    const updated = [...rows];
    updated[i][key] = value;
    setRows(updated);
    
    // Clear search term after selection
    if (key === "student_id") {
      setRowSearchTerms({
        ...rowSearchTerms,
        [i]: ""
      });
    }
  };

  const updateRowSearch = (i, searchTerm) => {
    setRowSearchTerms({
      ...rowSearchTerms,
      [i]: searchTerm
    });
  };

  // ================= SAVE =================
  const submitMarks = async () => {
    try {
      for (const r of rows) {
        await API.post("/marks", r);
      }

      alert("Marks saved successfully");
      setRows([]);
      setRowSearchTerms({});
      loadData();
    } catch (err) {
      alert("Error saving marks");
    }
  };

  // ================= FILTER =================
  const filteredMarks = marksList.filter((m) => {
    const examMatch = !filterExam || m.exam_id == filterExam;
    const classMatch = !filterClass || m.class_id == filterClass;
    const searchMatch = !searchStudent || 
      m.student?.toLowerCase().includes(searchStudent.toLowerCase());
    
    return examMatch && classMatch && searchMatch;
  });

  // ================= MARKSHEET PDF =================
  const generatePDF = (studentId, examId) => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = logo;
    const student = students.find(s => s.id == studentId);
    const exam = exams.find(e => e.id == examId);

    const studentMarks = marksList.filter(
      r => r.student_id == studentId && r.exam_id == examId
    );

    doc.setFontSize(18);
    doc.text("🏫 SCHOOL ERP MARKSHEET", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Student: ${getStudentFullName(student)}`, 14, 40);
    doc.text(`Exam: ${exam?.name || ""}`, 14, 48);

    const table = studentMarks.map(r => [
      r.subject,
      r.marks,
      r.marks >= 50 ? "Pass" : "Fail"
    ]);

    doc.autoTable({
      startY: 60,
      head: [["Subject", "Marks", "Status"]],
      body: table
    });

    doc.save(`marksheet_${getStudentFullName(student)}.pdf`);
  };

  // ================= 🎓 SINGLE STUDENT RESULT PDF =================
  const generateStudentResultPDF = async (studentId, examId) => {
    try {
      const img = new Image();
      img.src = logo;
      const [marksRes, resultRes] = await Promise.all([
        API.get(`/marks/marksheet/${studentId}/${examId}`),
        API.get(`/marks/result/${studentId}/${examId}`)
      ]);
  
      const marksData = marksRes.data;
      const result = resultRes.data;
  
      if (!marksData || marksData.length === 0) {
        alert("No marks found");
        return;
      }
  
      const studentName = marksData[0].student;
  
      const doc = new jsPDF();
  
      // ================= HEADER =================
      doc.setFillColor(25, 42, 86);
      doc.rect(0, 0, 210, 28, "F");
      doc.addImage(logo, "jpg", 10, 5, 18, 18);
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text("Reshad Private High School", 105, 16, { align: "center" });
  
      doc.setFontSize(12);
      doc.text("OFFICIAL STUDENT MARKSHEET", 105, 24, { align: "center" });
  
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(`Student Name: ${studentName}`, 14, 40);
      doc.text(`Exam ID: ${examId}`, 14, 48);
  
      const table = marksData.map(m => [
        m.subject,
        m.marks,
        m.marks >= 50 ? "PASS" : "FAIL"
      ]);
  
      autoTable(doc, {
        startY: 60,
        head: [["Subject", "Marks", "Status"]],
        body: table,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [25, 42, 86],
          textColor: 255
        }
      });
  
      const finalY = doc.lastAutoTable.finalY + 10;
  
      doc.setFillColor(245, 245, 245);
      doc.rect(14, finalY, 180, 32, "F");
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.text(`Total: ${result.total || 0}`, 14, finalY);
      doc.text(`Average: ${Number(result.avg || 0).toFixed(2)}`, 14, finalY + 7);
      doc.text(`Grade: ${result.grade || "-"}`, 14, finalY + 14);
      doc.text(`Status: ${result.status || "-"}`, 14, finalY + 21);
  
      doc.text("____________________", 20, finalY + 45);
      doc.text("Class Teacher", 20, finalY + 52);
      doc.text("____________________", 120, finalY + 45);
      doc.text("Principal", 120, finalY + 52);
  
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        "This is a system generated marksheet and is valid without signature.",
        105,
        285,
        { align: "center" }
      );
  
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.addImage(img, "PNG", 40, 90, 130, 130);
      doc.setGState(new doc.GState({ opacity: 1 }));
  
      doc.save(`Marksheet_${studentName}.pdf`);
  
    } catch (err) {
      console.log("PDF ERROR FULL:", err.response?.data || err.message);
      alert("Failed to generate marksheet");
    }
  };
  
  // ================= CLASS RESULT PDF =================
  const generateClassPDF = async () => {
    if (!filterExam || !filterClass) {
      alert("Select class and exam");
      return;
    }
  
    try {
      const res = await API.get(`/marks/class-result/${filterExam}/${filterClass}`);
  
      const doc = new jsPDF();
      const img = new Image();
      img.src = logo;
  
      const selectedClass = classes.find(c => c.id == filterClass);
      const className = selectedClass ? selectedClass.name : "";
      const selectedExam = exams.find(e => e.id == filterExam);
      const examName = selectedExam ? selectedExam.name : "";
  
      doc.setFillColor(20, 41, 87);
      doc.rect(0, 0, 210, 25, "F");
      doc.addImage(logo, "jpg", 10, 5, 18, 18);
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text("SCHOOL MANAGEMENT SYSTEM", 105, 15, { align: "center" });
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text(`CLASS RESULT SHEET - ${className} (${examName})`, 105, 35, { align: "center" });
  
      const table = res.data.map(r => [
        r.rank,
        r.student,
        r.total,
        r.gpa,
        r.grade
      ]);
  
      autoTable(doc, {
        startY: 45,
        head: [["Rank", "Student", "Total", "GPA", "Grade"]],
        body: table,
        theme: "grid",
        headStyles: {
          fillColor: [20, 41, 87],
          textColor: 255
        }
      });
  
      const finalY = doc.lastAutoTable.finalY + 10;
  
      doc.setFillColor(245, 245, 245);
      doc.rect(14, finalY, 180, 25, "F");
      doc.text(`Total Students: ${res.data.length}`, 20, finalY + 12);
  
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        "Generated by ERP System - Confidential Academic Report",
        105,
        285,
        { align: "center" }
      );
  
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.addImage(img, "PNG", 40, 90, 130, 130);
      doc.setGState(new doc.GState({ opacity: 1 }));
  
      doc.save(`Class_Result_${className}_${examName}.pdf`);
  
    } catch (err) {
      console.log(err);
      alert("Class PDF failed");
    }
  };

  return (
    <div className="container mt-4">

      <h3 className="mb-3 fw-bold">📊 Marks Management</h3>

      {/* FILTERS */}
      <div className="row mb-3">
        <div className="col-md-3">
          <select
            className="form-control"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
          >
            <option value="">Select Exam</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <button className="btn btn-primary w-100" onClick={addRow}>
            + Add Row
          </button>
        </div>

        <div className="col-md-3">
          <button className="btn btn-dark w-100" onClick={generateClassPDF}>
            📄 Class Result PDF
          </button>
        </div>
      </div>

      {/* ENTRY TABLE WITH SEARCHABLE DROPDOWNS */}
      <style>
        {`
          .searchable-dropdown {
            position: relative;
          }
          .dropdown-search {
            width: 100%;
            padding: 5px;
            margin-bottom: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
          }
          .dropdown-options {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: white;
          }
          .dropdown-option {
            padding: 5px 10px;
            cursor: pointer;
          }
          .dropdown-option:hover {
            background-color: #f0f0f0;
          }
        `}
      </style>

      <table className="table table-bordered shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Exam</th>
            <th>Marks</th>
            <th>PDF</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => {
            const filteredStudents = filterStudents(rowSearchTerms[i] || "");
            
            return (
              <tr key={i}>
                 {/* Searchable Student Dropdown */}
                 <td style={{ minWidth: "200px" }}>
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="🔍 Search student..."
                      value={rowSearchTerms[i] || ""}
                      onChange={(e) => updateRowSearch(i, e.target.value)}
                      style={{ marginBottom: "5px" }}
                    />
                    <select
                      className="form-control form-control-sm"
                      value={r.student_id}
                      onChange={(e) => updateRow(i, "student_id", e.target.value)}
                      size={filteredStudents.length > 0 && rowSearchTerms[i] ? Math.min(5, filteredStudents.length) : 1}
                      style={{ height: filteredStudents.length > 0 && rowSearchTerms[i] ? "auto" : "38px" }}
                    >
                      <option value="">Select Student</option>
                      {filteredStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {getStudentFullName(s)}
                        </option>
                      ))}
                    </select>
                    {rowSearchTerms[i] && filteredStudents.length === 0 && (
                      <small className="text-danger">No students found</small>
                    )}
                  </div>
                 </td>

                 {/* Subject Dropdown */}
                 <td>
                  <select 
                    className="form-control" 
                    value={r.subject_id}
                    onChange={(e) => updateRow(i, "subject_id", e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                 </td>

                 {/* Exam Dropdown */}
                 <td>
                  <select 
                    className="form-control" 
                    value={r.exam_id}
                    onChange={(e) => updateRow(i, "exam_id", e.target.value)}
                  >
                    <option value="">Select Exam</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                 </td>

                 {/* Marks Input */}
                 <td>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="Enter marks"
                    value={r.marks}
                    onChange={(e) => updateRow(i, "marks", e.target.value)}
                  />
                 </td>

                 {/* PDF Button */}
                 <td>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => generatePDF(r.student_id, r.exam_id)}
                    disabled={!r.student_id || !r.exam_id}
                  >
                    PDF
                  </button>
                 </td>
               </tr>
            );
          })}
        </tbody>
      </table>

      <button className="btn btn-success mb-4" onClick={submitMarks}>
        Save Marks
      </button>

      {/* SAVED LIST */}
      <h4 className="fw-bold">📚 Saved Marks</h4>
      
      {/* SEARCH BAR FOR SAVED MARKS */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by student name..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
          />
        </div>
        <div className="col-md-8">
          <small className="text-muted">
            {filteredMarks.length} record(s) found
          </small>
        </div>
      </div>

      <table className="table table-hover shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Exam</th>
            <th>Marks</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredMarks.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">No marks found</td>
            </tr>
          ) : (
            filteredMarks.map((m) => (
              <tr key={m.id}>
                <td>{m.student}</td>
                <td>{m.subject}</td>
                <td>{m.exam}</td>
                <td>
                  <span className={`badge ${m.marks >= 50 ? "bg-success" : "bg-danger"}`}>
                    {m.marks}
                  </span>
                 </td>
                 <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => generateStudentResultPDF(m.student_id, m.exam_id)}
                  >
                    Result PDF
                  </button>
                 </td>
               </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Marks;