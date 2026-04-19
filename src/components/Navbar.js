import { Link } from "react-router-dom";
import Notifications from "./Notifications";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <nav >  
    </nav>
  );
}

export default Navbar;