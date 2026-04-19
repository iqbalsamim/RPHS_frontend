import { useEffect, useState } from "react";
import API from "../services/api";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const socket = io("http://localhost:5000");

function Dashboard() {
  const [data, setData] = useState(null);

  const loadData = async () => {
    const res = await API.get("/dashboard");
    setData(res.data);
  };

  useEffect(() => {
    loadData();
    socket.on("dashboard-update", loadData);
    return () => socket.off("dashboard-update");
  }, []);

  if (!data) return <div>Loading...</div>;

  const feesChart = {
    labels: ["Collected", "Due"],
    datasets: [
      {
        data: [data.kpis.totalCollected, data.kpis.totalDue],
  
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)",   // green
          "rgba(239, 68, 68, 0.85)"     // red
        ],
  
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 15
      }
    ]
  };

  const monthlyChart = {
    labels: data.charts.monthlyRevenue.map(m => m.month),
  
    datasets: [
      {
        label: "Revenue",
  
        data: data.charts.monthlyRevenue.map(m => m.total),
  
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.15)",
  
        fill: true,
        tension: 0.4, // smooth curve
  
        pointBackgroundColor: "#fff",
        pointBorderColor: "#6366f1",
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const classChart = {
  labels: data.charts.classRevenue.map(c => c.class),

  datasets: [
    {
      label: "Class Revenue",

      data: data.charts.classRevenue.map(c => c.revenue),

      backgroundColor: [
        "rgba(99, 102, 241, 0.8)",
        "rgba(16, 185, 129, 0.8)",
        "rgba(245, 158, 11, 0.8)",
        "rgba(139, 92, 246, 0.8)",
        "rgba(6, 182, 212, 0.8)"
      ],

      borderRadius: 10,
      borderSkipped: false
    }
  ]
};

  return (
    <div style={{ background: "#f4f7fb", minHeight: "100vh" }}>
  
      {/* ================= MAIN ================= */}
      <div style={{ flex: 1, padding: "24px" }}>
  
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 style={{
            fontWeight: "800",
            background: "linear-gradient(90deg,#2563eb,black)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Enterprise Dashboard
          </h3>
        </div>
  
        {/* ================= KPI SECTION ================= */}
        <div className="row g-3">
  
          <div className="col-md-3">
            <div className="p-3 rounded shadow-sm text-white"
              style={{
                background: "linear-gradient(135deg,#6366f1,#3b82f6)",
                borderRadius: "16px"
              }}>
              <h6>Total Students</h6>
              <h2>{data.kpis.totalStudents}</h2>
            </div>
          </div>
  
          <div className="col-md-3">
            <div className="p-3 rounded shadow-sm text-white"
              style={{
                background: "linear-gradient(135deg,#10b981,#059669)",
                borderRadius: "16px"
              }}>
              <h6>Total Fees</h6>
              <h2>{data.kpis.totalFees}</h2>
            </div>
          </div>
  
          <div className="col-md-3">
            <div className="p-3 rounded shadow-sm text-white"
              style={{
                background: "linear-gradient(135deg,#f59e0b,#f97316)",
                borderRadius: "16px"
              }}>
              <h6>Collected</h6>
              <h2>{data.kpis.totalCollected}</h2>
            </div>
          </div>
  
          <div className="col-md-3">
            <div className="p-3 rounded shadow-sm text-white"
              style={{
                background: "linear-gradient(135deg,#ef4444,#ec4899)",
                borderRadius: "16px"
              }}>
              <h6>Collection Rate</h6>
              <h2>{data.kpis.collectionRate}</h2>
            </div>
          </div>
  
          <div className="col-md-3">
            <div className="p-3 rounded shadow-sm text-white"
              style={{
                background: "linear-gradient(135deg,#06b6d4,#3b82f6)",
                borderRadius: "16px"
              }}>
              <h6>Total Due</h6>
              <h2>{data.kpis.totalDue}</h2>
            </div>
          </div>
  
        </div>
  
        {/* ================= CHARTS ================= */}
        <div className="row mt-4 g-3">
  
          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded"
              style={{ background: "#ffffff", borderRadius: "16px" }}>
              <h6 style={{ fontWeight: "700" }}>💰 Fees Distribution</h6>
              <Pie data={feesChart} />
            </div>
          </div>
  
          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded"
              style={{ background: "#ffffff", borderRadius: "16px" }}>
              <h6 style={{ fontWeight: "700" }}>📈 Monthly Revenue</h6>
              <Line data={monthlyChart} />
            </div>
          </div>
  
          <div className="col-md-4">
            <div className="p-3 shadow-sm rounded"
              style={{ background: "#ffffff", borderRadius: "16px" }}>
              <h6 style={{ fontWeight: "700" }}>🏫 Class Revenue</h6>
              <Bar data={classChart} />
            </div>
          </div>
  
        </div>
  
        {/* ================= INSIGHTS ================= */}
        <div className="row mt-4 g-3">
  
          {/* TOP DEFAULTERS */}
          <div className="col-md-6">
            <div className="p-3 shadow-sm rounded"
              style={{ background: "#fff", borderRadius: "16px" }}>
  
              <h6 style={{ fontWeight: "800", color: "#ef4444" }}>
                ⚠️ Top Defaulters
              </h6>
  
              {data.insights.topDefaulters.map((d, i) => (
                <div key={i}
                  className="d-flex justify-content-between py-2 border-bottom">
  
                  <span style={{ fontWeight: "500" }}>{d.name}</span>
  
                  <span style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontWeight: "600"
                  }}>
                    {d.due}
                  </span>
  
                </div>
              ))}
  
            </div>
          </div>
  
          {/* RECENT PAYMENTS */}
          <div className="col-md-6">
            <div className="p-3 shadow-sm rounded"
              style={{ background: "#fff", borderRadius: "16px" }}>
  
              <h6 style={{ fontWeight: "800", color: "#10b981" }}>
                💵 Recent Payments
              </h6>
  
              {data.insights.recentPayments.map((p, i) => (
                <div key={i}
                  className="d-flex justify-content-between py-2 border-bottom">
  
                  <span style={{ fontWeight: "500" }}>{p.name}</span>
  
                  <span style={{
                    background: "#dcfce7",
                    color: "#16a34a",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontWeight: "600"
                  }}>
                    {p.paid_amount}
                  </span>
  
                </div>
              ))}
  
            </div>
          </div>
  
        </div>
  
      </div>
    </div>
  );
}

export default Dashboard;