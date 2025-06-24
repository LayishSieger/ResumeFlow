const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // Add CORS middleware
const app = express();

// Enable CORS for all origins
app.use(cors({
    origin: '*', // Allow all origins for dev; restrict in production
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.text({ type: 'text/html' }));

app.post('/generate-pdf', async (req, res) => {
    try {
        const htmlContent = req.body;
        if (!htmlContent) {
            return res.status(400).send('No HTML content provided');
        }

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set content and wait for fonts/resources
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdf = await page.pdf({
            format: 'A4',
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
            printBackground: true
        });

        await browser.close();

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'attachment; filename=resume.pdf');
        res.send(pdf);
    } catch (error) {
        console.error('Puppeteer error:', error);
        res.status(500).send('PDF generation failed');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));