import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaClock, FaUser, FaExchangeAlt } from 'react-icons/fa';

const Calendar = ({ swaps = [], onAddEvent, onEditEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'swap_session'
  });

  // Get current month's calendar data
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || days.length < 42) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toDateString();
    return swaps.filter(swap => {
      if (swap.scheduledDate) {
        return new Date(swap.scheduledDate).toDateString() === dateStr;
      }
      return false;
    });
  };

  // Check if date is today
  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowEventModal(true);
    setEventForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'swap_session'
    });
  };

  // Handle form submission
  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (eventForm.title && eventForm.startTime) {
      const newEvent = {
        ...eventForm,
        date: selectedDate,
        id: Date.now().toString()
      };
      onAddEvent(newEvent);
      setShowEventModal(false);
      setEventForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'swap_session'
      });
    }
  };

  const days = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <div className="btn-group">
          <button className="btn btn-outline-primary btn-sm" onClick={prevMonth}>
            &lt;
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={nextMonth}>
            &gt;
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day headers */}
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-body">
          {days.map((date, index) => {
            const events = getEventsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonthDay ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                <div className="day-number">{date.getDate()}</div>
                {events.length > 0 && (
                  <div className="day-events">
                    {events.slice(0, 2).map((event, eventIndex) => (
                      <div key={eventIndex} className="event-indicator">
                        <FaExchangeAlt size={8} />
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="more-events">+{events.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Add Event for {selectedDate?.toLocaleDateString()}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowEventModal(false)}
              ></button>
            </div>
            <form onSubmit={handleSubmitEvent}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    placeholder="Swap session with..."
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    placeholder="Details about the session..."
                    rows="3"
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mt-4">
        <h5>Upcoming Events</h5>
        {swaps.filter(swap => swap.scheduledDate && new Date(swap.scheduledDate) >= new Date()).length === 0 ? (
          <p className="text-muted">No upcoming events scheduled.</p>
        ) : (
          <div className="upcoming-events">
            {swaps
              .filter(swap => swap.scheduledDate && new Date(swap.scheduledDate) >= new Date())
              .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
              .slice(0, 5)
              .map((swap, index) => (
                <div key={index} className="event-item">
                  <div className="event-date">
                    <FaCalendarAlt className="text-primary" />
                    <span>{new Date(swap.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="event-details">
                    <div className="event-title">Swap Session</div>
                    <div className="event-description">
                      {swap.requesterSkill?.name} ↔ {swap.recipientSkill?.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <style>{`
        .calendar-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .calendar-grid {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .calendar-day-header {
          padding: 10px;
          text-align: center;
          font-weight: 600;
          color: #495057;
        }

        .calendar-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 80px;
          padding: 8px;
          border-right: 1px solid #dee2e6;
          border-bottom: 1px solid #dee2e6;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }

        .calendar-day:hover {
          background-color: #f8f9fa;
        }

        .calendar-day.other-month {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .calendar-day.today {
          background-color: #e3f2fd;
          font-weight: bold;
        }

        .day-number {
          font-size: 14px;
          margin-bottom: 4px;
        }

        .day-events {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }

        .event-indicator {
          background: #007bff;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }

        .more-events {
          background: #6c757d;
          color: white;
          border-radius: 10px;
          padding: 1px 4px;
          font-size: 8px;
          line-height: 1;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 15px 20px;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .upcoming-events {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .event-item {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background: #f8f9fa;
        }

        .event-date {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-right: 15px;
          font-size: 14px;
          color: #6c757d;
        }

        .event-details {
          flex: 1;
        }

        .event-title {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .event-description {
          font-size: 14px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default Calendar; 