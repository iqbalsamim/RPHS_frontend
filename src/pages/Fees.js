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
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isPrinting, setIsPrinting] = useState(false);

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

    const exists = await checkExistingFee(newFee.student_id, newFee.month, newFee.year);
    if (exists) {
      alert(`Fee already exists for ${newFee.month} ${newFee.year}`);
      return;
    }

    try {
      await API.post("/fees", {
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

  // SINGLE RECEIPT
    // SINGLE RECEIPT - Centered on page
  const generateReceipt = async (fee) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    
    // Calculate width for centered content (use 160mm width for better appearance)
    const contentWidth = 160;
    const startX = (pageWidth - contentWidth) / 2;
    const startY = 20; // Top margin
    
    const invoiceNo = `INV-${fee.year}-${fee.month_num}`;
    const today = new Date().toLocaleDateString();
    
    const img = new Image();
    img.src = logo;
    
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });
    
    // Light watermark
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    doc.addImage(img, "PNG", centerX - 40, startY + 40, 80, 80);
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Logo (centered at top)
    doc.addImage(img, "PNG", centerX - 10, startY, 20, 20);
    
    // Header - Centered
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rashad Private High School", centerX, startY + 28, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gardez City, Paktia, Afghanistan", centerX, startY + 35, { align: "center" });
    doc.text("Phone: 0777557721", centerX, startY + 40, { align: "center" });
    
    // Divider
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(startX, startY + 46, startX + contentWidth, startY + 46);
    
    // Invoice Info
    doc.setFontSize(11);
    doc.text(`Invoice No: ${invoiceNo}`, startX, startY + 56);
    doc.text(`Date: ${today}`, startX + 120, startY + 56);
    
    // Student Info Box - Centered
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(startX, startY + 62, contentWidth, 32);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Student Information", startX + 5, startY + 72);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const monthMap = {
      "حمل": "Hamal",
      "ثور": "Saur",
      "جوزا": "Jawza",
      "سرطان": "Saratan",
      "اسد": "Asad",
      "سنبله": "Sunbula",
      "میزان": "Mizan",
      "عقرب": "Aqrab",
      "قوس": "Qaws",
      "جدی": "Jady",
      "دلو": "Dalw",
      "حوت": "Hut"
    };
    
    const englishMonth = monthMap[fee.month] || fee.month || `Month ${fee.month_num || ''}`;
    doc.text(`Student ID: ${fee.student_id || "N/A"}`, startX + 5, startY + 80);
    doc.text(`Name: ${fee.name || "Unknown Student"}`, startX + 5, startY + 85);
    doc.text(`Period: ${englishMonth} ${fee.year}`, startX + 5, startY + 90);
    
    // Amounts Table
    let currentY = startY + 98;
    
    // Table Header
    doc.setFillColor(230, 230, 230);
    doc.rect(startX, currentY, contentWidth, 8, "F");
    doc.rect(startX, currentY, contentWidth, 8);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Description", startX + 5, currentY + 6);
    doc.text("Amount(AFN)", startX + 125, currentY + 6);
    
    currentY += 8;
    
    // Table Body
    doc.setFont("helvetica", "normal");
    doc.rect(startX, currentY, contentWidth, 36);
    
    doc.text(`Monthly Fee (${englishMonth} ${fee.year})`, startX + 5, currentY + 8);
    doc.text(`${fee.total_amount || 0}`, startX + 150, currentY + 8, { align: "right" });
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(startX, currentY + 14, startX + contentWidth, currentY + 14);
    doc.setDrawColor(0, 0, 0);
    
    doc.text("Paid Amount", startX + 5, currentY + 20);
    doc.text(`${fee.paid_amount || 0}`, startX + 150, currentY + 20, { align: "right" });
    
    doc.text("Due Amount", startX + 5, currentY + 30);
    doc.text(`${fee.due_amount || 0}`, startX + 150, currentY + 30, { align: "right" });
    
    currentY += 36;
    
    // Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    
    let statusColor = [0, 0, 0];
    let statusText = "";
    if (fee.status === "Paid") {
      statusText = " STATUS: PAID";
      statusColor = [0, 150, 0];
    } else if (fee.status === "Partial") {
      statusText = "STATUS: PARTIAL";
      statusColor = [255, 165, 0];
    } else {
      statusText = " STATUS: UNPAID";
      statusColor = [255, 0, 0];
    }
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, centerX, currentY + 8, { align: "center" });
    doc.setTextColor(0, 0, 0);
    
    // QR Code (centered)
    const qr = await QRCode.toDataURL(invoiceNo);
    doc.addImage(qr, "PNG", centerX - 20, currentY + 15, 40, 40);
    
    // Signature Section
    currentY += 65;
    
    doc.setDrawColor(0, 0, 0);
    doc.line(startX, currentY, startX + 70, currentY);
    doc.text("Authorized Signature", startX, currentY + 6);
    
    doc.line(startX + contentWidth - 70, currentY, startX + contentWidth, currentY);
    doc.text("Accountant", startX + contentWidth - 70, currentY + 6);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This is a computer generated invoice. No signature required.",
      centerX,
      currentY + 20,
      { align: "center" }
    );
    
    // Save with safe filename
    const safeName = (fee.name || "student").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`invoice_${safeName}_${fee.month_num || fee.month}_${fee.year}.pdf`);
  };

  // Helper function to add a single receipt to PDF document
  const addReceiptToDoc = async (doc, fee, startY, isFullPage = false) => {
    const invoiceNo = `INV-${fee.year}-${fee.month_num}`;
    const today = new Date().toLocaleDateString();
    
    const img = new Image();
    img.src = logo;
    
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });
    
    const y = startY;
    
    // Small receipt format for batch printing (scaled down)
    const isBatch = !isFullPage;
    const scale = isBatch ? 0.48 : 1;
    const xOffset = isBatch ? (startY % 2 === 0 ? 15 : 105) : 15;
    const yOffset = y;
    
    // Watermark (smaller for batch)
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.addImage(img, "PNG", xOffset + 25, yOffset + 45, 65, 65);
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Header
    doc.addImage(img, "PNG", xOffset, yOffset + 5, 12, 12);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isBatch ? 10 : 18);
    doc.text("Rashad Private High School", xOffset + 45, yOffset + 9, { align: "center"});
    doc.setFontSize(isBatch ? 6 : 10);
    doc.setFont("helvetica", "normal");
    doc.text("Gardez City, Paktia, Afghanistan", xOffset + 45, yOffset + 13, { align: "center" });
    doc.text("Phone: 0777557721", xOffset + 45, yOffset + 16, { align: "center" });
    
    doc.line(xOffset, yOffset + 20, xOffset + 90, yOffset + 20);
    
    // Invoice Meta
    doc.setFontSize(isBatch ? 7 : 11);
    doc.text(`Invoice No: ${invoiceNo}`, xOffset, yOffset + 27);
    doc.text(`Date: ${today}`, xOffset + 60, yOffset + 27);
    
    // Student Info
    doc.rect(xOffset, yOffset + 30, 90, 18);
    
    doc.setFont("helvetica", "bold");
    doc.text("Student Info", xOffset + 2, yOffset + 35);
    
    doc.setFont("helvetica", "normal");
    
    const monthMap = {
      "حمل": "Hamal",
      "ثور": "Saur",
      "جوزا": "Jawza",
      "سرطان": "Saratan",
      "اسد": "Asad",
      "سنبله": "Sunbula",
      "میزان": "Mizan",
      "عقرب": "Aqrab",
      "قوس": "Qaws",
      "جدی": "Jady",
      "دلو": "Dalw",
      "حوت": "Hut"
    };
    
    const englishMonth = monthMap[fee.month] || fee.month || `Month ${fee.month_num || ''}`;
    const monthYearText = `${englishMonth} ${fee.year}`;
    
    doc.text(`Name: ${(fee.name || "Unknown Student").substring(0, 20)}`, xOffset + 2, yOffset + 40);
    doc.text(`ID: ${fee.student_id || "N/A"}`, xOffset + 50, yOffset + 40);
    doc.text(`Period: ${monthYearText}`, xOffset + 2, yOffset + 45);
    
    // Table
    doc.setFillColor(230, 230, 230);
    doc.rect(xOffset, yOffset + 50, 90, 5, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isBatch ? 6 : 10);
    doc.text("Description", xOffset + 2, yOffset + 54);
    doc.text("Amount", xOffset + 75, yOffset + 54);
    
    doc.setFont("helvetica", "normal");
    doc.rect(xOffset, yOffset + 55, 90, 22);
    
    doc.text(`Monthly Fee (${englishMonth})`, xOffset + 2, yOffset + 61);
    doc.text(`${fee.total_amount || 0}`, xOffset + 78, yOffset + 61);
    
    doc.text("Paid Amount", xOffset + 2, yOffset + 66);
    doc.text(`${fee.paid_amount || 0}`, xOffset + 78, yOffset + 66);
    
    doc.text("Due Amount", xOffset + 2, yOffset + 71);
    doc.text(`${fee.due_amount || 0}`, xOffset + 78, yOffset + 71);
    
    // Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isBatch ? 7 : 12);
    
    let statusText = "";
    let statusColor = [0, 0, 0];
    if (fee.status === "Paid") {
      statusText = "PAID";
      statusColor = [0, 150, 0];
    } else if (fee.status === "Partial") {
      statusText = "PARTIAL";
      statusColor = [255, 165, 0];
    } else {
      statusText = "UNPAID";
      statusColor = [255, 0, 0];
    }
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`Status: ${statusText}`, xOffset + 2, yOffset + 82);
    doc.setTextColor(0, 0, 0);
    
    // QR Code (smaller for batch)
    const qrSize = isBatch ? 20 : 40;
    const qr = await QRCode.toDataURL(invoiceNo);
    doc.addImage(qr, "PNG", xOffset + 65, yOffset + 78, qrSize, qrSize);
    
    // Signature (only for full page)
    if (!isBatch) {
      doc.line(xOffset, yOffset + 130, xOffset + 35, yOffset + 130);
      doc.text("Authorized Signature", xOffset, yOffset + 137);
      
      doc.line(xOffset + 55, yOffset + 130, xOffset + 90, yOffset + 130);
      doc.text("Accountant", xOffset + 55, yOffset + 137);
    }
    
    // Footer for batch
    if (isBatch) {
      doc.setFontSize(5);
      doc.setFont("helvetica", "italic");
      doc.text("Computer generated invoice", xOffset + 45, yOffset + 143, { align: "center" });
    }
  };

  // BATCH PRINT - Print multiple invoices on one page (4 per page)
   // BATCH PRINT - Print multiple invoices on one page (4 per page)
   // BATCH PRINT - Print multiple invoices on one page (4 per page, no QR code)
  const batchPrintInvoices = async () => {
    if (filteredFees.length === 0) {
      alert("No fees to print");
      return;
    }

    setIsPrinting(true);
    
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Define 4 positions on the page (2 columns x 2 rows)
      // With proper padding from top and bottom
      const positions = [
        { x: 15, y: 15 },   // Position 1: Top-Left
        { x: 110, y: 15 },  // Position 2: Top-Right
        { x: 15, y: 155 },  // Position 3: Bottom-Left
        { x: 110, y: 155 }  // Position 4: Bottom-Right
      ];
      
      for (let i = 0; i < filteredFees.length; i++) {
        const fee = filteredFees[i];
        const positionIndex = i % 4;
        
        // Add new page for every 4 invoices (except first page)
        if (i > 0 && positionIndex === 0) {
          doc.addPage();
        }
        
        const pos = positions[positionIndex];
        await addCompactReceiptToDoc(doc, fee, pos.x, pos.y);
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      const fileName = `invoices_${selectedYear}_${selectedStatus}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (err) {
      console.error("Error printing batch invoices:", err);
      alert("Error generating batch invoices: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // Helper function for compact receipt (4 per page, no QR code)
   // Helper function for compact receipt (4 per page, no QR code, with solid border)
  const addCompactReceiptToDoc = async (doc, fee, startX, startY) => {
    const invoiceNo = `INV-${fee.year}-${fee.month_num}`;
    const today = new Date().toLocaleDateString();
    
    const img = new Image();
    img.src = logo;
    
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });
    
    // Draw SOLID BORDER around the entire invoice
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(startX, startY, 90, 80);
    
    // Light watermark inside border
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    doc.addImage(img, "PNG", startX + 20, startY + 25, 50, 50);
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Small Logo
    doc.addImage(img, "PNG", startX + 2, startY + 2, 8, 8);
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Rashad High School", startX + 45, startY + 6, { align: "center" });
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text("Gardez City, Paktia", startX + 45, startY + 9.5, { align: "center" });
    doc.text("Phone: 0777557721", startX + 45, startY + 12.5, { align: "center" });
    
    // Inner divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(startX + 2, startY + 14.5, startX + 88, startY + 14.5);
    
    // Invoice Info
    doc.setFontSize(5.5);
    doc.text(invoiceNo, startX + 2, startY + 19.5);
    doc.text(today, startX + 65, startY + 19.5);
    
    // Student Info Box (with border)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(startX + 2, startY + 22, 86, 14);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text("Student Info", startX + 4, startY + 26);
    
    doc.setFont("helvetica", "normal");
    
    const monthMap = {
      "حمل": "Hamal",
      "ثور": "Saur",
      "جوزا": "Jawza",
      "سرطان": "Saratan",
      "اسد": "Asad",
      "سنبله": "Sunbula",
      "میزان": "Mizan",
      "عقرب": "Aqrab",
      "قوس": "Qaws",
      "جدی": "Jady",
      "دلو": "Dalw",
      "حوت": "Hut"
    };
    
    const englishMonth = monthMap[fee.month] || fee.month || `M${fee.month_num || ''}`;
    const studentName = (fee.name || "Unknown Student").substring(0, 16);
    
    doc.text(`First Name: ${studentName}`, startX + 4, startY + 30.5);
    doc.text(`ID: ${fee.student_id || "N/A"}`, startX + 4, startY + 28.5);
    doc.text(`Period: ${englishMonth} ${fee.year}`, startX + 4, startY + 34);
    
    // Amounts Table
    let currentY = startY + 38;
    
    // Table Header (with border)
    doc.setFillColor(230, 230, 230);
    doc.rect(startX + 2, currentY, 86, 4.5, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(startX + 2, currentY, 86, 4.5);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text("Description", startX + 4, currentY + 3);
    doc.text("AFN", startX + 84, currentY + 3);
    
    currentY += 4.5;
    
    // Table Body (with border)
    doc.setFont("helvetica", "normal");
    doc.rect(startX + 2, currentY, 86, 15);
    
    doc.text("Total Fee", startX + 4, currentY + 4);
    doc.text(`${fee.total_amount || 0}`, startX + 84, currentY + 4, { align: "right" });
    
    // Inner divider line in table
    doc.setDrawColor(200, 200, 200);
    doc.line(startX + 2, currentY + 7.5, startX + 88, currentY + 7.5);
  
    doc.text("Paid Amount", startX + 4, currentY + 8.5);
    doc.text(`${fee.paid_amount || 0}`, startX + 84, currentY + 8.5, { align: "right" });
   
    doc.text("Due Amount", startX + 4, currentY + 13);
    doc.text(`${fee.due_amount || 0}`, startX + 84, currentY + 13, { align: "right" });
    
    currentY += 15;
    
    // Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    
    let statusColor = [0, 0, 0];
    let statusText = "";
    if (fee.status === "Paid") {
      statusText = "PAID";
      statusColor = [0, 150, 0];
    } else if (fee.status === "Partial") {
      statusText = " PARTIAL";
      statusColor = [255, 165, 0];
    } else {
      statusText = "UNPAID";
      statusColor = [255, 0, 0];
    }
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(statusText, startX + 4, currentY + 3);
    doc.setTextColor(0, 0, 0);
    
    // Footer
    doc.setFontSize(4);
    doc.setFont("helvetica", "italic");
    doc.text("System generated invoice No need to sign", startX + 45, currentY + 11, { align: "center" });
  };

  

  // Filter fees by year and status
  const filteredFees = fees.filter(f => {
    if (f.year !== selectedYear) return false;
    if (selectedStatus !== "All" && f.status !== selectedStatus) return false;
    return true;
  });

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

  // Status options for filter
  const statusOptions = [
    { value: "All", label: "All Status", color: "secondary" },
    { value: "Paid", label: "Paid", color: "success" },
    { value: "Partial", label: "Partial", color: "warning" },
    { value: "Unpaid", label: "Unpaid", color: "danger" }
  ];

  // Calculate summary statistics
  const getSummaryStats = () => {
    const stats = {
      total: 0,
      paid: 0,
      partial: 0,
      unpaid: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0
    };

    filteredFees.forEach(fee => {
      stats.total++;
      stats.totalAmount += fee.total_amount || 0;
      stats.totalPaid += fee.paid_amount || 0;
      stats.totalDue += fee.due_amount || 0;
      
      if (fee.status === "Paid") stats.paid++;
      else if (fee.status === "Partial") stats.partial++;
      else if (fee.status === "Unpaid") stats.unpaid++;
    });

    return stats;
  };

  const stats = getSummaryStats();

  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        <h3>Fees Management</h3>

        {/* Filter Section */}
        <div className="card p-3 mb-3">
          <div className="row align-items-end">
            <div className="col-md-3 mb-2">
              <label className="form-label">Select Year:</label>
              <select 
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-2">
              <label className="form-label">Filter by Status:</label>
              <select 
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Quick Stats:</label>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-success">Paid: {stats.paid}</span>
                <span className="badge bg-warning">Partial: {stats.partial}</span>
                <span className="badge bg-danger">Unpaid: {stats.unpaid}</span>
                <span className="badge bg-secondary">Total: {stats.total}</span>
                {filteredFees.length > 0 && (
                  <button 
                    className="btn btn-sm btn-primary ms-2"
                    onClick={batchPrintInvoices}
                    disabled={isPrinting}
                  >
                    {isPrinting ? "Printing..." : "🖨️ Print All Invoices"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h6>Total Amount</h6>
                  <h4 className="text-primary">{stats.totalAmount.toLocaleString()} AFN</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h6>Total Paid</h6>
                  <h4 className="text-success">{stats.totalPaid.toLocaleString()} AFN</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h6>Total Due</h6>
                  <h4 className="text-danger">{stats.totalDue.toLocaleString()} AFN</h4>
                </div>
              </div>
            </div>
          </div>
          
          {/* Print Info */}
          {filteredFees.length > 0 && !isPrinting && (
            <div className="alert alert-info mt-3 mb-0">
              <small>
                <strong>📄 Print Ready:</strong> {filteredFees.length} invoice(s) ready to print. 
                Will print {Math.ceil(filteredFees.length / 4)} page(s) with 4 invoices per page.
              </small>
            </div>
          )}
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
                  <th>Month</th>
                  <th>Year</th>
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
          <h5>Add Fee Record</h5>

          <div className="alert alert-info p-2">
            <strong>Student:</strong> {selectedStudent ? getStudentFullName(selectedStudent) : "Not selected"}
            <br />
            <strong>Class:</strong> {selectedStudent?.class_name || "N/A"}
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
                placeholder="Total Amount"
                value={newFee.total_amount}
                onChange={(e) =>
                  setNewFee({ ...newFee, total_amount: e.target.value })
                }
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <label className="form-label">Pay Amount (Optional):</label>
              <input
                className="form-control"
                type="number"
                placeholder="Pay Amount"
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
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">
                    No fee records found for {selectedYear} {selectedStatus !== "All" ? `with status "${selectedStatus}"` : ""}
                  </td>
                </tr>
              ) : (
                filteredFees.map((f) => (
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

                <label>Additional Payment:</label>
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