const express = require('express');
const router = express.Router();

// Handle GET request for subscription probe
router.get('/', (req, res) => {
    const validationToken = req.query.validationToken;
    
    if (validationToken) {
        // Return the validationToken as a plain text response
        res.status(200).send(validationToken);
    } else {
        // If validationToken is missing, return an error
        res.status(400).send('Missing validationToken');
    }
});

module.exports = router;
