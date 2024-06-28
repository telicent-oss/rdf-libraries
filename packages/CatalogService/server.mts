import express from 'express';
import cors from 'cors'; // Import the cors middleware
import { setup } from './setup';


// Create an instance of the API

const api = await setup({ hostName: "http://localhost:3030/" })
const service = api._service;

// Create the Express app
const app = express();
const port = 3000; // Port number can be changed

// Middleware for cors
app.use(cors({
    origin: 'http://localhost:5111'
}));
// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint for search
app.post('/search', async (req, res) => {
    try {
        const results = await api.search(req.body);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint for catalog
app.post('/catalog', async (req, res) => {
    try {
        const results = await api.catalog(req.body);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});