require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const port = process.env.PORT || 5000;
const MongoClient = require("mongodb").MongoClient;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

const middlewares = require("./middlewares");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const collection = db.collection("users");

  // Check if the user exists
  const user = await collection.findOne({
    username,
    password,
  });

  if (user) {
    res.json({
      message: "Successfully Logged In!",
    });
  } else {
    res.status(401).json({
      message: "🔒",
    });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/incident", upload.single("photo"), async (req, res) => {
  try {
    const { description, location } = req.body;
    const photoPath = req.file ? req.file.path : null;

    const collection = db.collection("incidents");
    const incident = {
      description,
      location,
      photoPath,
      timestamp: new Date(),
    };
    // userUploaded, attended?, attendedBy, attendedAt
    await collection.insertOne(incident);

    res.json({
      message: "Incident reported successfully",
      incident,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error reporting incident",
      error: error.message,
    });
  }
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
// connect to the database and start listening
async function run() {
  await client.connect();
  console.log("Connected to MongoDB");
  db = client.db("avinya");
  app.listen(port, () => {
    console.log(`Listening: http://localhost:${port}`);
  });
}
run();
