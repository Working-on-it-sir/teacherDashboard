import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const [tutor, setTutor] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [classStatistics, setClassStatistics] = useState(null);
  const [viewsStatistics, setViewsStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [videos, setVideos] = useState([]);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const tutorInfo = localStorage.getItem('tutorInfo');
    if (!tutorInfo) {
      navigate('/teacher/signin');
      return;
    }
    
    const parsedTutorInfo = JSON.parse(tutorInfo);
    setTutor(parsedTutorInfo);
    
    // Fetch teacher data
    // Note: In a real application, you would map the tutor ID to a teacher ID
    // For now, we'll fetch the first teacher in the database as an example
    fetchTeacherData();
  }, [navigate]);
  
  const fetchTeacherData = async () => {
    try {
      // Fetch teachers list to get first teacher
      const response = await fetch('http://localhost:5000/api/teachers');
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      
      const teachers = await response.json();
      if (teachers.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get first teacher's details
      const teacherId = teachers[0]._id;
      setTeacherData(teachers[0]);
      
      // Fetch class statistics
      const classStatsResponse = await fetch('http://localhost:5000/api/class-statistics');
      if (!classStatsResponse.ok) {
        throw new Error('Failed to fetch class statistics');
      }
      
      const classStats = await classStatsResponse.json();
      setClassStatistics(classStats);
      
      // Fetch views statistics
      const viewsStatsResponse = await fetch('http://localhost:5000/api/views-statistics');
      if (!viewsStatsResponse.ok) {
        throw new Error('Failed to fetch views statistics');
      }
      
      const viewsStats = await viewsStatsResponse.json();
      setViewsStatistics(viewsStats);
      
      // Fetch videos
      const videosResponse = await fetch(`http://localhost:5000/api/teachers/${teacherId}/videos`);
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const videosData = await videosResponse.json();
      setVideos(videosData.videos || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setLoading(false);
    }
  };
  
  const renderOverview = () => {
    if (!teacherData || !classStatistics || !viewsStatistics) {
      return <div>No teacher data available</div>;
    }
    
    // Find matching statistics for this teacher
    const classStats = classStatistics.find(stat => stat.teacherId === teacherData.teacherID) || {};
    const viewStats = viewsStatistics.find(stat => stat.teacherId === teacherData.teacherID) || {};
    
    return (
      <div className="overview-container">
        <div className="stats-cards">
          <div className="stats-card">
            <h3>Total Students</h3>
            <div className="stats-value">{classStats.classStatus?.totalStudents || 0}</div>
          </div>
          
          <div className="stats-card">
            <h3>Total Views</h3>
            <div className="stats-value">{teacherData.Totalviews || 0}</div>
          </div>
          
          <div className="stats-card">
            <h3>Conversion Rate</h3>
            <div className="stats-value">{classStats.classStatus?.conversionRate || '0%'}</div>
          </div>
          
          <div className="stats-card">
            <h3>Total Subjects</h3>
            <div className="stats-value">{teacherData.subjects?.length || 0}</div>
          </div>
        </div>
        
        <div className="teacher-details">
          <h2>Teacher Profile</h2>
          <div className="details-table">
            <div className="detail-row">
              <div className="detail-label">Name:</div>
              <div className="detail-value">{teacherData.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Role:</div>
              <div className="detail-value">{teacherData.role}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Teacher ID:</div>
              <div className="detail-value">{teacherData.teacherID}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Technologies:</div>
              <div className="detail-value">{teacherData.techUsed?.join(', ') || 'None'}</div>
            </div>
          </div>
        </div>
        
        <div className="subject-breakdown">
          <h2>Subject Breakdown</h2>
          <table className="subject-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Trial Students</th>
                <th>Paid Students</th>
                <th>Views</th>
                <th>Languages</th>
              </tr>
            </thead>
            <tbody>
              {teacherData.subjects?.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.subject}</td>
                  <td>{subject.TotalStudentsTrial || 0}</td>
                  <td>{subject.TotalStudentsPaid || 0}</td>
                  <td>{subject.views || 0}</td>
                  <td>{subject.language?.join(', ') || 'Not specified'}</td>
                </tr>
              )) || <tr><td colSpan="5">No subjects found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderClassStats = () => {
    if (!teacherData || !classStatistics) {
      return <div>No class statistics available</div>;
    }
    
    // Find matching statistics for this teacher
    const classStats = classStatistics.find(stat => stat.teacherId === teacherData.teacherID);
    if (!classStats) {
      return <div>No class statistics available for this teacher</div>;
    }
    
    return (
      <div className="class-stats-container">
        <h2>Class Statistics for {teacherData.name}</h2>
        
        <div className="stats-cards">
          <div className="stats-card">
            <h3>Total Students</h3>
            <div className="stats-value">{classStats.classStatus.totalStudents}</div>
          </div>
          
          <div className="stats-card">
            <h3>Trial Students</h3>
            <div className="stats-value">
              {classStats.classStatus.totalTrialStudents}
              <span className="percentage">({classStats.statistics.trialPercentage})</span>
            </div>
          </div>
          
          <div className="stats-card">
            <h3>Paid Students</h3>
            <div className="stats-value">
              {classStats.classStatus.totalPaidStudents}
              <span className="percentage">({classStats.statistics.paidPercentage})</span>
            </div>
          </div>
          
          <div className="stats-card">
            <h3>Conversion Rate</h3>
            <div className="stats-value">{classStats.classStatus.conversionRate}</div>
          </div>
        </div>
        
        <div className="stats-details">
          <h3>Student Statistics</h3>
          <div className="detail-row">
            <div className="detail-label">Average Students Per Subject:</div>
            <div className="detail-value">{classStats.statistics.avgStudentsPerSubject}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">Total Subjects:</div>
            <div className="detail-value">{classStats.totalSubjects}</div>
          </div>
        </div>
        
        <div className="technologies-box">
          <h3>Technologies Used</h3>
          <div className="tech-tags">
            {classStats.technologies?.map((tech, index) => (
              <span className="tech-tag" key={index}>{tech}</span>
            )) || <span>No technologies specified</span>}
          </div>
        </div>
      </div>
    );
  };
  
  const renderViewsStats = () => {
    if (!viewsStatistics || !teacherData) {
      return <div>No views statistics available</div>;
    }
    
    // Find matching statistics for this teacher
    const viewStats = viewsStatistics.find(stat => stat.teacherId === teacherData.teacherID);
    if (!viewStats) {
      return <div>No views statistics available for this teacher</div>;
    }
    
    return (
      <div className="views-stats-container">
        <h2>Views Statistics</h2>
        
        <div className="stats-cards">
          <div className="stats-card">
            <h3>Total Views</h3>
            <div className="stats-value">{viewStats.viewsData.totalViews}</div>
          </div>
        </div>
        
        <div className="subject-breakdown">
          <h3>Views by Subject</h3>
          <table className="subject-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Views</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {viewStats.viewsData.subjectBreakdown?.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.subject}</td>
                  <td>{subject.views}</td>
                  <td>{subject.percentage}</td>
                </tr>
              )) || <tr><td colSpan="3">No subjects found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderVideos = () => {
    if (!videos || videos.length === 0) {
      return <div>No videos available</div>;
    }
    
    return (
      <div className="videos-container">
        <h2>Teacher Videos</h2>
        
        <div className="videos-grid">
          {videos.map((video, index) => (
            <div className="video-card" key={index}>
              <h3>{video.videoDetails.title}</h3>
              <div className="video-details">
                <p><strong>Subject:</strong> {video.subject}</p>
                <p><strong>Duration:</strong> {Math.floor(video.videoDetails.duration / 60)} min {video.videoDetails.duration % 60} sec</p>
                <p><strong>Views:</strong> {video.videoDetails.views}</p>
                <p><strong>Format:</strong> {video.videoDetails.format}</p>
                <p><strong>Uploaded:</strong> {new Date(video.videoDetails.uploadDate).toLocaleDateString()}</p>
              </div>
              <div className="video-player">
                <video controls width="100%">
                  <source src={`http://localhost:5000${video.videoDetails.streamUrl}`} type={`video/${video.videoDetails.format}`} />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="teacher-dashboard">
      <DashboardHeader />
      
      <div className="dashboard-content">
        <h1>Teacher Dashboard</h1>
        <p className="welcome-text">Welcome, {tutor?.name || 'Teacher'}</p>
        
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'class-stats' ? 'active' : ''} 
            onClick={() => setActiveTab('class-stats')}
          >
            Class Statistics
          </button>
          <button 
            className={activeTab === 'views-stats' ? 'active' : ''} 
            onClick={() => setActiveTab('views-stats')}
          >
            Views Statistics
          </button>
          <button 
            className={activeTab === 'videos' ? 'active' : ''} 
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
          <button 
            className={activeTab === 'course-management' ? 'active' : ''} 
            onClick={() => navigate('/teacher/CourseManagement')}
          >
            Course Management
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'class-stats' && renderClassStats()}
          {activeTab === 'views-stats' && renderViewsStats()}
          {activeTab === 'videos' && renderVideos()}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;