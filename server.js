const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Use built-in middleware
app.use(cors());
app.use(express.json());

// --- MOCK DATABASE (MOVED FROM FRONTEND) ---
const mockUsers = [
  { id: 1, username: 'admin', password: 'password', role: 'Admin', name: 'Admin User' },
  { id: 101, username: 'student1', password: 'password', role: 'Student', name: 'Alice Smith' },
  { id: 102, username: 'student2', password: 'password', role: 'Student', name: 'Bob Johnson' },
  { id: 201, username: 'faculty1', password: 'password', role: 'Faculty', name: 'Dr. Emily Carter' },
];

let mockEvents = [
  { id: 1, name: 'Tech Fest 2024', date: '2024-10-15', time: '09:00', venue: 'Main Auditorium', cost: 800, description: 'A festival showcasing the latest in technology and innovation.' },
  { id: 2, name: 'Arts & Culture Expo', date: '2024-11-05', time: '11:00', venue: 'Exhibition Hall', cost: 400, description: 'Celebrate creativity with art displays, music, and dance performances.' },
  { id: 3, name: 'Entrepreneurship Workshop', date: '2024-11-20', time: '14:00', venue: 'Seminar Hall B', cost: 2000, description: 'Learn the fundamentals of starting your own business from industry experts.' },
];

let mockRegistrations = [
  { id: 1, studentId: 101, eventId: 1, status: 'Verified' },
  { id: 2, studentId: 102, eventId: 1, status: 'Pending' },
  { id: 3, studentId: 101, eventId: 3, status: 'Pending' },
];

// --- API ENDPOINTS ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    const user = mockUsers.find(u => u.username === username && u.password === password && u.role === role);
    if (user) {
        // In a real app, you'd return a token, not the whole user object with password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ message: 'Invalid username, password, or role.' });
    }
});

// Get all events
app.get('/api/events', (req, res) => {
    res.json(mockEvents);
});

// Add a new event
app.post('/api/events', (req, res) => {
    const newEvent = { ...req.body, id: Date.now() };
    mockEvents.push(newEvent);
    res.status(201).json(newEvent);
});

// Delete an event
app.delete('/api/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    mockEvents = mockEvents.filter(event => event.id !== eventId);
    // Also remove registrations associated with the deleted event
    mockRegistrations = mockRegistrations.filter(reg => reg.eventId !== eventId);
    res.status(204).send();
});

// Get all registrations
app.get('/api/registrations', (req, res) => {
    res.json(mockRegistrations);
});

// Get all student users
app.get('/api/users/students', (req, res) => {
    const students = mockUsers.filter(u => u.role === 'Student').map(s => {
        const { password, ...student } = s;
        return student;
    });
    res.json(students);
});

// Create a new registration
app.post('/api/registrations', (req, res) => {
    const { studentId, eventId } = req.body;
    const newRegistration = {
        id: Date.now(),
        studentId,
        eventId,
        status: 'Pending'
    };
    mockRegistrations.push(newRegistration);
    res.status(201).json(newRegistration);
});

// Verify a registration
app.patch('/api/registrations/:id/verify', (req, res) => {
    const regId = parseInt(req.params.id, 10);
    const registration = mockRegistrations.find(reg => reg.id === regId);
    if (registration) {
        registration.status = 'Verified';
        res.json(registration);
    } else {
        res.status(404).json({ message: 'Registration not found.' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('You can now open your index.html file in the browser.');
});