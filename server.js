import express from "express";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// initialize express app and prisma client
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(
   cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
   })
);

// Admin-only Middleware
function adminOnly(req, res, next) {
   if (req.user.role != "ADMIN") {
      return res.status(403).json({ error: "Admin access only" });
   }
   next();
}

// Middleware authentication
function authMiddleware(req, res, next) {
   const authHeader = req.headers.authorization;
   if (!authHeader) {
      return res.status(401).json({ error: "No token found" });
   }

   try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded user:", decoded);
      req.user = decoded;
      next();
   } catch (error) {
      console.log(error);
      res.status(401).json({ error: "Invalid token" });
   }
}

app.get("/me", authMiddleware, async (req, res) => {
   const userId = req.user.id;
   const user = await prisma.user.findUnique({
      where: { id: userId },
   });
   res.json(user);
});

// Verify if backend is running
app.get("/", (req, res) => {
   res.send("Hello! This is my first web server endpoint!");
});

// FOR REGISTERING USERS:
app.post("/register", async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password) {
         return res
            .status(400)
            .json({ error: "Valid email and password required" });
      }

      const existingUser = await prisma.user.findUnique({
         where: { email },
      });

      if (existingUser) {
         return res
            .status(400)
            .json({ error: "Already existing User, please login" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
         data: {
            email,
            password: hashed,
            role: "USER", // COULD ALSO BE ADMIN, MANUALLY ADJUSTED
         },
      });

      const token = jwt.sign(
         { id: newUser.id, email: newUser.email, role: newUser.role },
         process.env.JWT_SECRET,
         { expiresIn: "1h" }
      );

      res.json({
         message: "User registered successfully",
         token,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         error: "Ran into issue during registration, please try again",
      });
   }
});

// FOR LOGGING IN
app.post("/login", async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password) {
         return res
            .status(400)
            .json({ error: "Email and password are required" });
      }

      const user = await prisma.user.findUnique({
         where: { email },
      });

      if (!user) {
         return res.status(400).json({ error: "Invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
         return res.status(400).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
         { id: user.id, email: user.email, role: user.role },
         process.env.JWT_SECRET,
         { expiresIn: "1h" }
      );

      return res.json({
         message: "Login successful",
         token,
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error trying to log in" });
   }
});

// PROTECTED ROUTES:

// Post endpoint
app.post("/toners", authMiddleware, adminOnly, async (req, res) => {
   const { model, color = "", printers = "", stock = 0 } = req.body;

   if (!model || typeof model !== "string" || model.trim() === "") {
      return res.status(400).json({ error: "Model is required" });
   }

   const toner = await prisma.toner.create({
      data: {
         model,
         color,
         printers,
         stock: Number(stock),
      },
   });

   res.status(201).json(toner);
});

// Put endpoint for ADMIN
app.put("/toners/:id", authMiddleware, adminOnly, async (req, res) => {
   const tonerId = Number(req.params.id);
   const { model, color, printers, stock } = req.body;

   if (!model || typeof model !== "string" || model.trim() === "") {
      return res.status(400).json({ error: "Model is required" });
   }

   try {
      const toner = await prisma.toner.update({
         data: {
            model,
            color,
            printers,
            stock,
         },
         where: {
            id: tonerId,
         },
      });
      res.json(toner);
   } catch (error) {
      res.status(404).json({ error: "Toner not found database" });
   }
});

// Put endpoint for CHECKOUT/USER:
app.put("/toners/:id/checkout", authMiddleware, async (req, res) => {
   const tonerId = Number(req.params.id);
   const { amount } = req.body;

   if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid checkout amount" });
   }

   try {
      const toner = await prisma.toner.findUnique({
         where: { id: tonerId },
      });
      if (!toner) {
         return res.status(404).json({ error: "Toner not found" });
      }
      if (toner.stock < amount) {
         return res.status(400).json({ error: "Not enough in stock" });
      }
      const updated = await prisma.toner.update({
         where: { id: tonerId },
         data: {
            stock: { decrement: amount },
         },
      });
      res.json(updated);
   } catch (error) {
      res.status(500).json({ error: "Could not update stock" });
   }
});

// Delete endpoint
app.delete("/toners/:id", authMiddleware, adminOnly, async (req, res) => {
   const tonerId = req.params.id;

   try {
      await prisma.toner.delete({
         where: { id: Number(tonerId) },
      });
      res.status(204).send();
   } catch (error) {
      res.status(404).json({ error: "Toner not found" });
   }
});

// Create a toner GET endpoint that returns a hardcoded lists of toner
app.get("/toners", authMiddleware, async (req, res) => {
   const toners = await prisma.toner.findMany();
   res.json(toners);
});

app.get("/users", async (req, res) => {
   const users = await prisma.user.findMany();
   res.json(users);
});

app.listen(8000, () => {
   console.log("Server is running on localhost:8000!!! Yippie!!");
});
