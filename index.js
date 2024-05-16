const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb  connect
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://olynex:9ccwm1aq7evQ4gTg@cluster0.dzbhwpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    //collection
    const usersCollection = client.db("olynex").collection("users");

    // CRUD
    //! user post
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        console.log(user)
        if (!user || !user.email) {
          return res.status(400).send({ message: "Invalid user data", insertedId: null });
        }
        const query = { email: user.email };
        const isExisting = await usersCollection.findOne(query);
        if (isExisting) {
          return res.status(409).send({ message: "User already exists", insertedId: null });
        }
        const result = await usersCollection.insertOne(user);
        return res.status(201).send({ message: "User created successfully", insertedId: result.insertedId });
      } catch (error) {
        console.error("Error inserting user:", error);
        return res.status(500).send({ message: "Internal server error", insertedId: null });
      }
    });
    

    //! get user
    app.get("/users", async (req, res) => {
      // console.log(req.body);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //! get  user with role
    app.get("/user/:email",  async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      console.log(query)
      const user = await usersCollection.findOne(query);
      console.log(user, "user")
      // console.log(user);
      let boss = false;
      let co_ordinetor = false;
      if (user) {
        boss = user?.role === "boss";
        co_ordinetor = user?.role === 'co_ordinetor'
      }
      res.send({ boss, co_ordinetor });
    });

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Olynex server");
});

app.listen(PORT, () => {
  console.log(`App listening on PORT ${PORT}`);
});
