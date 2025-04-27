const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON payloads for POST requests
app.use(express.json());

// Handle GET request (for validation)
app.get('/', (req, res) => {
  const validationToken = req.query.validationToken;
  
  if (validationToken) {
    // Send the validation token back as plain text for verification
    res.status(200).send(validationToken);
  } else {
    // If no validationToken is found, return an error
    res.status(400).send('Missing validationToken');
  }
});

// Handle POST request (for webhook events)
app.post('/', (req, res) => {
  const headers = req.headers;
  const payload = req.body;

  // Log the webhook event to the console (or a file, etc.)
  console.log('Webhook triggered at:', new Date().toISOString());
  console.log('Webhook payload:', JSON.stringify(payload, null, 2));

  // Check if Productboard is verifying the webhook
  if (headers['x-productboard-webhook-verification-token']) {
    const token = headers['x-productboard-webhook-verification-token'];
    
    // Send the verification token back as plain text
    res.status(200).send(token);
    return;
  }

  // Process the event (You can add your event processing logic here)
  // Example: if it's a "new subscription" event, trigger automation in Productboard
  res.status(200).send('✅ Webhook event received.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
