import React from 'react';

const SubjectCard = ({ subject, onView, onTrialRegister, onNormalRegister }) => {
  return (
    <div className="subject-card" style={{ display: "flex", justifyContent: "space-between" }}>
      <div style={{ flex: 1 }}>
        <h3>
          {subject.name} 
          {subject.language && (
            <span style={{ fontSize: "0.85em", color: "#666", marginLeft: "10px" }}>
              ({typeof subject.language === 'string' ? subject.language : subject.language.join(', ')})
            </span>
          )}
        </h3>
        <p>🗣 Language: {typeof subject.language === 'string' ? subject.language : subject.language?.join(', ') || 'Not specified'}</p>
        <p>👁 Views: {subject.views || 0}</p>
        <p>🧪 Trial Registrations: {subject.trialRegistrations || 0}</p>
        <p>📘 Normal Registrations: {subject.normalRegistrations || 0}</p>

        <button onClick={onView}>👁 View</button>
        <button onClick={onTrialRegister}>🧪 Trial</button>
        <button onClick={onNormalRegister}>✅ Register</button>
      </div>

      {subject.videoUrl && (
        <video
          src={`http://localhost:5000/${subject.videoUrl}`}
          controls
          width="200"
          height="120"
          style={{ marginLeft: "20px", borderRadius: "8px" }}
        />
      )}
    </div>
  );
};

export default SubjectCard;
