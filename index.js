const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper Function to Validate ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x6gil.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    // Define the collection
    const coffeeCollection = client.db('coffeeDB').collection('coffee');

    // Get All Coffee Items
    app.get('/coffee', async (req, res) => {
      try {
        const cursor = coffeeCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching coffee items:", error);
        res.status(500).send({ error: "Failed to fetch coffee items" });
      }
    });

    // Get a Single Coffee Item by ID
    app.get('/coffee/:id', async (req, res) => {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }

      const query = { _id: new ObjectId(id) };
      try {
        const result = await coffeeCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ error: "Coffee not found" });
        }
        res.send(result);
      } catch (error) {
        console.error("Error retrieving coffee:", error);
        res.status(500).send({ error: "Failed to retrieve coffee" });
      }
    });

    // Add a New Coffee Item
    app.post('/coffee', async (req, res) => {
      
        const newCoffee = req.body;
        const result = await coffeeCollection.insertOne(newCoffee);
        res.send(result);
      
    });

    // 
    app.put('/coffee/:id' , async(req,res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true};
      const updatedCoffee = req.body;
      const coffee = {
        $set:{
          name:updatedCoffee.name,
           quantity:updatedCoffee.quantity,
           supplier:updatedCoffee.supplier,
           taste:updatedCoffee.taste,
          category:updatedCoffee.category,
           photo:updatedCoffee.photo,
          details:updatedCoffee.details
        }
      }
      const result = await coffeeCollection.updateOne(filter,coffee, options)
      res.send(result);
    })

    // Delete a Coffee Item by ID
    app.delete('/coffee/:id', async (req, res) => {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ error: "Invalid ObjectId format" });
      }

      const query = { _id: new ObjectId(id) };
      try {
        const result = await coffeeCollection.deleteOne(query);
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "Coffee not found" });
        }
        res.send(result);
      } catch (error) {
        console.error("Error deleting coffee:", error);
        res.status(500).send({ error: "Failed to delete coffee" });
      }
    });

    // Root API Endpoint
    app.get('/', (req, res) => {
      res.send('Coffee making server is running!!!');
    });

    // Graceful Shutdown
    process.on('SIGINT', async () => {
      await client.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during MongoDB connection setup:", error);
  }
}


run();

// Start the Express server
app.listen(port, () => {
  console.log(`Coffee Server is running on port ${port}`);
});
