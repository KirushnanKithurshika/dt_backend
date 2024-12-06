require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001; // Use the port from environment variables

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Setup file upload handling with memory storage
const storage = multer.memoryStorage();  // Store files in memory
const upload = multer({ storage: storage });

// POST route to handle email sending for quote requests
app.post('/send-quote', async (req, res) => {
  const { name, phone, address, email, message } = req.body;

  try {
    // Create a Nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Use the email from .env file
        pass: process.env.EMAIL_PASS, // Use the password from .env file
      },
    });

    // Email options for the quote request
    const mailOptions = {
      from: email, // User's email as the sender
      to: process.env.RECIPIENT_EMAIL, // Use recipient email from .env
      subject: 'New Quote Request',
      html: `
        <h3>New Quote Request Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Quote email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending quote email', error });
  }
});

// POST route to handle email sending for job applications
app.post('/send-job-application', upload.fields([{ name: 'resume' }, { name: 'coverLetter' }]), async (req, res) => {
  const { name, email, phone,position,availability } = req.body;
  const resume = req.files['resume'][0];  // File is available in req.files
  const coverLetter = req.files['coverLetter'] ? req.files['coverLetter'][0] : null;

  try {
    // Create a Nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare email options for the job application
    const mailOptions = {
      from: email, // Applicant's email as the sender
      to: process.env.RECIPIENT_EMAIL, // Use recipient email from .env
      subject: 'New Job Application',
      html: `
        <h3>Job Application Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Availability:</strong> ${availability}</p>
      `,
      attachments: [
        {
          filename: 'Resume' + path.extname(resume.originalname), // Retain file extension (PDF, DOCX, etc.)
          content: resume.buffer, // Use buffer for memory storage
        },
        // Attach cover letter if available
        coverLetter ? {
          filename: 'Cover Letter' + path.extname(coverLetter.originalname), // Retain file extension
          content: coverLetter.buffer, // Use buffer for memory storage
        } : null
      ].filter(Boolean), // Filter out null values (in case cover letter is not uploaded)
    };

    // Send the email with attachments
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Job application email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending job application email', error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
