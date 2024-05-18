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
    const notificationsCollection = client
      .db("olynex")
      .collection("notifications");

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

    //! get user with id
    app.get("/singleUser/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new  ObjectId(id)};
      try{
        const result = await usersCollection.findOne(query);
        res.json(result)
      }catch(err){
        console.log(err?.message)
      }
    })

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
            CoStatus: body?.CoStatus,
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
      const { CoStatus } = req.body;

      try {
        let updateDoc;

        if (CoStatus === "accept") {
          updateDoc = {
            $set: {
              CoStatus: "accept",
            },
          };
        } else if (CoStatus === "reject") {
          updateDoc = {
            $set: {
              CoStatus: "reject",
            },
          };
        } else if (CoStatus === "pending") {
          updateDoc = {
            $set: {
              CoStatus: "pending",
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
            CoStatus: body?.CoStatus,
            submitNote: body?.submitNote,
          },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task submit problem" });
      }
    });
    // task submit
    app.patch("/accept-task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            CoStatus: body?.CoStatus,
            acceptAt: body?.acceptAt,
          },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task submit problem" });
      }
    });

    //! task complete 
    app.patch("/complete-task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            BossStatus: body?.BossStatus,
            MockupStatus: body?.MockupStatus,
            SeoStatus: body?.SeoStatus,
            CoStatus: body?.CoStatus,
            finisehdAt: body?.finisehdAt
          },
        };
        const result = await tasksCollection.updateOne(query, updateDoc);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "task submit problem" });
      }
    });

    //! task send in boss
    app.patch("/send-boss/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            bossInfo: body?.bossInfo,
            BossStatus: body?.BossStatus
          },
        };
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
    // //! task send in boss
    app.patch("/send-mockup/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            mockupInfo: body?.mockupInfo,
            MockupStatus: body?.MockupStatus
          },
        };
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
    //! task send in SEO
    app.patch("/send-seo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            seoInfo: body?.seoInfo,
            SeoStatus: body?.SeoStatus
          },
        };
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
    //! SEO to boss
    app.patch("/seo-boss/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            BossStatus: body?.BossStatus
          },
        };
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
    //! reject boss
    app.patch("/reject-boss/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            CoStatus: body?.CoStatus,
            BossStatus: body?.BossStatus
          },
        };
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
    //! reject mockup
    app.patch("/reject-mockup/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            CoStatus: body?.CoStatus,
            BossStatus: body?.BossStatus,
            MockupStatus: body?.MockupStatus,
          },
        };
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
    //! reject mockup
    app.patch("/reject-seo/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            CoStatus: body?.CoStatus,
            BossStatus: body?.BossStatus,
            MockupStatus: body?.MockupStatus,
            SeoStatus: body?.SeoStatus
          },
        };
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

    //! post notification
    app.post("/notifications", async (req, res) => {
      const notification = req.body;
      try {
        const result = await notificationsCollection.insertOne(notification);
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "notification post error" });
      }
    });

    // get notification
    app.get("/notifications", async (req, res) => {
      try {
        const result = await notificationsCollection.find().toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "get notification error" });
      }
    });

    //update  notification
    app.patch("/notification/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      try {
        const updateDoc = {
          $set: {
            count: body?.count,
            status: body?.status,
          },
        };
        const result = await notificationsCollection.updateOne(
          query,
          updateDoc
        );
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ message: "notification  update error" });
      }
    });

    // delete notification
    app.delete("/notification/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      try {
        const result = await notificationsCollection.deleteOne(query);
        res.json(result);
      } catch (err) {
        console.log(err.message);
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
