import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareText,
  CalendarDays,
  Users,
  Bot,
  Settings,
  Stethoscope,
  LogOut,
} from "lucide-react";

import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Stethoscope size={25} />
        </div>

        <div className="sidebar-brand-text">
          <h2>Tabibi</h2>
          <p>Smart Medical Assistant</p>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <LayoutDashboard size={20} />
          <span>Tableau de bord</span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <MessageSquareText size={20} />
          <span>Messages</span>
        </NavLink>

        <NavLink
          to="/rendez-vous"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <CalendarDays size={20} />
          <span>Rendez-vous</span>
        </NavLink>

        <NavLink
          to="/patients"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Users size={20} />
          <span>Patients</span>
        </NavLink>

        <NavLink
          to="/reponses-ia"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Bot size={20} />
          <span>Messages automatiques</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/parametres"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          <Settings size={20} />
          <span>Paramètres</span>
        </NavLink>

        <button className="sidebar-item sidebar-logout" type="button">
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
        
      </div>
    </aside>
  );
}

export default Sidebar;