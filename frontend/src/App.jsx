

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Menu from "./pages/Menu";
import Compose from "./pages/Compose";
import Sent from "./pages/Sent";
import Inbox from "./pages/Inbox";
import Logout from "./pages/Logout";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Unread from "./pages/Unread";
import Search from "./pages/Search";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/sent" element={<Sent />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/unread" element={<Unread />} />
        <Route path="/search" element={<Search />} />

        
      </Routes>
    </Router>
  );
}

export default App;


