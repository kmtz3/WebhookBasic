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
app.post('/', async (req, res) => {
    console.log('POST / received!');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // ✅ Immediately acknowledge receipt
    res.status(202).send('POST received, processing...');

    try {
        const event = req.body.data;

        if (event && event.eventType && (event.eventType === 'component.created' || event.eventType === 'component.updated')) {
            const componentId = event.id;
            console.log(`Component Event: componentId = ${componentId}`);

            const componentName = await getComponentNameById(componentId);
            console.log(`Fetched Component Name: ${componentName}`);

            const featureData = {
                data: {
                    type: 'feature',
                    status: { name: 'Blocked' },
                    parent: { component: { id: componentId } },
                    name: componentName,
                    description: "<p>Feature auto-created when component "${componentName}" was created.</p>"
                },
            };

            console.log('Creating feature in Productboard...');
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
                    timeout: 5000,
                }
            );

            console.log('✅ Feature created successfully:', JSON.stringify(response.data, null, 2));
        } else {
            console.error('❌ Invalid event type or missing data');
            // ❌ DO NOT send res.status(400) again — just log the error.
        }
    } catch (error) {
        console.error('❌ Error creating feature:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // ❌ DO NOT send res.status(500) again — just log the error.
    }
});

// --- Start server --- //
app.listen(port, () => {
    console.log(`Webhook server running at http://localhost:${port}`);
});
