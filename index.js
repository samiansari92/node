const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');
const cors = require('cors');
const mysql = require('mysql2/promise')

// MySQL Database Connection Setup
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',  // Replace with your MySQL username
  password: '',  // Replace with your MySQL password
  database: 'node-js'  // Replace with your database name
});

// Allow all origins (use with caution)
app.use(cors());


// Middleware to parse JSON data
app.use(express.json());

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'index.html'));
});

// Serve the about page
app.get('/about', (req, res) => {
  res.send('About Page');
});

// Serve the contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'contact.html'));
});

app.get('/list', (req, res) => {
  res.sendFile(path.join(__dirname, '', 'list.html'));
});


// POST route for contact form submission
app.post('/api/submit-contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Save to MySQL database
  try {
    await db.query(
      'INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
  } catch (dbError) {
    console.error('Database error:', dbError);
    return res.status(500).json({ error: 'Database insert failed.' });
  }

  // Set up email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kuchbhikaro575@gmail.com',
      pass: 'zytv wpgj etvi jyhh' // App password
    }
  });

  // Email to owner
  const mailOptionsToOwner = {
    from: email,
    to: 'kuchbhikaro575@gmail.com',
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  // Thank-you email to user
  const mailOptionsToUser = {
    from: 'kuchbhikaro575@gmail.com',
    to: email,
    subject: 'Thank You for Contacting Us!',
    text: `Hi ${name},\n\nThank you for reaching out to us. We’ve received your message and will get back to you shortly.\n\nBest regards,\nThe Team`
  };

  try {
    await transporter.sendMail(mailOptionsToOwner);
    await transporter.sendMail(mailOptionsToUser);

    res.json({
      message: `Thank you for contacting us, ${name}! Your message has been sent, saved, and a confirmation email has been sent to ${email}.`
    });
  } catch (emailError) {
    console.error('Email error:', emailError);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});


app.get('/api/contact-submissions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, message, submitted_at FROM contact_submissions ORDER BY submitted_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching contact data:', error);
    res.status(500).json({ error: 'Failed to retrieve contact submissions.' });
  }
});


app.delete('/api/contact-submissions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM contact_submissions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});


// PUT route for updating contact form submission
app.put('/api/contact-submissions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, message } = req.body;

  try {
    await db.query(
      'UPDATE contact_submissions SET name = ?, email = ?, message = ? WHERE id = ?',
      [name, email, message, id]
    );
    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});





// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
