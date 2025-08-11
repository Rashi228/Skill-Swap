import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Star, 
  Play, 
  Eye, 
  Heart,
  Share2,
  Bookmark,
  MapPin,
  Video,
  Mic,
  Award,
  TrendingUp,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  DollarSign as DollarSignIcon,
  Star as StarIcon
} from 'lucide-react';

const WebinarDiscovery = ({ onJoinSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [priceFilter, setPriceFilter] = useState('all');

  const [webinars, setWebinars] = useState([
    {
      id: 1,
      title: 'React Advanced Workshop',
      description: 'Learn advanced React concepts including hooks, context, and performance optimization',
      host: 'John Doe',
      hostRating: 4.8,
      hostReviews: 156,
      date: '2024-01-15',
      time: '14:00',
      duration: '2 hours',
      maxParticipants: 50,
      currentParticipants: 12,
      price: 25,
      currency: 'USD',
      category: 'Programming',
      tags: ['react', 'javascript', 'frontend'],
      isLive: false,
      isUpcoming: true,
      thumbnail: '/thumbnails/react-workshop.jpg',
      level: 'Intermediate',
      language: 'English',
      isBookmarked: false,
      isLiked: false
    },
    {
      id: 2,
      title: 'UI/UX Design Principles',
      description: 'Master the fundamentals of user interface and user experience design',
      host: 'Sarah Wilson',
      hostRating: 4.9,
      hostReviews: 89,
      date: '2024-01-18',
      time: '10:00',
      duration: '1.5 hours',
      maxParticipants: 30,
      currentParticipants: 8,
      price: 20,
      currency: 'USD',
      category: 'Design',
      tags: ['ui', 'ux', 'design'],
      isLive: false,
      isUpcoming: true,
      thumbnail: '/thumbnails/design-workshop.jpg',
      level: 'Beginner',
      language: 'English',
      isBookmarked: true,
      isLiked: false
    },
    {
      id: 3,
      title: 'Python Data Science',
      description: 'Introduction to data science with Python, pandas, and matplotlib',
      host: 'Mike Johnson',
      hostRating: 4.7,
      hostReviews: 203,
      date: '2024-01-12',
      time: '16:00',
      duration: '3 hours',
      maxParticipants: 40,
      currentParticipants: 25,
      price: 35,
      currency: 'USD',
      category: 'Programming',
      tags: ['python', 'data-science', 'pandas'],
      isLive: false,
      isUpcoming: true,
      thumbnail: '/thumbnails/python-workshop.jpg',
      level: 'Advanced',
      language: 'English',
      isBookmarked: false,
      isLiked: true
    },
    {
      id: 4,
      title: 'Live: Spanish Conversation',
      description: 'Practice Spanish conversation with native speakers in a relaxed environment',
      host: 'Maria Garcia',
      hostRating: 4.6,
      hostReviews: 67,
      date: '2024-01-14',
      time: '15:00',
      duration: '1 hour',
      maxParticipants: 20,
      currentParticipants: 15,
      price: 15,
      currency: 'USD',
      category: 'Language',
      tags: ['spanish', 'conversation', 'language'],
      isLive: true,
      isUpcoming: false,
      thumbnail: '/thumbnails/spanish-workshop.jpg',
      level: 'All Levels',
      language: 'Spanish',
      isBookmarked: false,
      isLiked: false
    },
    {
      id: 5,
      title: 'Guitar Basics for Beginners',
      description: 'Learn the fundamentals of guitar playing from basic chords to simple songs',
      host: 'Alex Thompson',
      hostRating: 4.5,
      hostReviews: 124,
      date: '2024-01-20',
      time: '19:00',
      duration: '1.5 hours',
      maxParticipants: 25,
      currentParticipants: 5,
      price: 18,
      currency: 'USD',
      category: 'Music',
      tags: ['guitar', 'music', 'beginner'],
      isLive: false,
      isUpcoming: true,
      thumbnail: '/thumbnails/guitar-workshop.jpg',
      level: 'Beginner',
      language: 'English',
      isBookmarked: false,
      isLiked: false
    },
    {
      id: 6,
      title: 'Digital Marketing Strategy',
      description: 'Develop comprehensive digital marketing strategies for your business',
      host: 'Emma Davis',
      hostRating: 4.8,
      hostReviews: 178,
      date: '2024-01-16',
      time: '11:00',
      duration: '2.5 hours',
      maxParticipants: 35,
      currentParticipants: 18,
      price: 30,
      currency: 'USD',
      category: 'Business',
      tags: ['marketing', 'digital', 'strategy'],
      isLive: false,
      isUpcoming: true,
      thumbnail: '/thumbnails/marketing-workshop.jpg',
      level: 'Intermediate',
      language: 'English',
      isBookmarked: true,
      isLiked: false
    }
  ]);

  // Load webinars from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('webinarDiscoveryWebinars');
    if (saved) setWebinars(JSON.parse(saved));
  }, []);
  // Save webinars to localStorage on change
  useEffect(() => {
    localStorage.setItem('webinarDiscoveryWebinars', JSON.stringify(webinars));
  }, [webinars]);

  // Toast state
  const [toastMsg, setToastMsg] = useState("");

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🎯' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'language', name: 'Language', icon: '🗣️' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' },
    { id: 'fitness', name: 'Fitness', icon: '💪' }
  ];

  // Like button
  const handleLike = (webinarId) => {
    setWebinars(webinars.map(webinar => 
      webinar.id === webinarId 
        ? { ...webinar, isLiked: !webinar.isLiked }
        : webinar
    ));
  };

  // Bookmark button
  const handleBookmark = (webinarId) => {
    setWebinars(webinars.map(webinar => 
      webinar.id === webinarId 
        ? { ...webinar, isBookmarked: !webinar.isBookmarked }
        : webinar
    ));
  };

  // Join button
  const handleJoin = (webinar) => {
    setToastMsg(`Joined webinar: ${webinar.title}`);
    setTimeout(() => setToastMsg("") , 2000);
    if (onJoinSession) onJoinSession(webinar);
  };

  // Share button
  const handleShare = (webinar) => {
    const url = `${window.location.origin}/webinar/${webinar.id}`;
    navigator.clipboard.writeText(url);
    setToastMsg("Webinar link copied to clipboard!");
    setTimeout(() => setToastMsg("") , 2000);
  };

  const filteredWebinars = webinars.filter(webinar => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.host.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           webinar.category.toLowerCase() === selectedCategory;
    
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && webinar.price === 0) ||
                        (priceFilter === 'paid' && webinar.price > 0);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedWebinars = [...filteredWebinars].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.currentParticipants - a.currentParticipants;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'rating':
        return b.hostRating - a.hostRating;
      default:
        return 0;
    }
  });

  const renderWebinarCard = (webinar) => (
    <div key={webinar.id} className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="position-relative bg-light" style={{height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Video size={48} className="text-secondary" />
          {webinar.isLive && (
            <span className="badge bg-danger position-absolute top-0 start-0 m-2">LIVE</span>
          )}
          <span className={`badge position-absolute top-0 end-0 m-2 ${
            webinar.level === 'Beginner' ? 'bg-success' :
            webinar.level === 'Intermediate' ? 'bg-warning text-dark' :
            'bg-danger'
          }`}>
            {webinar.level}
          </span>
        </div>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-truncate">{webinar.title}</h5>
          <p className="card-text text-muted small" style={{minHeight: '48px'}}>{webinar.description}</p>
          <div className="d-flex align-items-center mb-2">
            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
              <span>{webinar.host.charAt(0)}</span>
            </div>
            <div>
              <span className="fw-semibold">{webinar.host}</span>
              <span className="ms-2 text-warning small"><Star size={14} /> {webinar.hostRating} ({webinar.hostReviews})</span>
            </div>
          </div>
          <ul className="list-inline mb-2">
            <li className="list-inline-item"><CalendarIcon size={14} className="me-1" />{webinar.date}</li>
            <li className="list-inline-item"><ClockIcon size={14} className="me-1" />{webinar.time}</li>
            <li className="list-inline-item"><UsersIcon size={14} className="me-1" />{webinar.currentParticipants}/{webinar.maxParticipants}</li>
          </ul>
          <div className="mb-2">
            {webinar.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="badge bg-light text-secondary me-1">{tag}</span>
            ))}
          </div>
          <div className="d-flex justify-content-between align-items-center mt-auto">
            <span className="fw-bold fs-5">{webinar.price > 0 ? `${webinar.currency} ${webinar.price}` : 'Free'}</span>
            <div>
              <button className={`btn btn-sm ${webinar.isBookmarked ? 'btn-primary' : 'btn-outline-primary'} me-1`} onClick={() => handleBookmark(webinar.id)} title="Bookmark"><Bookmark size={16} /></button>
              <button className={`btn btn-sm ${webinar.isLiked ? 'btn-danger' : 'btn-outline-danger'} me-1`} onClick={() => handleLike(webinar.id)} title="Like"><Heart size={16} /></button>
              <button className="btn btn-sm btn-outline-secondary me-1" title="Share" onClick={() => handleShare(webinar)}><Share2 size={16} /></button>
              <button className="btn btn-sm btn-success" onClick={() => handleJoin(webinar)}>
                {webinar.isLive ? <Play size={16} /> : <Eye size={16} />} {webinar.isLive ? 'Join Live' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold">Discover Webinars</h2>
        <p className="text-muted">Find and join amazing skill-sharing sessions</p>
      </div>
      <div className="row mb-4 g-2 align-items-end">
        <div className="col-md-4 mb-2 mb-md-0">
          <div className="input-group">
            <span className="input-group-text"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search webinars, hosts, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3 mb-2 mb-md-0">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2 mb-2 mb-md-0">
          <select
            className="form-select"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="date">Date</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>
      <div className="row">
        {sortedWebinars.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            <h5>No webinars found.</h5>
          </div>
        ) : (
          sortedWebinars.map(renderWebinarCard)
        )}
      </div>
      {toastMsg && (
        <div style={{position: 'fixed', bottom: 80, right: 30, zIndex: 2000}} className="alert alert-info shadow">
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default WebinarDiscovery; 