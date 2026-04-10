const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data
let jobs = [
    {
        id: '1',
        title: 'Senior Frontend Engineer',
        company: 'TechFlow',
        location: 'Remote',
        salary: '$120,000 - $150,000',
        type: 'Full-time',
        description: 'We are looking for an experienced Frontend Engineer with strong React and modern CSS skills to build intuitive user interfaces.',
        postedDate: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Backend Developer',
        company: 'DataSys',
        location: 'New York, NY',
        salary: '$110,000 - $140,000',
        type: 'Full-time',
        description: 'Join our core infrastructure team to build scalable Node.js microservices.',
        postedDate: new Date().toISOString()
    },
    {
        id: '3',
        title: 'UI/UX Design Intern',
        company: 'CreativeSpace',
        location: 'San Francisco, CA',
        salary: '$30/hr',
        type: 'Internship',
        description: 'Assist our design team in creating wireframes, prototypes, and beautiful web experiences.',
        postedDate: new Date().toISOString()
    }
];

let applications = [];
const ADMIN_CREDS = { username: 'admin', password: 'password123' };

// --- API Endpoints ---

// 1. Get all jobs
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

// 2. Add job (Admin)
app.post('/api/jobs', (req, res) => {
    const { title, company, location, salary, type, description } = req.body;
    const newJob = {
        id: Date.now().toString(),
        title, company, location, salary, type, description,
        postedDate: new Date().toISOString()
    };
    jobs.unshift(newJob);
    res.status(201).json({ message: 'Job created successfully', job: newJob });
});

// 3. Edit job (Admin)
app.put('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    const index = jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
        jobs[index] = { ...jobs[index], ...req.body };
        res.json({ message: 'Job updated successfully', job: jobs[index] });
    } else {
        res.status(404).json({ message: 'Job not found' });
    }
});

// 4. Delete job (Admin)
app.delete('/api/jobs/:id', (req, res) => {
    const jobId = req.params.id;
    jobs = jobs.filter(j => j.id !== jobId);
    // Also delete associated applications
    applications = applications.filter(a => a.jobId !== jobId);
    res.json({ message: 'Job deleted successfully' });
});

// 5. Apply to job
app.post('/api/apply/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const { name, email, phone, resumeLink, coverLetter } = req.body;
    
    const jobExists = jobs.some(j => j.id === jobId);
    if (!jobExists) return res.status(404).json({ message: 'Job not found' });

    const newApp = {
        id: Date.now().toString(),
        jobId,
        name, email, phone, resumeLink, coverLetter,
        status: 'Pending',
        appliedDate: new Date().toISOString()
    };
    
    applications.push(newApp);
    res.status(201).json({ message: 'Application submitted successfully', application: newApp });
});

// 6. Track applications (Candidate)
app.get('/api/applications/:email', (req, res) => {
    const email = req.params.email;
    const candidateApps = applications.filter(a => a.email === email).map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        return {
            ...app,
            jobTitle: job ? job.title : 'Job title unavailable',
            company: job ? job.company : 'Company unavailable'
        };
    });
    res.json(candidateApps);
});

// 7. All applications (Admin)
app.get('/api/applications', (req, res) => {
    const enrichedApps = applications.map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        return {
            ...app,
            jobTitle: job ? job.title : 'Deleted Job',
            company: job ? job.company : '-'
        };
    });
    res.json(enrichedApps);
});

// 8. Update application status (Admin)
app.put('/api/applications/:id/status', (req, res) => {
    const appId = req.params.id;
    const { status } = req.body;
    
    const appIndex = applications.findIndex(a => a.id === appId);
    if (appIndex !== -1) {
        applications[appIndex].status = status;
        res.json({ message: 'Status updated', application: applications[appIndex] });
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

// 9. Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
        res.json({ message: 'Login successful', token: 'fake-jwt-token' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
