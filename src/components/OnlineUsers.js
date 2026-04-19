import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function OnlineUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on("online-users", (data) => {
      setUsers(data);
    });

    return () => socket.off("online-users");
  }, []);

  return (
    <div className="card p-2 mb-3">
      <h6>🟢 Online Users</h6>

      {users.length === 0 ? (
        <small>No users online</small>
      ) : (
        users.map((id, i) => (
          <div key={i} style={{ fontSize: "12px" }}>
            👤 User {id}
          </div>
        ))
      )}
    </div>
  );
}

export default OnlineUsers;