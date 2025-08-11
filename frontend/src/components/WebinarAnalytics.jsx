import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Star, 
  Eye, 
  Heart, 
  MessageCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  TrendingDown,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';

const WebinarAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  const analyticsData = {
    overview: {
      totalSessions: 24,
      totalParticipants: 342,
      totalRevenue: 1250,
      averageRating: 4.7,
      totalHours: 48,
      completionRate: 89
    },
    sessions: [
      {
        id: 1,
        title: 'React Advanced Workshop',
        date: '2024-01-15',
        participants: 45,
        revenue: 225,
        rating: 4.8,
        duration: 2,
        status: 'completed'
      },
      {
        id: 2,
        title: 'UI/UX Design Principles',
        date: '2024-01-18',
        participants: 32,
        revenue: 160,
        rating: 4.6,
        duration: 1.5,
        status: 'completed'
      },
      {
        id: 3,
        title: 'Python Data Science',
        date: '2024-01-20',
        participants: 28,
        revenue: 140,
        rating: 4.9,
        duration: 3,
        status: 'upcoming'
      }
    ],
    trends: {
      participants: [45, 32, 28, 35, 42, 38, 41, 39],
      revenue: [225, 160, 140, 175, 210, 190, 205, 195],
      ratings: [4.8, 4.6, 4.9, 4.7, 4.8, 4.5, 4.9, 4.6]
    },
    categories: [
      { name: 'Programming', sessions: 12, participants: 180, revenue: 600 },
      { name: 'Design', sessions: 6, participants: 90, revenue: 300 },
      { name: 'Business', sessions: 4, participants: 60, revenue: 200 },
      { name: 'Language', sessions: 2, participants: 12, revenue: 150 }
    ]
  };

  const renderOverviewCards = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-3">
        <div className="card shadow-sm p-3 h-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalSessions}</p>
            </div>
            <div className="bg-primary bg-opacity-10 rounded-circle p-3">
              <Calendar className="text-primary" size={24} />
            </div>
          </div>
          <div className="d-flex align-items-center mt-2">
            <TrendingUp className="text-success" size={16} />
            <span className="text-sm text-success ml-1">+12% from last month</span>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm p-3 h-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-sm text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalParticipants}</p>
            </div>
            <div className="bg-success bg-opacity-10 rounded-circle p-3">
              <Users className="text-success" size={24} />
            </div>
          </div>
          <div className="d-flex align-items-center mt-2">
            <TrendingUp className="text-success" size={16} />
            <span className="text-sm text-success ml-1">+8% from last month</span>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm p-3 h-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analyticsData.overview.totalRevenue}</p>
            </div>
            <div className="bg-warning bg-opacity-10 rounded-circle p-3">
              <DollarSign className="text-warning" size={24} />
            </div>
          </div>
          <div className="d-flex align-items-center mt-2">
            <TrendingUp className="text-success" size={16} />
            <span className="text-sm text-success ml-1">+15% from last month</span>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm p-3 h-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.averageRating}</p>
            </div>
            <div className="bg-info bg-opacity-10 rounded-circle p-3">
              <Star className="text-info" size={24} />
            </div>
          </div>
          <div className="d-flex align-items-center mt-2">
            <TrendingUp className="text-success" size={16} />
            <span className="text-sm text-success ml-1">+0.2 from last month</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionsTable = () => (
    <div className="card shadow">
      <div className="card-header p-3 border-bottom">
        <h3 className="text-lg font-semibold">Recent Sessions</h3>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Session</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Participants</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Revenue</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyticsData.sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.duration}h session</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{session.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{session.participants}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">${session.revenue}</td>
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center">
                      <Star className="text-warning" size={14} />
                      <span className="text-sm text-gray-600 ml-1">{session.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'completed' 
                        ? 'badge bg-success' 
                        : 'badge bg-primary'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCategoryBreakdown = () => (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card shadow p-4 mb-4">
          <h3 className="text-lg font-semibold mb-4">Sessions by Category</h3>
          <div className="space-y-3">
            {analyticsData.categories.map((category) => (
              <div key={category.name} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mr-3"></div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="d-flex align-items-center space-x-4">
                  <span className="text-sm text-gray-600">{category.sessions} sessions</span>
                  <span className="text-sm text-gray-600">{category.participants} participants</span>
                  <span className="text-sm font-medium">${category.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card shadow p-4 mb-4">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="d-flex justify-content-between text-sm mb-1">
                <span>Completion Rate</span>
                <span>{analyticsData.overview.completionRate}%</span>
              </div>
              <div className="progress mb-1" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${analyticsData.overview.completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="d-flex justify-content-between text-sm mb-1">
                <span>Average Session Duration</span>
                <span>{analyticsData.overview.totalHours / analyticsData.overview.totalSessions}h</span>
              </div>
              <div className="progress mb-1" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-info" 
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="d-flex justify-content-between text-sm mb-1">
                <span>Participant Satisfaction</span>
                <span>{analyticsData.overview.averageRating}/5</span>
              </div>
              <div className="progress mb-1" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ width: `${(analyticsData.overview.averageRating / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrendsChart = () => (
    <div className="card shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Trends Over Time</h3>
      <div className="row g-3">
        <div className="col-md-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Participants</h4>
          <div className="d-flex align-items-end space-x-1 h-20">
            {analyticsData.trends.participants.map((value, index) => (
              <div 
                key={index}
                className="bg-primary rounded-top"
                style={{ 
                  height: `${(value / Math.max(...analyticsData.trends.participants)) * 100}%`,
                  width: '8px'
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="col-md-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Revenue</h4>
          <div className="d-flex align-items-end space-x-1 h-20">
            {analyticsData.trends.revenue.map((value, index) => (
              <div 
                key={index}
                className="bg-success rounded-top"
                style={{ 
                  height: `${(value / Math.max(...analyticsData.trends.revenue)) * 100}%`,
                  width: '8px'
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="col-md-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Ratings</h4>
          <div className="d-flex align-items-end space-x-1 h-20">
            {analyticsData.trends.ratings.map((value, index) => (
              <div 
                key={index}
                className="bg-warning rounded-top"
                style={{ 
                  height: `${(value / 5) * 100}%`,
                  width: '8px'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Webinar Analytics</h1>
        <p className="text-gray-600">Track your webinar performance and insights</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">View:</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">Overview</option>
            <option value="sessions">Sessions</option>
            <option value="trends">Trends</option>
            <option value="categories">Categories</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      {selectedMetric === 'overview' && (
        <>
          {renderOverviewCards()}
          {renderCategoryBreakdown()}
        </>
      )}

      {/* Sessions Table */}
      {selectedMetric === 'sessions' && renderSessionsTable()}

      {/* Trends Chart */}
      {selectedMetric === 'trends' && renderTrendsChart()}

      {/* Categories */}
      {selectedMetric === 'categories' && renderCategoryBreakdown()}

      {/* Quick Actions */}
      <div className="mt-8 row g-3">
        <div className="col-md-4">
          <div className="card shadow p-4 text-center">
            <Play className="mx-auto text-primary mb-2" size={24} />
            <h4 className="font-medium">Start New Session</h4>
            <p className="text-sm text-gray-600 mt-1">Create a new webinar session</p>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow p-4 text-center">
            <BarChart3 className="mx-auto text-success mb-2" size={24} />
            <h4 className="font-medium">Export Report</h4>
            <p className="text-sm text-gray-600 mt-1">Download detailed analytics</p>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow p-4 text-center">
            <Target className="mx-auto text-info mb-2" size={24} />
            <h4 className="font-medium">Set Goals</h4>
            <p className="text-sm text-gray-600 mt-1">Define performance targets</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarAnalytics; 