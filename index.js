const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Access the Productboard token from environment variables
const productboardToken = process.env.PRODUCTBOARD_API_TOKEN;

// Helper function to get component name by ID
const getComponentNameById = async (componentId) => {
    try {
        const response = await axios.get(`https://api.productboard.com/components/${componentId}`, {
            headers: {
                'X-Version': '1',
                'Accept': 'application/json',
                'Authorization': `Bearer ${productboardToken}`,
            },
        });
        return response.data.data.attributes.name;
    } catch (error) {
        console.error('Error fetching component name:', error);
        throw new Error('Failed to fetch component name');
    }
};

// Webhook route - listening for component update or creation
app.post('/webhook', async (req, res) => {
    try {
        // Check if we have the event type (e.g., component updated or created)
        if (req.body.data && req.body.data.type === 'component') {
            const componentId = req.body.data.id; // Assuming the component ID is in 'id' field

            // Get the component name using the componentId
            const componentName = await getComponentNameById(componentId);
            console.log(`Component Name: ${componentName}`);
            console.log(`Entity ID: ${componentId}`);

            // Prepare the data for the new feature creation
            const featureData = {
                data: {
                    type: 'feature',
                    status: {
                        name: 'Blocked',
                    },
                    parent: {
                        component: {
                            id: componentId,
                        },
                    },
                    name: componentName,
                },
            };

            // Send the request to Productboard API to create the feature
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
                }
            );

            console.log('Feature created successfully:', response.data);
            res.status(200).send('Feature created successfully!');
        } else {
            res.status(400).send('Invalid event type or missing data');
        }
    } catch (error) {
        console.error('Error creating feature:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Server setup
app.listen(port, () => {
    console.log(`Webhook server running at http://localhost:${port}`);
});
