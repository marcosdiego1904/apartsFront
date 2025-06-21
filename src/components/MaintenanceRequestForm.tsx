import React, { useState, useEffect } from 'react';
import '../styles/MaintenanceRequestForm.css'; // Import the new CSS file
import { useAuth } from '../context/AuthContext';
import { submitRequest, submitRating } from '../services/maintenanceService';
import type { MaintenanceRequestDisplayItem } from '../services/MockBackendService';

interface FormData {
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'appliance' | 'general' | '';
  urgency: 'low' | 'medium' | 'high' | '';
  permissionToEnter: 'yes' | 'no' | '';
  contactMethod: 'email' | 'phone' | '';
  // photo?: File; // For actual file handling later
}

interface MaintenanceRequestFormProps {
  onFormSubmit: () => void;
  requests: MaintenanceRequestDisplayItem[]; // Receive requests from parent
}

const MaintenanceRequestForm: React.FC<MaintenanceRequestFormProps> = ({ onFormSubmit, requests }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    urgency: '',
    permissionToEnter: '',
    contactMethod: '',
  });

  const [existingRequests, setExistingRequests] = useState<MaintenanceRequestDisplayItem[]>(requests);
  const [isLoading, setIsLoading] = useState(false); // For async operations

  useEffect(() => {
    setExistingRequests(requests);
  }, [requests]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 2; // You can adjust this value as needed

  // Calculate paginated requests
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = existingRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(existingRequests.length / requestsPerPage);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // State for rating UI - visual only, not persisted yet
  const [draftRatings, setDraftRatings] = useState<{ [key: string]: number }>({});
  const [draftComments, setDraftComments] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to submit a request.');
      return;
    }
    
    setIsLoading(true);
    
    const newRequestItem: MaintenanceRequestDisplayItem = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      title: formData.title,
      category: formData.category as MaintenanceRequestDisplayItem['category'],
      dateSubmitted: new Date().toISOString(),
      status: 'sent',
      description: formData.description,
      urgency: formData.urgency as MaintenanceRequestDisplayItem['urgency'],
      isRatingSubmitted: false,
      tenantId: user.id,
    };

    try {
      await submitRequest(newRequestItem);
      onFormSubmit(); // Callback to refresh dashboard data
      setCurrentPage(1);
      alert('Maintenance request submitted.');
      setFormData({ title: '', description: '', category: '', urgency: '', permissionToEnter: '', contactMethod: '' });
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      alert("There was an error submitting the request.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to get status class for styling
  const getStatusClass = (status: MaintenanceRequestDisplayItem['status']) => {
    switch (status) {
      case 'sent': return 'status-badge-sent';
      case 'in-progress': return 'status-badge-in-progress';
      case 'completed': return 'status-badge-completed';
      case 'cancelled': return 'status-badge-cancelled';
      default: return '';
    }
  };

  const handleRatingChange = (requestId: string, rating: number) => {
    setDraftRatings(prev => ({ ...prev, [requestId]: rating }));
  };

  const handleCommentChange = (requestId: string, comment: string) => {
    setDraftComments(prev => ({ ...prev, [requestId]: comment }));
  };

  const handleSubmitRating = async (requestId: string) => {
    const ratingValue = draftRatings[requestId];
    const commentValue = draftComments[requestId] || '';
    
    if (!ratingValue) {
      alert("Please select a rating before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      await submitRating({ requestId, rating: ratingValue, comment: commentValue });
      
      // Update local state for immediate UI feedback without a full refresh
      setExistingRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, tenantRating: ratingValue, tenantComment: commentValue, isRatingSubmitted: true } 
            : req
        )
      );
      // Optionally, call onFormSubmit() if a full refresh is desired
      // onFormSubmit();
      alert("Rating submitted successfully.");

    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("There was an error submitting the rating.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <div className="loading-overlay">Processing...</div>}
      <div className="maintenance-form-container">
        <form onSubmit={handleSubmit} className="maintenance-form">
          <h2 className="maintenance-form-title">
            📝 New Maintenance Request
          </h2>

          <div className="form-group">
            <label htmlFor="title" className="form-label">Subject / Brief Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g.: Kitchen faucet is dripping"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">Problem Category:</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Select a category...</option>
              <option value="plumbing">Plumbing (Water, Drains)</option>
              <option value="electrical">Electrical (Lights, Outlets)</option>
              <option value="appliance">Appliances (Fridge, Stove, AC)</option>
              <option value="general">General (Doors, Windows, Other)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description" className="form-label">Detailed Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Please describe the problem in as much detail as possible..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="urgency" className="form-label">Urgency Level:</label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="" disabled>Select urgency...</option>
              <option value="low">Low (Not urgent, can wait a few days)</option>
              <option value="medium">Medium (Important, but not an emergency)</option>
              <option value="high">High (Urgent, requires prompt attention)</option>
            </select>
          </div>
          
          <fieldset className="fieldset-container">
              <legend className="fieldset-legend">Permission to Enter:</legend>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="permissionToEnter" value="yes" checked={formData.permissionToEnter === 'yes'} onChange={handleChange} className="radio-input" required/>
                  Yes, you can enter if I'm not there.
                </label>
                <label className="radio-label">
                  <input type="radio" name="permissionToEnter" value="no" checked={formData.permissionToEnter === 'no'} onChange={handleChange} className="radio-input" />
                  No, I prefer to be present.
                </label>
              </div>
          </fieldset>

          <fieldset className="fieldset-container">
              <legend className="fieldset-legend">Preferred Contact Method:</legend>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="contactMethod" value="email" checked={formData.contactMethod === 'email'} onChange={handleChange} className="radio-input" required />
                  Email
                </label>
                <label className="radio-label">
                  <input type="radio" name="contactMethod" value="phone" checked={formData.contactMethod === 'phone'} onChange={handleChange} className="radio-input" />
                  Phone
                </label>
              </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="photo" className="form-label">Attach Photo (Optional):</label>
            <input
              type="file"
              id="photo"
              name="photo"
              // onChange={handleFileChange} // Uncomment when file handling is implemented
              className="form-input" // Uses general form-input, specific style for type=file added in CSS
              accept="image/*"
            />
             <small className="file-input-description">
               Upload a photo of the problem if it helps to describe it better.
             </small>
          </div>

          <button type="submit" className="submit-button">
            Submit Maintenance Request
          </button>
        </form>
      </div>

      {/* Section for Existing Requests */}
      <div className="request-list-section">
        <h2 className="request-list-title">📋 My Previous Requests</h2>
        {existingRequests.length > 0 ? (
          <>
            <div className="request-list">
              {currentRequests.map(req => (
                <div key={req.id} className="request-item-card">
                  <div className="request-item-header">
                    <h3 className="request-item-title">{req.title}</h3>
                    <span className={`request-item-status ${getStatusClass(req.status)}`}>{req.status.replace('-', ' ')}</span>
                  </div>
                  <div className="request-item-body">
                    <p><strong>Category:</strong> {req.category}</p>
                    <p><strong>Urgency:</strong> {req.urgency}</p>
                    <p><strong>Submitted:</strong> {new Date(req.dateSubmitted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="request-item-description"><strong>Description:</strong> {req.description}</p>
                  </div>

                  {req.status === 'completed' && !req.isRatingSubmitted && (
                    <div className="request-rating-area">
                      <h4 className="rating-area-title">Rate this service:</h4>
                      <div className="star-rating-input">
                        {[1, 2, 3, 4, 5].map(starValue => (
                          <button
                            key={starValue}
                            type="button"
                            className={`star-btn ${starValue <= (draftRatings[req.id] || 0) ? 'selected' : ''}`}
                            onClick={() => handleRatingChange(req.id, starValue)}
                            aria-label={`Rate ${starValue} stars`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="rating-comment-input"
                        placeholder="Leave an optional comment about the service..."
                        value={draftComments[req.id] || ''}
                        onChange={(e) => handleCommentChange(req.id, e.target.value)}
                        rows={3}
                        maxLength={250}
                      />
                      <button
                        type="button"
                        className="submit-rating-button"
                        onClick={() => handleSubmitRating(req.id)}
                        disabled={!draftRatings[req.id] || draftRatings[req.id] === 0}
                      >
                        Submit Rating
                      </button>
                    </div>
                  )}

                  {req.isRatingSubmitted && (
                    <div className="rating-submitted-message">
                      <p>Thanks for your feedback!</p>
                      {req.tenantRating && <p><strong>Your rating:</strong> {req.tenantRating} ★</p>}
                      {req.tenantComment && <p><strong>Your comment:</strong> {req.tenantComment}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-requests-message">You have no previous maintenance requests.</p>
        )}
      </div>
    </>
  );
};

export default MaintenanceRequestForm; 