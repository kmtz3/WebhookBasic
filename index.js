const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON payloads (only once)
app.use(express.json());

// Access the Productboard token from environment variables
const productboardToken = process.env.PRODUCTBOARD_API_TOKEN;

// --- Helper: Get component name by ID --- //
const getComponentNameById = async (componentId) => {
    try {
        const response = await axios.get(`https://api.productboard.com/components/${componentId}`, {
            headers: {
                'X-Version': '1',
                'Accept': 'application/json',
                'Authorization': `Bearer ${productboardToken}`,
            },
            timeout: 5000, // Optional: Add timeout to avoid hanging requests
        });
        return response.data.data.name;
    } catch (error) {
        console.error('Error fetching component name:', error.response ? error.response.data : error);
        throw new Error('Failed to fetch component name');
    }
};

// --- Route: Handle GET for subscription validation (probe) --- //
app.get('/', (req, res) => {
    const validationToken = req.query.validationToken;

    if (validationToken) {
        console.log('Subscription probe received, returning validation token.');
        res.status(200).send(validationToken); // Respond with plain text
    } else {
        res.status(404).send('Not found'); // Return 404 if no validationToken
    }
});

// --- Route: Handle POST for webhook events --- //
app.post('/', async (req, res) => {
    try {
        const event = req.body.data;
        
        if (event && event.type === 'component') {
            const componentId = event.id;
            console.log(`Webhook received for component ID: ${componentId}`);

            const componentName = await getComponentNameById(componentId);
            console.log(`Component Name: ${componentName}`);

            const featureData = {
                data: {
                    type: 'feature',
                    status: { name: 'Blocked' },
                    parent: { component: { id: componentId } },
                    name: componentName,
                },
            };

            const response = await axios.post(
                'https://api.productboard.com/features',
                featureData,
                {
                    headers: {
                        'X-Version': '1',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${productboardToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000, // Optional: timeout for feature creation
                }
            );

            console.log('Feature created successfully:', response.data);
            res.status(200).send('Feature created successfully!');
        } else {
            res.status(400).send('Invalid event type or missing data');
        }
    } catch (error) {
        console.error('Error creating feature:', error.response ? error.response.data : error.message);
        res.status(500).send('Error processing webhook');
    }
});

// --- Start server --- //
app.listen(port, () => {
    console.log(`Webhook server running at http://localhost:${port}`);
});
