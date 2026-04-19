import { useEffect, useState } from "react";
import API from "../services/api";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Notifications() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notes, setNotes] = useState([]);

  const audio = new Audio("/notification.mp3");

  const loadNotifications = async () => {
    const res = await API.get(`/notifications/${user.id}`);
    setNotes(res.data);
  };

  useEffect(() => {
    loadNotifications();

    // 🔴 join online tracking
    socket.emit("user-online", user.id);

    // 🔔 real-time notifications
    socket.on("new-notification", (data) => {
      if (!data.user_id || data.user_id === user.id) {
        setNotes((prev) => [data, ...prev]);

        // 🔊 play sound
        audio.play();
      }
    });

    return () => {
      socket.off("new-notification");
    };
  }, []);

  return (
    <div className="dropdown">
      <button className="btn btn-light btn-sm dropdown-toggle">
        🔔 {notes.length}
      </button>

      <div className="dropdown-menu show">
        {notes.map((n, i) => (
          <div key={i} className="dropdown-item">
            <b>{n.title}</b>
            <div style={{ fontSize: "12px" }}>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;