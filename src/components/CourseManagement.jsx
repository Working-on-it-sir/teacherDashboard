import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../style/App.css"; 
import DashboardHeader from './DashboardHeader';

function CourseManagement() {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subjectName: '',
    experienceYears: '',
    description: '',
    language: '',
    video: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Add new state for editing
  const [editingSubject, setEditingSubject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const tutorInfo = localStorage.getItem('tutorInfo');
    if (!tutorInfo) {
      navigate('/teacher/signin');
      return;
    }
    
    // Parse the stored tutor info
    const parsedTutorInfo = JSON.parse(tutorInfo);
    setTutor(parsedTutorInfo);
    setLoading(false);
    
    // Fetch subjects for this tutor
    fetchSubjects(parsedTutorInfo._id);
  }, [navigate]);
  
  const fetchSubjects = async (tutorId) => {
    try {
      // First get the teacher data to find their subjects
      const teacherResponse = await fetch(`http://localhost:5000/api/teachers`);
      const teachers = await teacherResponse.json();
      
      if (!teacherResponse.ok) {
        console.error('Failed to fetch teacher data');
        return;
      }
      
      // For demonstration purposes, get the first teacher
      // In a real app, match the tutor ID to a teacher ID
      if (teachers && teachers.length > 0) {
        const teacherData = teachers[0];
        setSubjects(teacherData.subjects || []);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleMultipleLanguages = (e) => {
    // Split comma-separated languages into an array
    const languagesArray = e.target.value.split(',').map(lang => lang.trim());
    setFormData({ ...formData, language: languagesArray });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // If we're editing, use update logic instead
      if (editingSubject) {
        return handleUpdateSubject(e);
      }
      
      if (!formData.video) {
        setError('Please upload a video for this subject');
        return;
      }
      
      const subjectData = new FormData();
      if (tutor) {
        subjectData.append('tutorId', tutor._id);
        subjectData.append('subjectName', formData.subjectName);
        subjectData.append('experienceYears', formData.experienceYears);
        subjectData.append('description', formData.description);
        
        // Handle language as an array
        if (Array.isArray(formData.language)) {
          formData.language.forEach(lang => {
            subjectData.append('language', lang);
          });
        } else {
          subjectData.append('language', formData.language);
        }
        
        subjectData.append('video', formData.video);
      }
      
      const response = await fetch('http://localhost:5000/api/subjects/add', {
        method: 'POST',
        body: subjectData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add subject');
      }
      
      setSuccess('Subject added successfully!');
      
      // Reset form
      resetForm();
      
      // Refresh subjects
      fetchSubjects(tutor._id);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      console.error('Error:', err);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFormData({
      subjectName: '',
      experienceYears: '',
      description: '',
      language: '',
      video: null
    });
    setEditingSubject(null);
  };
  
  // Handle edit button click
  const handleEditClick = (subject, index) => {
    setEditingSubject({...subject, index});
    setFormData({
      subjectName: subject.subject,
      experienceYears: '', // This field isn't in the subject model
      description: subject.description || '',
      language: Array.isArray(subject.language) ? subject.language.join(', ') : subject.language,
      video: null // We can't populate the file input, but we'll handle this conditionally
    });
    
    // Scroll to the form
    document.querySelector('.add-course').scrollIntoView({ behavior: 'smooth' });
  };
  
  // Update a subject
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (!tutor) {
        throw new Error('Tutor information not found');
      }
      
      const subjectData = new FormData();
      subjectData.append('subjectName', formData.subjectName);
      subjectData.append('description', formData.description);
      
      // Handle language as an array
      if (Array.isArray(formData.language)) {
        formData.language.forEach(lang => {
          subjectData.append('language', lang);
        });
      } else {
        const languagesArray = formData.language.split(',').map(lang => lang.trim());
        languagesArray.forEach(lang => {
          subjectData.append('language', lang);
        });
      }
      
      // Only append video if a new one is selected
      if (formData.video) {
        subjectData.append('video', formData.video);
      }
      
      // Get the subject ID and teacher ID
      const teacherResponse = await fetch(`http://localhost:5000/api/teachers`);
      const teachers = await teacherResponse.json();
      
      if (!teacherResponse.ok || !teachers || teachers.length === 0) {
        throw new Error('Failed to get teacher data');
      }
      
      const teacherId = teachers[0]._id;
      const subjectIndex = editingSubject.index;
      
      const response = await fetch(`http://localhost:5000/api/subjects/update/${teacherId}/${subjectIndex}`, {
        method: 'PUT',
        body: subjectData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update subject');
      }
      
      setSuccess('Subject updated successfully!');
      
      // Reset form
      resetForm();
      
      // Refresh subjects
      fetchSubjects(tutor._id);
    } catch (err) {
      setError(err.message || 'Something went wrong with update');
      console.error('Error updating subject:', err);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (subject, index) => {
    setSubjectToDelete({...subject, index});
    setShowDeleteModal(true);
  };
  
  // Handle subject deletion
  const handleDeleteSubject = async () => {
    try {
      if (!subjectToDelete || subjectToDelete.index === undefined) {
        throw new Error('Invalid subject selected for deletion');
      }
      
      // Get the teacher ID
      const teacherResponse = await fetch(`http://localhost:5000/api/teachers`);
      const teachers = await teacherResponse.json();
      
      if (!teacherResponse.ok || !teachers || teachers.length === 0) {
        throw new Error('Failed to get teacher data');
      }
      
      const teacherId = teachers[0]._id;
      const subjectIndex = subjectToDelete.index;
      
      // Log the request details for debugging
      console.log(`Attempting to delete subject at index ${subjectIndex} for teacher ${teacherId}`);
      
      const response = await fetch(`http://localhost:5000/api/subjects/delete/${teacherId}/${subjectIndex}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Log the response for debugging
      console.log('Delete response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (e) {
        console.log('Response is not JSON, possibly empty');
      }
      
      if (!response.ok) {
        throw new Error((data && data.message) || 'Failed to delete subject');
      }
      
      setSuccess('Subject deleted successfully!');
      
      // Update the UI
      setSubjects(prevSubjects => {
        const newSubjects = [...prevSubjects];
        newSubjects.splice(subjectIndex, 1);
        return newSubjects;
      });
      
      // Close modal
      setShowDeleteModal(false);
      setSubjectToDelete(null);
    } catch (err) {
      setError(err.message || 'Something went wrong with deletion');
      console.error('Error deleting subject:', err);
      setShowDeleteModal(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    resetForm();
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="teacher-dashboard">
      <DashboardHeader />
      
      <div className="dashboard-content">
        <h1>Subject Management</h1>
        <p className="welcome-text">Welcome, {tutor.name}</p>
        
        {/* Dashboard Tabs for Navigation */}
        <div className="dashboard-tabs">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Overview
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Class Statistics
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Views Statistics
          </button>
          <button 
            onClick={() => navigate('/teacher/dashboard')}
          >
            Videos
          </button>
          <button 
            className="active"
            onClick={() => navigate('/teacher/CourseManagement')}
          >
            Subject Management
          </button>
        </div>
      
        <div className="content-area">
          <section className="add-course">
            <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="subjectName">Subject Name</label>
                <input
                  type="text"
                  id="subjectName"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, Physics, Computer Science"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="experienceYears">Years of Experience</label>
                <select
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Years of Experience</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Subject Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe what students will learn in this subject"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="language">Languages (comma-separated)</label>
                <input
                  type="text"
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="e.g., English, Hindi, Tamil"
                  required
                />
                <small>Enter languages separated by commas (e.g., English, Hindi)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="video">
                  {editingSubject ? 'Subject Video (Leave empty to keep current video)' : 'Subject Video'}
                </label>
                <input
                  type="file"
                  id="video"
                  name="video"
                  onChange={handleChange}
                  accept="video/*"
                  required={!editingSubject}
                />
                <small>Upload a video file for your subject. Maximum size: 100MB</small>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
                
                {editingSubject && (
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
          
          <section className="course-list">
            <h2>Your Subjects</h2>
            {subjects.length === 0 ? (
              <p>You haven't added any subjects yet.</p>
            ) : (
              <div className="courses-grid">
                {subjects.map((subject, index) => (
                  <div key={index} className="course-card">
                    <h3>{subject.subject}</h3>
                    <div className="subject-details">
                      <p><strong>Languages:</strong> {Array.isArray(subject.language) ? subject.language.join(', ') : subject.language}</p>
                      <p><strong>Trial Students:</strong> {subject.TotalStudentsTrial || 0}</p>
                      <p><strong>Paid Students:</strong> {subject.TotalStudentsPaid || 0}</p>
                      <p><strong>Views:</strong> {subject.views || 0}</p>
                    </div>
                    
                    {subject.videos && subject.videos.length > 0 && (
                      <div className="video-list">
                        <h4>Videos:</h4>
                        {subject.videos.map((video, vidIndex) => (
                          <div key={vidIndex} className="video-item">
                            <h5>{video.title}</h5>
                            <video controls width="100%">
                              <source 
                                src={`http://localhost:5000/api/stream-video/${encodeURIComponent(video.path)}`} 
                                type={`video/${video.format}`} 
                              />
                              Your browser does not support the video tag.
                            </video>
                            <div className="video-details">
                              <p><strong>Duration:</strong> {Math.floor(video.duration / 60)} min {video.duration % 60} sec</p>
                              <p><strong>Views:</strong> {video.views || 0}</p>
                              <p><strong>Format:</strong> {video.format}</p>
                              <p><strong>Uploaded:</strong> {new Date(video.uploadDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="course-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEditClick(subject, index)}
                      >
                        Edit Subject
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(subject, index)}
                      >
                        Delete Subject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete the subject "{subjectToDelete?.subject}"?</p>
              <p className="warning">This action cannot be undone. All videos associated with this subject will also be deleted.</p>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-btn" 
                  onClick={handleDeleteSubject}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseManagement;
