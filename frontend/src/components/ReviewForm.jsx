import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import ReviewService from '../services/reviewService';
import { useAuth } from '../context/AuthContext';

const ReviewForm = ({ reviewedUser, onReviewSubmitted, onCancel, context = 'general', swapId = null }) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('overall');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'overall', label: 'Overall Experience' },
    { value: 'teaching', label: 'Teaching Quality' },
    { value: 'learning', label: 'Learning Ability' },
    { value: 'communication', label: 'Communication Skills' },
    { value: 'knowledge', label: 'Knowledge Level' },
    { value: 'helpfulness', label: 'Helpfulness' },
    { value: 'professionalism', label: 'Professionalism' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const reviewData = {
        reviewedId: reviewedUser._id,
        rating,
        category,
        comment: comment.trim(),
        context
      };

      // Add swapId if provided and context is swap
      if (context === 'swap' && swapId) {
        reviewData.swapId = swapId;
      }

      await ReviewService.createReview(token, reviewData);
      
      setRating(0);
      setCategory('overall');
      setComment('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      setError(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Review {reviewedUser.firstName} {reviewedUser.lastName}</h6>
        <button type="button" className="btn-close" onClick={onCancel}></button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <div className="mb-3">
            <label className="form-label">Review Category *</label>
            <select 
              className="form-select" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Rating *</label>
            <div className="d-flex align-items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`${star <= rating ? 'text-warning' : 'text-muted'}`}
                  style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                  onClick={() => handleStarClick(star)}
                />
              ))}
              <span className="ms-2 text-muted">
                {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate'}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Comment *</label>
            <textarea
              className="form-control"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this user..."
              required
              minLength="10"
              maxLength="500"
            ></textarea>
            <div className="form-text">
              {comment.length}/500 characters (minimum 10)
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || rating === 0 || comment.trim().length < 10}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm; 