import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "../assets/logo.jpg";

function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [selectedFee, setSelectedFee] = useState(null);

  const [newFee, setNewFee] = useState({
    student_id: "",
    class_id: "",
    total_amount: "",
    pay_amount: ""
  });

  // Helper function to get student full name safely
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

  // CREATE FEE
  const createFee = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/fees", {
        student_id: newFee.student_id,
        class_id: newFee.class_id,
        total_amount: newFee.total_amount
      });

      const feeId = res.data.id;
      const invoiceNo = res.data.invoiceNo;

      if (newFee.pay_amount && newFee.pay_amount > 0) {
        await API.post("/fees/pay", {
          fee_id: feeId,
          amount: newFee.pay_amount
        });
      }

      alert("Fee created successfully");

      setNewFee({
        student_id: "",
        class_id: "",
        total_amount: "",
        pay_amount: ""
      });

      setSelectedStudent(null);
      setStudentSearch("");

      loadFees();
    } catch (err) {
      console.error("Error creating fee:", err);
      alert("Error creating fee");
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
        class_id: selectedFee.class_id,
        total_amount: selectedFee.total_amount
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
  const generateReceipt = async (fee) => {
    const doc = new jsPDF("p", "mm", "a4");
  
    const invoiceNo = `INV-${new Date().getFullYear()}-${fee.id}`;
    const today = new Date().toLocaleDateString();
  
    const img = new Image();
    img.src = logo;
  
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });
  
    // =========================
    // 🔷 WATERMARK
    // =========================
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.addImage(img, "PNG", 40, 90, 130, 130);
    doc.setGState(new doc.GState({ opacity: 1 }));
  
    // =========================
    // 🔷 HEADER
    // =========================
    doc.addImage(img, "PNG", 15, 10, 25, 25);
  
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rashad Private High School", 105, 18, { align: "center"});
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gardez City, Paktia, Afghanistan", 105, 24, { align: "center" });
    doc.text("Phone: 0777557721", 105, 29, { align: "center" });
  
    // line
    doc.line(15, 38, 195, 38);
  
    // =========================
    // 🔷 INVOICE META
    // =========================
    doc.setFontSize(11);
    doc.text(`Invoice No: ${invoiceNo}`, 15, 50);
    doc.text(`Date: ${today}`, 150, 50);
  
    // =========================
    // 🔷 STUDENT INFO BOX
    // =========================
    doc.rect(15, 55, 180, 25);
  
    doc.setFont("helvetica", "bold");
    doc.text("Student Information", 17, 62);
  
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${fee.name || "N/A"}`, 17, 70);
    doc.text(`Student ID: ${fee.student_id || "N/A"}`, 17, 76);
  
    // =========================
    // 🔷 TABLE HEADER
    // =========================
    doc.setFillColor(230, 230, 230);
    doc.rect(15, 90, 180, 10, "F");
  
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, 97);
    doc.text("Amount", 170, 97);
  
    // =========================
    // 🔷 TABLE BODY
    // =========================
    doc.setFont("helvetica", "normal");
  
    doc.rect(15, 100, 180, 40);
  
    doc.text("Total Fee", 20, 110);
    doc.text(`${fee.total_amount || 0}`, 170, 110);
  
    doc.text("Paid Amount", 20, 120);
    doc.text(`${fee.paid_amount || 0}`, 170, 120);
  
    doc.text("Due Amount", 20, 130);
    doc.text(`${fee.due_amount || 0}`, 170, 130);
  
    // =========================
    // 🔷 STATUS BOX
    // =========================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Status: ${fee.status || "Pending"}`, 15, 150);
  
    // =========================
    // 🔷 QR CODE
    // =========================
    const qr = await QRCode.toDataURL(invoiceNo);
    doc.addImage(qr, "PNG", 150, 150, 40, 40);
  
    // =========================
    // 🔷 TOTAL BOX (RIGHT)
    // =========================
    doc.rect(120, 200, 75, 30);
  
    doc.setFontSize(11);
    doc.text(`Total: ${fee.total_amount || 0}`, 125, 210);
    doc.text(`Paid: ${fee.paid_amount || 0}`, 125, 218);
    doc.text(`Due: ${fee.due_amount || 0}`, 125, 226);
  
    // =========================
    // 🔷 SIGNATURE AREA
    // =========================
    doc.line(15, 240, 80, 240);
    doc.text("Authorized Signature", 15, 247);
  
    doc.line(120, 240, 195, 240);
    doc.text("Accountant", 120, 247);
  
    // =========================
    // 🔷 FOOTER
    // =========================
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This is a computer generated invoice. No signature required.",
      105,
      285,
      { align: "center" }
    );
  
    doc.save(`invoice_${fee.name || "student"}.pdf`);
  };

  // Filter students safely
  const filteredStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const studentName = getStudentFullName(s).toLowerCase();
    const searchLower = studentSearch.toLowerCase();
    return studentName.includes(searchLower);
  });

  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        <h3>Fees Management</h3>

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
                  setNewFee({ ...newFee, student_id: s.id, class_id: s.class_id });
                  setSelectedStudent(s);
                  setStudentSearch(getStudentFullName(s));
                  loadHistory(s.id);
                }}
              >
                {getStudentFullName(s)}
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
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {paymentHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{h.created_at ? new Date(h.created_at).toLocaleDateString() : "N/A"}</td>
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
          <h5>Add Fee Record</h5>

          <div className="alert alert-info p-2">
            <strong>Student:</strong> {selectedStudent ? getStudentFullName(selectedStudent) : "Not selected"}
            <br />
            <strong>Class:</strong> {selectedStudent?.class_name || "N/A"}
          </div>

          <input
            className="form-control mb-2"
            type="number"
            placeholder="Total Amount"
            value={newFee.total_amount}
            onChange={(e) =>
              setNewFee({ ...newFee, total_amount: e.target.value })
            }
            required
          />

          <input
            className="form-control mb-2"
            type="number"
            placeholder="Pay Amount (Optional)"
            value={newFee.pay_amount}
            onChange={(e) =>
              setNewFee({ ...newFee, pay_amount: e.target.value })
            }
          />

          <button className="btn btn-primary" type="submit" disabled={!newFee.student_id || !newFee.total_amount}>
            Create Fee
          </button>
        </form>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Student</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {fees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No fee records found</td>
                </tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name || "Unknown Student"}</td>
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

                <label>Total Amount</label>
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