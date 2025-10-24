
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// FIX: Add type definitions for data models to ensure type safety throughout the application.
interface User {
  id: number;
  username: string;
  password?: string; // Optional because we remove it for client-side state
  role: 'Admin' | 'Student' | 'Faculty';
  name: string;
}

// FIX: Renamed Event to AppEvent to avoid conflict with the built-in DOM Event type.
interface AppEvent {
  id: number;
  name: string;
  date: string;
  time: string;
  venue: string;
  cost: number;
  description: string;
}

// FIX: Renamed Registration to AppRegistration for consistency.
interface AppRegistration {
  id: number;
  studentId: number;
  eventId: number;
  status: 'Verified' | 'Pending';
}

// --- MOCK DATABASE (MOVED FROM SERVER) ---
const mockUsers: User[] = [
  { id: 1, username: 'admin', password: 'password', role: 'Admin', name: 'Admin User' },
  { id: 101, username: 'student1', password: 'password', role: 'Student', name: 'Alice Smith' },
  { id: 102, username: 'student2', password: 'password', role: 'Student', name: 'Bob Johnson' },
  { id: 201, username: 'faculty1', password: 'password', role: 'Faculty', name: 'Dr. Emily Carter' },
];

// FIX: Updated to use AppEvent type.
let mockEvents: AppEvent[] = [
  { id: 1, name: 'Tech Fest 2024', date: '2024-10-15', time: '09:00', venue: 'Main Auditorium', cost: 800, description: 'A festival showcasing the latest in technology and innovation.' },
  { id: 2, name: 'Arts & Culture Expo', date: '2024-11-05', time: '11:00', venue: 'Exhibition Hall', cost: 400, description: 'Celebrate creativity with art displays, music, and dance performances.' },
  { id: 3, name: 'Entrepreneurship Workshop', date: '2024-11-20', time: '14:00', venue: 'Seminar Hall B', cost: 2000, description: 'Learn the fundamentals of starting your own business from industry experts.' },
];

// FIX: Updated to use AppRegistration type.
let mockRegistrations: AppRegistration[] = [
  { id: 1, studentId: 101, eventId: 1, status: 'Verified' },
  { id: 2, studentId: 102, eventId: 1, status: 'Pending' },
  { id: 3, studentId: 101, eventId: 3, status: 'Pending' },
];


// --- Helper Functions ---
// API calls are now simulated to remove the dependency on a separate backend server.

// FIX: Add type for options object to fix errors on lines 32 and 33.
interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: string;
}

// FIX: Make apiFetch generic to allow typed return values, preventing errors from unknown types.
// FIX: Changed to a standard function declaration to avoid potential parsing issues with generics.
function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate network delay
            try {
                const method = options.method || 'GET';
                const body = options.body ? JSON.parse(options.body) : {};

                console.log(`Simulating ${method} ${url}`);

                // Login
                if (url === '/login' && method === 'POST') {
                    const { username, password, role } = body;
                    const user = mockUsers.find(u => u.username === username && u.password === password && u.role === role);
                    if (user) {
                        const userWithoutPassword = Object.assign({}, user);
                        delete userWithoutPassword.password;
                        return resolve(userWithoutPassword as unknown as T);
                    }
                    return reject(new Error('Invalid username, password, or role.'));
                }

                // Get all events
                if (url === '/events' && method === 'GET') {
                    return resolve([...mockEvents] as unknown as T);
                }

                // Add a new event
                if (url === '/events' && method === 'POST') {
                    const newEvent: AppEvent = Object.assign({}, body, { id: Date.now() });
                    mockEvents.push(newEvent);
                    return resolve(newEvent as unknown as T);
                }

                // Delete an event
                if (url.startsWith('/events/') && method === 'DELETE') {
                    const eventId = parseInt(url.split('/')[2], 10);
                    mockEvents = mockEvents.filter(event => event.id !== eventId);
                    mockRegistrations = mockRegistrations.filter(reg => reg.eventId !== eventId);
                    return resolve(null as unknown as T); // Corresponds to 204 No Content
                }

                // Get all registrations
                if (url === '/registrations' && method === 'GET') {
                    return resolve([...mockRegistrations] as unknown as T);
                }
                
                // Get all student users
                if (url === '/users/students' && method === 'GET') {
                     const students = mockUsers.filter(u => u.role === 'Student').map(s => {
                        const student = Object.assign({}, s);
                        delete student.password;
                        return student;
                    });
                    return resolve(students as unknown as T);
                }

                // Create a new registration
                if (url === '/registrations' && method === 'POST') {
                    const { studentId, eventId } = body;
                    const newRegistration: AppRegistration = {
                        id: Date.now(),
                        studentId,
                        eventId,
                        status: 'Pending'
                    };
                    mockRegistrations.push(newRegistration);
                    return resolve(newRegistration as unknown as T);
                }

                // Verify a registration
                if (url.match(/\/registrations\/\d+\/verify/) && method === 'PATCH') {
                    const regId = parseInt(url.split('/')[2], 10);
                    const registration = mockRegistrations.find(reg => reg.id === regId);
                    if (registration) {
                        registration.status = 'Verified';
                        return resolve(registration as unknown as T);
                    }
                    return reject(new Error('Registration not found.'));
                }

                return reject(new Error(`Unknown API endpoint: ${method} ${url}`));
            } catch (e) {
                console.error('API Simulation Error:', e);
                return reject(e);
            }
        }, 300 + Math.random() * 400); // Random delay to mimic network
    });
};


// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Student' | 'Faculty' | 'Admin'>('Student');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await apiFetch<User>('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password, role }),
            });
            onLogin(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>College Event Management System</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select id="role" value={role} onChange={e => setRole(e.target.value as 'Student' | 'Faculty' | 'Admin')}>
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {error && <p className="alert alert-danger">{error}</p>}
        </div>
    );
};

// FIX: Set a default value for children to make it an optional prop and type props.
// FIX: Updated to use AppEvent type.
// FIX: Explicitly type EventCard as a React.FC to ensure TypeScript correctly handles the special `key` prop used in list rendering.
const EventCard: React.FC<{ event: AppEvent, children?: React.ReactNode }> = ({ event, children = null }) => (
     <div className="card">
        <h4>{event.name}</h4>
        <div className="card-details">
            <p><strong>Date:</strong> {event.date} at {event.time}</p>
            <p><strong>Venue:</strong> {event.venue}</p>
            <p><strong>Cost:</strong> ₹{event.cost}</p>
            <p>{event.description}</p>
        </div>
        {children && <div className="card-actions">{children}</div>}
    </div>
);


const FacultyDashboard = () => {
    // FIX: Type the events state and use AppEvent.
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // FIX: Specify the expected return type from apiFetch to fix error on line 193.
                const data = await apiFetch<AppEvent[]>('/events');
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h3>Upcoming Events</h3>
             <div className="search-container">
                <input
                    type="text"
                    placeholder="Search events by name, venue, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>
            {filteredEvents.length > 0 ? (
                <div className="card-grid">
                    {filteredEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            ) : (
                <p>No events found matching your search.</p>
            )}
        </div>
    );
};

