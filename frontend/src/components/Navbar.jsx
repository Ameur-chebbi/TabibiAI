import "./Navbar.css";
import { Bell, Search } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={20} />
        <input type="text" placeholder="Rechercher..." />
      </div>

      <div className="navbar-right">
        <button className="notification-button">
          <Bell size={20} />
        </button>

        <div className="doctor-profile">
          <div className="avatar">DA</div>

          <div>
            <strong>Docteur</strong>
            <span>Administrateur</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;