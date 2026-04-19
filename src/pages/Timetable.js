import { useState } from "react";

function Timetable() {
  const [timetable, setTimetable] = useState([]);

  return (
    <div>
      <h4 className="mb-3">📅 Timetable</h4>

      <div className="card p-3 shadow-sm">
        <p className="text-muted">
          Timetable builder coming soon (drag & drop feature 🚀)
        </p>

        {/* SAMPLE GRID */}
        <table className="table table-bordered text-center">
          <thead>
            <tr>
              <th>Day</th>
              <th>8-9</th>
              <th>9-10</th>
              <th>10-11</th>
            </tr>
          </thead>
          <tbody>
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <tr key={day}>
                <td>{day}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Timetable;