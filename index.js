const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb  connect
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const tasksCollection = client.db("olynex").collection("tasks");

    // CRUD
    //! user post
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        console.log(user);
        if (!user || !user.email) {
          return res
            .status(400)
            .send({ message: "Invalid user data", insertedId: null });
        }
        const query = { email: user.email };
        const isExisting = await usersCollection.findOne(query);
        if (isExisting) {
          return res
            .status(409)
            .send({ message: "User already exists", insertedId: null });
        }
        const result = await usersCollection.insertOne(user);
        return res.status(201).send({
          message: "User created successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error inserting user:", error);
        return res
          .status(500)
          .send({ message: "Internal server error", insertedId: null });
      }
    });

    //! get user
    app.get("/users", async (req, res) => {
      // console.log(req.body);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //! get  user with role
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // by default all user role false
      let boss = false;
      let co_ordinetor = false;
      let mockup = false;
      let seo = false;
      let employe = false;
      if (user) {
        boss = user?.role === "boss";
        co_ordinetor = user?.role === "co_ordinetor";
        mockup = user?.role === "mockup";
        seo = user?.role === "seo";
        employe = user?.role === "employe";
      }
      res.send({ boss, co_ordinetor, mockup, seo, employe });
    });

    //! get single user
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      try {
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
          return res.status(404).send("User not found");
        }

        res.status(200).json(user);
      } catch (error) {
        res.status(500).send("Server error");
      }
    });

    //! post task
    app.post("/tasks", async (req, res) => {
      const tasks = req.body;
      try {
        const result = await tasksCollection.insertOne(tasks);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task post error" });
      }
    });

    //! get a tasks
    app.get("/tasks", async (req, res) => {
      try {
        const result = await tasksCollection.find().toArray();
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "tasks get error" });
      }
    });

    //! update task with send co
    app.patch("/tasksend/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            senderId: body?.senderId,
            receiverId: body?.receiverId,
            CoSendStatus: body?.CoSendStatus,
            sendingDate: body?.sendingDate,
          },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task  send problem" });
      }
    });
    //! update accept task
    app.patch("/task-status/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const { CoSendStatus } = req.body;

      try {
        let updateDoc;

        if (CoSendStatus === "accept") {
          updateDoc = {
            $set: {
              CoSendStatus: "accept",
            },
          };
        } else if (CoSendStatus === "reject") {
          updateDoc = {
            $set: {
              CoSendStatus: "reject",
            },
          };
        } else {
          return res.status(400).json({ message: "Invalid status" });
        }

        const result = await tasksCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Task update problem" });
      }
    });

    //! get task with specific id wise
    app.get("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      try {
        const result = await tasksCollection.findOne(query);
        res.json(result);
      } catch (err) {
        res.status(500).json({ messgae: "task find error" });
      }
    });

    // task submit
    app.patch("/submit-task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            submitURl: body?.submitURl,
            submitDate: body?.submitDate,
            CoSendStatus: body?.CoSendStatus,
            submitNote: body?.submitNote
          },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task submit problem" });
      }
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
