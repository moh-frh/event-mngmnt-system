import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const fetchEvents = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`/api/events?${params}`);
      setEvents(response.data.events);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
      return { events: [], pagination: { total: 0, pages: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventById = useCallback(async (id) => {
    try {
      const response = await axios.get(`/api/events/${id}`);
      setCurrentEvent(response.data.event);
      return response.data.event;
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to fetch event details');
      return null;
    }
  }, []);

  const createEvent = useCallback(async (eventData) => {
    try {
      const response = await axios.post('/api/events', eventData);
      const newEvent = response.data.event;
      
      setEvents(prev => [newEvent, ...prev]);
      toast.success('Event created successfully!');
      return { success: true, event: newEvent };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create event';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateEvent = useCallback(async (id, eventData) => {
    try {
      const response = await axios.put(`/api/events/${id}`, eventData);
      const updatedEvent = response.data.event;
      
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      
      if (currentEvent?.id === id) {
        setCurrentEvent(updatedEvent);
      }
      
      toast.success('Event updated successfully!');
      return { success: true, event: updatedEvent };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update event';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentEvent]);

  const deleteEvent = useCallback(async (id) => {
    try {
      await axios.delete(`/api/events/${id}`);
      
      setEvents(prev => prev.filter(event => event.id !== id));
      if (currentEvent?.id === id) {
        setCurrentEvent(null);
      }
      
      toast.success('Event deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete event';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [currentEvent]);

  const getEventStats = useCallback(async (id) => {
    try {
      const response = await axios.get(`/api/events/${id}/stats`);
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return null;
    }
  }, []);

  const clearCurrentEvent = useCallback(() => {
    setCurrentEvent(null);
  }, []);

  const value = {
    events,
    loading,
    currentEvent,
    fetchEvents,
    fetchEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventStats,
    clearCurrentEvent,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