const StudentDashboard = ({ studentId }: { studentId: number }) => {
    // FIX: Type component state with AppEvent and AppRegistration.
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [registrations, setRegistrations] = useState<AppRegistration[]>([]);
    const [myEvents, setMyEvents] = useState(new Set<number>());
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            // FIX: Specify expected return types to fix errors on lines 223 and 224.
            const [eventsData, regsData] = await Promise.all([
                apiFetch<AppEvent[]>('/events'),
                apiFetch<AppRegistration[]>('/registrations')
            ]);
            setEvents(eventsData);
            // FIX: regsData is now correctly typed as an array, so .filter can be used.
            const studentRegs = regsData.filter(r => r.studentId === studentId);
            setRegistrations(studentRegs);
            setMyEvents(new Set(studentRegs.map(r => r.eventId)));
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [studentId]);

    const handleRegister = async (eventId: number) => {
        setIsLoading(true);
        try {
            await apiFetch('/registrations', {
                method: 'POST',
                body: JSON.stringify({ studentId, eventId })
            });
            alert('Registration successful! Awaiting verification.');
            fetchData(); // Refresh data
        } catch (error: any) {
            alert(`Registration failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getEventName = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown Event';
    };

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h3>My Registrations</h3>
            {registrations.length > 0 ? (
                 <table>
                     <thead>
                         <tr>
                             <th>Event</th>
                             <th>Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {registrations.map(reg => (
                             <tr key={reg.id}>
                                 <td>{getEventName(reg.eventId)}</td>
                                 <td>{reg.status}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            ) : <p>You have not registered for any events yet.</p>}
           
            <h3>Available Events</h3>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search available events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>
             {filteredEvents.length > 0 ? (
                <div className="card-grid">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event}>
                            {!myEvents.has(event.id) && (
                                <button onClick={() => handleRegister(event.id)} className="btn btn-success" disabled={isLoading}>
                                    Register
                                </button>
                            )}
                        </EventCard>
                    ))}
                </div>
            ) : (
                <p>No events found matching your search.</p>
            )}
        </div>
    );
};


const AdminDashboard = () => {
    // FIX: Type component state with AppEvent and AppRegistration.
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [registrations, setRegistrations] = useState<AppRegistration[]>([]);
    const [students, setStudents] = useState<Omit<User, 'password'>[]>([]);
    const [view, setView] = useState('events'); // 'events', 'registrations'
    const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '', venue: '', cost: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            // FIX: Specify expected return types to fix errors.
            const [eventsData, regsData, studentsData] = await Promise.all([
                apiFetch<AppEvent[]>('/events'),
                apiFetch<AppRegistration[]>('/registrations'),
                apiFetch<Omit<User, 'password'>[]>('/users/students')
            ]);
            setEvents(eventsData);
            setRegistrations(regsData);
            setStudents(studentsData);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEvent(prev => Object.assign({}, prev, { [name]: value }));
    };

    const handleGenerateDescription = async () => {
        if (!newEvent.name) {
            alert('Please enter an event title first.');
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // FIX: Use a current, recommended model and correct prompt/response handling.
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Write a compelling one-paragraph event description for an event titled "${newEvent.name}". Make it exciting and professional for a college audience.`,
            });
            const text = response.text;
            setNewEvent(prev => Object.assign({}, prev, { description: text }));
        } catch (error) {
            console.error("AI Generation failed:", error);
            alert('Failed to generate description. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // FIX: Replace spread syntax with Object.assign to resolve SyntaxError.
            const eventPayload = Object.assign({}, newEvent, { cost: parseInt(newEvent.cost, 10) || 0 });
            await apiFetch('/events', {
                method: 'POST',
                body: JSON.stringify(eventPayload)
            });
            alert('Event added successfully!');
            setNewEvent({ name: '', date: '', time: '', venue: '', cost: '', description: '' });
            fetchData();
        } catch (error: any) {
            alert(`Failed to add event: ${error.message}`);
        }
    };

    const handleDeleteEvent = (eventId: number) => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            apiFetch(`/events/${eventId}`, { method: 'DELETE' })
                .then(() => {
                    alert('Event deleted successfully.');
                    // Update state directly after successful API call
                    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
                    setRegistrations(prevRegistrations => prevRegistrations.filter(reg => reg.eventId !== eventId));
                })
                .catch((error: any) => {
                    alert(`Failed to delete event: ${error.message}`);
                });
        }
    };

    const handleVerifyRegistration = async (regId: number) => {
        try {
            await apiFetch(`/registrations/${regId}/verify`, { method: 'PATCH' });
            alert('Registration verified!');
            fetchData();
        } catch (error: any) {
            alert(`Failed to verify registration: ${error.message}`);
        }
    };

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown Student';
    };

    const getEventName = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown Event';
    };

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="tabs">
                <button onClick={() => setView('events')} className={view === 'events' ? 'active' : ''}>Manage Events</button>
                <button onClick={() => setView('registrations')} className={view === 'registrations' ? 'active' : ''}>Manage Registrations</button>
            </div>

            {view === 'events' && (
                <div>
                    <h3>Add New Event</h3>
                    <form onSubmit={handleAddEvent}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">Event Name</label>
                                <input type="text" id="name" name="name" value={newEvent.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="date">Date</label>
                                <input type="date" id="date" name="date" value={newEvent.date} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="time">Time</label>
                                <input type="time" id="time" name="time" value={newEvent.time} onChange={handleInputChange} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="venue">Venue</label>
                                <input type="text" id="venue" name="venue" value={newEvent.venue} onChange={handleInputChange} required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="cost">Cost (₹)</label>
                                <input type="number" id="cost" name="cost" value={newEvent.cost} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group full-width">
                                <div className="form-label-group">
                                    <label htmlFor="description">Description</label>
                                    <button type="button" onClick={handleGenerateDescription} className="btn btn-secondary btn-small" disabled={isGenerating}>
                                        {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                                    </button>
                                </div>
                                <textarea id="description" name="description" value={newEvent.description} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <button type="submit" className="btn" style={{ marginTop: '1.5rem' }}>Add Event</button>
                    </form>
                    
                    <h3>Current Events</h3>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search current events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                     {filteredEvents.length > 0 ? (
                        <div className="card-grid">
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} event={event}>
                                    <button onClick={() => handleDeleteEvent(event.id)} className="btn btn-danger">Delete</button>
                                </EventCard>
                            ))}
                        </div>
                    ) : (
                        <p>No events found matching your search.</p>
                    )}
                </div>
            )}

            {view === 'registrations' && (
                <div>
                    <h3>Manage Registrations</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Event</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations
                                .sort((a, b) => a.status === 'Pending' ? -1 : 1) // Show pending first
                                .map(reg => (
                                <tr key={reg.id}>
                                    <td>{getStudentName(reg.studentId)}</td>
                                    <td>{getEventName(reg.eventId)}</td>
                                    <td>
                                        <span className={`status-badge status-${reg.status.toLowerCase()}`}>
                                            {reg.status}
                                        </span>
                                    </td>
                                    <td>
                                        {reg.status === 'Pending' ? (
                                            <button onClick={() => handleVerifyRegistration(reg.id)} className="btn btn-success">Verify</button>
                                        ) : (
                                            <span className="action-verified">Verified</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const App = () => {
    // FIX: Type the user state.
    const [user, setUser] = useState<User | null>(null);

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return <LoginPage onLogin={setUser} />;
    }

    return (
        <div className="container">
            <header className="dashboard-header">
                <h1>Welcome, {user.name}</h1>
                <div className="user-info">
                    <span style={{ background: '#e0e0e0', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600 }}>{user.role}</span>
                    <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                </div>
            </header>
            <main>
                {user.role === 'Admin' && <AdminDashboard />}
                {user.role === 'Student' && <StudentDashboard studentId={user.id} />}
                {user.role === 'Faculty' && <FacultyDashboard />}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);