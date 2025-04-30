import React, { useState } from "react";


// Path to your profile image in the public folder
const profileImage = "./images/profile.jpg"; // Adjust this to match your image location

const DashboardHeader = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="dashboard-header">
      <div className="logo">
        <h2>Tutor Dashboard</h2>
      </div>
      <div className="profile-menu">
        {/* Use the image from the public folder */}
        <img
          src={profileImage}
          alt="Profile"
          onClick={() => setShowMenu(!showMenu)}
        />
        {showMenu && (
          <div className="dropdown-menu">
            <p>👤 Personal Information</p>
            <p>🔒 Privacy</p>
            <p>⚙️ Settings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
