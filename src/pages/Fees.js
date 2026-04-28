import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "../assets/logo.jpg";

// Shamsi months in Persian/Afghan calendar
const shamsiMonths = [
  { num: 1, name: "حمل", name_en: "Hamal" },
  { num: 2, name: "ثور", name_en: "Saur" },
  { num: 3, name: "جوزا", name_en: "Jawza" },
  { num: 4, name: "سرطان", name_en: "Saratan" },
  { num: 5, name: "اسد", name_en: "Asad" },
  { num: 6, name: "سنبله", name_en: "Sunbula" },
  { num: 7, name: "میزان", name_en: "Mizan" },
  { num: 8, name: "عقرب", name_en: "Aqrab" },
  { num: 9, name: "قوس", name_en: "Qaws" },
  { num: 10, name: "جدی", name_en: "Jady" },
  { num: 11, name: "دلو", name_en: "Dalw" },
  { num: 12, name: "حوت", name_en: "Hut" }
];

// Get current Shamsi year
const getCurrentShamsiYear = () => {
  const date = new Date();
  const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric'
  }).format(date);
  return persianDate;
};

function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentShamsiYear());

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [selectedFee, setSelectedFee] = useState(null);

  const [newFee, setNewFee] = useState({
    student_id: "",
    class_id: "",
    total_amount: "",
    pay_amount: "",
    month: "",
    month_num: "",
    year: getCurrentShamsiYear()
  });

  // Helper function
  const getStudentFullName = (student) => {
    if (!student) return "Unknown Student";
    const firstName = student.first_name || student.name || "";
    const lastName = student.last_name || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return `Student ${student.id || ""}`;
  };

  // LOAD DATA
  const loadFees = async () => {
    try {
      const res = await API.get("/fees");
      setFees(res.data || []);
    } catch (err) {
      console.error("Error loading fees:", err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Error loading students:", err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await API.get("/classes");
      setClasses(res.data || []);
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  };

  useEffect(() => {
    loadFees();
    loadStudents();
    loadClasses();
  }, []);

  // PAYMENT HISTORY
  const loadHistory = async (studentId) => {
    try {
      const res = await API.get(`/fees/history/${studentId}`);
      setPaymentHistory(res.data || []);
    } catch (err) {
      console.error("Error loading history:", err);
      setPaymentHistory([]);
    }
  };

  // CHECK IF FEE EXISTS FOR MONTH
  const checkExistingFee = async (studentId, month, year) => {
    try {
      const res = await API.get(`/fees/check/${studentId}/${month}/${year}`);
      return res.data.exists;
    } catch (err) {
      return false;
    }
  };

  // CREATE FEE
  const createFee = async (e) => {
    e.preventDefault();

    if (!newFee.month) {
      alert("Please select a month");
      return;
    }

    // Check if fee already exists
    const exists = await checkExistingFee(newFee.student_id, newFee.month, newFee.year);
    if (exists) {
      alert(`Fee already exists for ${newFee.month} ${newFee.year}`);
      return;
    }

    try {
      const res = await API.post("/fees", {
        student_id: newFee.student_id,
        total_amount: newFee.total_amount,
        paid_amount: newFee.pay_amount || 0,
        month: newFee.month,
        month_num: newFee.month_num,
        year: newFee.year
      });

      alert("Fee created successfully");

      setNewFee({
        student_id: "",
        class_id: "",
        total_amount: "",
        pay_amount: "",
        month: "",
        month_num: "",
        year: getCurrentShamsiYear()
      });

      setSelectedStudent(null);
      setStudentSearch("");

      loadFees();
    } catch (err) {
      console.error("Error creating fee:", err);
      alert(err.response?.data?.error || "Error creating fee");
    }
  };

  // DELETE
  const deleteFee = async (id) => {
    if (!window.confirm("Delete this fee?")) return;
    try {
      await API.delete(`/fees/${id}`);
      loadFees();
      alert("Fee deleted successfully");
    } catch (err) {
      console.error("Error deleting fee:", err);
      alert("Error deleting fee");
    }
  };

  // UPDATE + PAY
  const handleUpdateAndPay = async () => {
    if (!selectedFee) return;

    try {
      await API.put(`/fees/${selectedFee.id}`, {
        student_id: selectedFee.student_id,
        total_amount: selectedFee.total_amount,
        month: selectedFee.month,
        month_num: selectedFee.month_num,
        year: selectedFee.year
      });

      if (selectedFee.pay_amount && selectedFee.pay_amount > 0) {
        await API.post("/fees/pay", {
          fee_id: selectedFee.id,
          amount: selectedFee.pay_amount
        });
      }

      alert("Updated successfully");

      setSelectedFee(null);
      loadFees();
    } catch (err) {
      console.error("Error updating fee:", err);
      alert("Error updating fee");
    }
  };

  // RECEIPT
 // RECEIPT - Simplified version without Persian text issues
const generateReceipt = async (fee) => {
  const doc = new jsPDF("p", "mm", "a4");
  
  const invoiceNo = `INV-${fee.year}-${fee.month_num}
  `;
  const today = new Date().toLocaleDateString();
  
  const img = new Image();
  img.src = logo;
  
  await new Promise((resolve) => {
    img.onload = () => resolve();
  });
  
  // Watermark
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.addImage(img, "PNG", 40, 90, 130, 130);
  doc.setGState(new doc.GState({ opacity: 1 }));
  
  // Header
  doc.addImage(img, "PNG", 15, 10, 25, 25);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Rashad Private High School", 105, 18, { align: "center"});
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Gardez City, Paktia, Afghanistan", 105, 24, { align: "center" });
  doc.text("Phone: 0777557721", 105, 29, { align: "center" });
  
  doc.line(15, 38, 195, 38);
  
  // Invoice Meta
  doc.setFontSize(11);
  doc.text(`Invoice No: ${invoiceNo}`, 15, 50);
  doc.text(`Date: ${today}`, 150, 50);
  
  // Student Info
  doc.rect(15, 55, 180, 35);
  
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 17, 63);
  
  doc.setFont("helvetica", "normal");
  
  // Use English month names or numbers to avoid encoding issues
  const monthMap = {
    "حمل": "Hamal (1)",
    "ثور": "Saur (2)",
    "جوزا": "Jawza (3)",
    "سرطان": "Saratan (4)",
    "اسد": "Asad (5)",
    "سنبله": "Sunbula (6)",
    "میزان": "Mizan (7)",
    "عقرب": "Aqrab (8)",
    "قوس": "Qaws (9)",
    "جدی": "Jady (10)",
    "دلو": "Dalw (11)",
    "حوت": "Hut (12)"
  };
  
  const englishMonth = monthMap[fee.month] || fee.month || `Month ${fee.month_num || ''}`;
  const monthYearText = `${englishMonth} - ${fee.year}`;
  
  doc.text(`Name: ${fee.name || "Unknown Student"}`, 17, 72);
  doc.text(`Student ID: ${fee.student_id || "N/A"}`, 17, 80);
  doc.text(`Period: ${monthYearText}`, 17, 88);
  
  // Table Header
  doc.setFillColor(230, 230, 230);
  doc.rect(15, 100, 180, 10, "F");
  
  doc.setFont("helvetica", "bold");
  doc.text("Description", 20, 107);
  doc.text("Amount (AFN)", 160, 107);
  
  // Table Body
  doc.setFont("helvetica", "normal");
  doc.rect(15, 110, 180, 45);
  
  doc.text(`Monthly Fee (${englishMonth} ${fee.year})`, 20, 120);
  doc.text(`${fee.total_amount || 0}`, 165, 120);
  
  doc.text("Paid Amount", 20, 130);
  doc.text(`${fee.paid_amount || 0}`, 165, 130);
  
  doc.text("Due Amount", 20, 140);
  doc.text(`${fee.due_amount || 0}`, 165, 140);
  
  // Status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  
  let statusText = "Status: ";
  let statusColor = [0, 0, 0];
  if (fee.status === "Paid") {
    statusText += "PAID";
    statusColor = [0, 150, 0];
  } else if (fee.status === "Partial") {
    statusText += "PARTIAL";
    statusColor = [255, 165, 0];
  } else {
    statusText += "UNPAID";
    statusColor = [255, 0, 0];
  }
  
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, 15, 165);
  doc.setTextColor(0, 0, 0);
  
  // QR Code
  const qr = await QRCode.toDataURL(invoiceNo);
  doc.addImage(qr, "PNG", 150, 160, 40, 40);
  
  // Total Box
  doc.rect(120, 210, 75, 30);
  
  doc.setFontSize(11);
  doc.text(`Total: ${fee.total_amount || 0} AFN`, 125, 220);
  doc.text(`Paid: ${fee.paid_amount || 0} AFN`, 125, 228);
  doc.text(`Due: ${fee.due_amount || 0} AFN`, 125, 236);
  
  // Signature
  doc.line(15, 260, 80, 260);
  doc.text("Authorized Signature", 15, 267);
  
  doc.line(120, 260, 195, 260);
  doc.text("Accountant", 120, 267);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer generated invoice. No signature required.",
    105,
    285,
    { align: "center" }
  );
  
  // Save with safe filename
  const safeName = (fee.name || "student").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`invoice_${safeName}_${fee.month_num || fee.month}_${fee.year}.pdf`);
};

  const filteredStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const studentName = getStudentFullName(s).toLowerCase();
    const searchLower = studentSearch.toLowerCase();
    return studentName.includes(searchLower);
  });

  // Available years (1400-1410)
  const availableYears = [];
  for (let i = 1400; i <= 1410; i++) {
    availableYears.push(i.toString());
  }

  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        <h3>Fees Management</h3>

        {/* Year Filter */}
        <div className="mb-3">
          <label className="form-label">Select Year:</label>
          <select 
            className="form-select w-auto"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* TYPEAHEAD SEARCH */}
        <input
          className="form-control mb-2"
          placeholder="Search student..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
        />

        <div className="border mb-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
          {filteredStudents.length === 0 ? (
            <div className="p-2 text-muted">No students found</div>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s.id}
                className="p-2 border-bottom"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setNewFee({ ...newFee, student_id: s.id, class_id: s.class_id, year: selectedYear });
                  setSelectedStudent(s);
                  setStudentSearch(getStudentFullName(s));
                  loadHistory(s.id);
                }}
              >
                {getStudentFullName(s)} - {s.class_name || "No Class"}
              </div>
            ))
          )}
        </div>

        {/* PAYMENT HISTORY */}
        {paymentHistory.length > 0 && (
          <div className="card p-3 mb-3">
            <h5>Payment History</h5>

            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Month </th>
                  <th>Year </th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {paymentHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{h.month || "N/A"}</td>
                    <td>{h.year || "N/A"}</td>
                    <td>{h.total_amount || 0}</td>
                    <td>{h.paid_amount || 0}</td>
                    <td>{h.due_amount || 0}</td>
                    <td>{h.status || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADD FEE FORM */}
        <form onSubmit={createFee} className="card p-3 mb-3">
          <h5>Add Fee Record </h5>

          <div className="alert alert-info p-2">
            <strong>Student:</strong> {selectedStudent ? getStudentFullName(selectedStudent) : "Not selected"}
            <br />
            <strong>Class :</strong> {selectedStudent?.class_name || "N/A"}
          </div>

          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label">Month:</label>
              <select
                className="form-control"
                value={newFee.month}
                onChange={(e) => {
                  const selectedMonth = shamsiMonths.find(m => m.name === e.target.value);
                  setNewFee({ 
                    ...newFee, 
                    month: e.target.value,
                    month_num: selectedMonth?.num || ""
                  });
                }}
                required
              >
                <option value="">-- Select Month --</option>
                {shamsiMonths.map(month => (
                  <option key={month.num} value={month.name}>
                    {month.name} ({month.name_en})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Year:</label>
              <select
                className="form-control"
                value={newFee.year}
                onChange={(e) => setNewFee({ ...newFee, year: e.target.value })}
                required
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Total Amount:</label>
              <input
                className="form-control"
                type="number"
                placeholder="Total Amount "
                value={newFee.total_amount}
                onChange={(e) =>
                  setNewFee({ ...newFee, total_amount: e.target.value })
                }
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Pay Amount (Optional) </label>
              <input
                className="form-control"
                type="number"
                placeholder="Pay Amount "
                value={newFee.pay_amount}
                onChange={(e) =>
                  setNewFee({ ...newFee, pay_amount: e.target.value })
                }
              />
            </div>
          </div>

          <button 
            className="btn btn-primary mt-2" 
            type="submit" 
            disabled={!newFee.student_id || !newFee.total_amount || !newFee.month}
          >
            Create Fee
          </button>
        </form>

        {/* FEES TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Student</th>
                <th>Month</th>
                <th>Year</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {fees.filter(f => f.year === selectedYear).length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No fee records found for {selectedYear}</td>
                </tr>
              ) : (
                fees.filter(f => f.year === selectedYear).map((f) => (
                  <tr key={f.id}>
                    <td>{f.name || "Unknown Student"}</td>
                    <td>{f.month || "-"}</td>
                    <td>{f.year || "-"}</td>
                    <td>{f.total_amount || 0}</td>
                    <td>{f.paid_amount || 0}</td>
                    <td>{f.due_amount || 0}</td>
                    <td>
                      <span className={`badge ${f.status === "Paid" ? "bg-success" : f.status === "Partial" ? "bg-warning" : "bg-danger"}`}>
                        {f.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => generateReceipt(f)}
                      >
                        Print
                      </button>

                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => setSelectedFee({ ...f, pay_amount: "" })}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteFee(f.id)}
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

        {/* EDIT MODAL */}
        {selectedFee && (
          <div className="modal d-block" style={{ background: "#00000088", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content p-3">

                <h5>Edit Fee + Payment</h5>

                <label>Total Amount:</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={selectedFee.total_amount}
                  onChange={(e) =>
                    setSelectedFee({
                      ...selectedFee,
                      total_amount: e.target.value
                    })
                  }
                />

                <label>Month:</label>
                <select
                  className="form-control mb-2"
                  value={selectedFee.month}
                  onChange={(e) => {
                    const selectedMonth = shamsiMonths.find(m => m.name === e.target.value);
                    setSelectedFee({
                      ...selectedFee,
                      month: e.target.value,
                      month_num: selectedMonth?.num || ""
                    });
                  }}
                >
                  {shamsiMonths.map(month => (
                    <option key={month.num} value={month.name}>
                      {month.name} ({month.name_en})
                    </option>
                  ))}
                </select>

                <label>Year:</label>
                <select
                  className="form-control mb-2"
                  value={selectedFee.year}
                  onChange={(e) =>
                    setSelectedFee({
                      ...selectedFee,
                      year: e.target.value
                    })
                  }
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <label>Additional Payment</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Pay Amount"
                  value={selectedFee.pay_amount || ""}
                  onChange={(e) =>
                    setSelectedFee({
                      ...selectedFee,
                      pay_amount: e.target.value
                    })
                  }
                />

                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedFee(null)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={handleUpdateAndPay}
                  >
                    Save Changes
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Fees;