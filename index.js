const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve public files (contact form)
app.use(express.static(path.join(__dirname, "public")));

// 🔒 Basic Auth middleware
function checkAuth(req, res, next) {
  const auth = { login: "admin", password: "secret123" }; // change to your own

  const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
  const [login, password] = Buffer.from(b64auth, "base64").toString().split(":");

  if (login === auth.login && password === auth.password) {
    return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="401"');
  res.status(401).send("Authentication required.");
}

// ✅ Serve Admin Panel (protected)
app.get("/admin", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const submissionSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
}, { timestamps: true });

const Submission = mongoose.model("Submission", submissionSchema);

// ✅ API route: Save form
app.post("/submit", async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.json({ message: "Form submitted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// ✅ API route: Get submissions (protected)
app.get("/submissions", checkAuth, async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
