import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const API_BASE_URL = 'http://localhost:3001/api';

// --- Helper Functions ---
const apiFetch = async (url, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'An error occurred');
        }
        if (response.status === 204) return null; // Handle No Content response
        return response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Connection failed. Please ensure the backend server is running.');
        }
        throw error;
    }
};


// --- Components ---

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Student');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password, role }),
            });
            onLogin(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={styles.loginContainer}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
                <select value={role} onChange={e => setRole(e.target.value)} style={styles.input}>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                </select>
                <button type="submit" style={styles.button}>Login</button>
            </form>
            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
};

const FacultyDashboard = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await apiFetch('/events');
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div>
            <h3>Upcoming Events</h3>
            <div style={styles.cardContainer}>
                 {events.map(event => (
                    <div key={event.id} style={styles.card}>
                        <h4>{event.name}</h4>
                        <p><strong>Date:</strong> {event.date} at {event.time}</p>
                        <p><strong>Venue:</strong> {event.venue}</p>
                        <p><strong>Cost:</strong> ₹{event.cost}</p>
                        <p>{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StudentDashboard = ({ studentId }) => {
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [myEvents, setMyEvents] = useState(new Set());

    const fetchData = async () => {
        try {
            const [eventsData, regsData] = await Promise.all([
                apiFetch('/events'),
                apiFetch('/registrations')
            ]);
            setEvents(eventsData);
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

    const handleRegister = async (eventId) => {
        try {
            await apiFetch('/registrations', {
                method: 'POST',
                body: JSON.stringify({ studentId, eventId })
            });
            alert('Registration successful! Awaiting verification.');
            fetchData(); // Refresh data
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    };
    
    const getEventName = (eventId) => events.find(e => e.id === eventId)?.name || 'Unknown Event';

    return (
        <div>
            <h3>My Registrations</h3>
            {registrations.length > 0 ? (
                 <table style={styles.table}>
                     <thead>
                         <tr>
                             <th style={styles.th}>Event</th>
                             <th style={styles.th}>Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {registrations.map(reg => (
                             <tr key={reg.id}>
                                 <td style={styles.td}>{getEventName(reg.eventId)}</td>
                                 <td style={styles.td}>{reg.status}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            ) : <p>You have not registered for any events yet.</p>}
           
            <h3 style={{marginTop: '40px'}}>Available Events</h3>
             <div style={styles.cardContainer}>
                 {events.map(event => (
                    <div key={event.id} style={styles.card}>
                        <h4>{event.name}</h4>
                        <p><strong>Date:</strong> {event.date} at {event.time}</p>
                        <p><strong>Venue:</strong> {event.venue}</p>
                        <p><strong>Cost:</strong> ₹{event.cost}</p>
                        <p>{event.description}</p>
                        {!myEvents.has(event.id) && (
                            <button onClick={() => handleRegister(event.id)} style={styles.button}>Register</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [students, setStudents] = useState([]);
    const [view, setView] = useState('events'); // 'events', 'registrations'
    const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '', venue: '', cost: '', description: '' });

    const fetchData = async () => {
        try {
            const [eventsData, regsData, studentsData] = await Promise.all([
                apiFetch('/events'),
                apiFetch('/registrations'),
                apiFetch('/users/students')
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/events', {
                method: 'POST',
                body: JSON.stringify({ ...newEvent, cost: parseInt(newEvent.cost, 10) })
            });
            setNewEvent({ name: '', date: '', time: '', venue: '', cost: '', description: '' });
            fetchData();
        } catch (error) {
            alert(`Failed to add event: ${error.message}`);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event? This will also remove all registrations for it.')) {
            try {
                await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
                fetchData();
            } catch (error) {
                alert(`Failed to delete event: ${error.message}`);
            }
        }
    };

    const handleVerify = async (regId) => {
        try {
            await apiFetch(`/registrations/${regId}/verify`, { method: 'PATCH' });
            fetchData();
        } catch (error) {
            alert(`Failed to verify registration: ${error.message}`);
        }
    };
    
    const getStudentName = (studentId) => students.find(s => s.id === studentId)?.name || 'Unknown';
    const getEventName = (eventId) => events.find(e => e.id === eventId)?.name || 'Unknown';

    return (
        <div>
            <nav style={styles.adminNav}>
                <button onClick={() => setView('events')} style={view === 'events' ? styles.adminNavButtonActive : styles.adminNavButton}>Manage Events</button>
                <button onClick={() => setView('registrations')} style={view === 'registrations' ? styles.adminNavButtonActive : styles.adminNavButton}>Manage Registrations</button>
            </nav>

            {view === 'events' && (
                <div>
                    <h3>Add New Event</h3>
                    <form onSubmit={handleAddEvent} style={styles.formGrid}>
                         <input name="name" value={newEvent.name} onChange={handleInputChange} placeholder="Event Name" required style={styles.input} />
                         <input name="date" type="date" value={newEvent.date} onChange={handleInputChange} placeholder="Date" required style={styles.input} />
                         <input name="time" type="time" value={newEvent.time} onChange={handleInputChange} placeholder="Time" required style={styles.input} />
                         <input name="venue" value={newEvent.venue} onChange={handleInputChange} placeholder="Venue" required style={styles.input} />
                         <input name="cost" type="number" value={newEvent.cost} onChange={handleInputChange} placeholder="Cost (INR)" required style={styles.input} />
                         <textarea name="description" value={newEvent.description} onChange={handleInputChange} placeholder="Description" required style={{...styles.input, gridColumn: '1 / -1'}} />
                         <button type="submit" style={{...styles.button, gridColumn: '1 / -1'}}>Add Event</button>
                    </form>
                    
                    <h3 style={{marginTop: '40px'}}>Existing Events</h3>
                     <table style={styles.table}>
                         <thead>
                             <tr>
                                 <th style={styles.th}>Name</th>
                                 <th style={styles.th}>Date</th>
                                 <th style={styles.th}>Venue</th>
                                 <th style={styles.th}>Cost</th>
                                 <th style={styles.th}>Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                             {events.map(event => (
                                 <tr key={event.id}>
                                     <td style={styles.td}>{event.name}</td>
                                     <td style={styles.td}>{event.date} at {event.time}</td>
                                     <td style={styles.td}>{event.venue}</td>
                                     <td style={styles.td}>₹{event.cost}</td>
                                     <td style={styles.td}>
                                         <button onClick={() => handleDeleteEvent(event.id)} style={styles.buttonDanger}>Delete</button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                </div>
            )}
            
            {view === 'registrations' && (
                <div>
                    <h3>All Registrations</h3>
                     <table style={styles.table}>
                         <thead>
                             <tr>
                                 <th style={styles.th}>Event</th>
                                 <th style={styles.th}>Student</th>
                                 <th style={styles.th}>Status</th>
                                 <th style={styles.th}>Action</th>
                             </tr>
                         </thead>
                         <tbody>
                             {registrations.map(reg => (
                                 <tr key={reg.id}>
                                     <td style={styles.td}>{getEventName(reg.eventId)}</td>
                                     <td style={styles.td}>{getStudentName(reg.studentId)}</td>
                                     <td style={styles.td}>{reg.status}</td>
                                     <td style={styles.td}>
                                         {reg.status === 'Pending' && (
                                             <button onClick={() => handleVerify(reg.id)} style={styles.button}>Verify</button>
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
    const [user, setUser] = useState(null);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>College Event Portal</h1>
                <div>
                    <span>Welcome, <strong>{user.name}</strong> ({user.role})</span>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
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

// --- Styles ---
// FIX: Explicitly type the styles object to satisfy TypeScript's CSSProperties type checking.
const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
    logoutButton: { marginLeft: '15px', background: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
    loginContainer: { maxWidth: '400px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    button: { padding: '10px 15px', border: 'none', background: '#007BFF', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    buttonDanger: { padding: '5px 10px', border: 'none', background: '#dc3545', color: 'white', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red', marginTop: '10px', background: '#ffebee', border: '1px solid #e57373', padding: '10px', borderRadius: '4px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f2f2f2', padding: '12px', border: '1px solid #ddd', textAlign: 'left' },
    td: { padding: '12px', border: '1px solid #ddd' },
    cardContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    adminNav: { marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' },
    adminNavButton: { marginRight: '10px', background: 'none', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
    adminNavButtonActive: { marginRight: '10px', background: '#007BFF', color: 'white', border: '1px solid #007BFF', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }
};


// --- Render App ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);