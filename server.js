import express from "express";
import cors from "cors";
import { PrismaClient } from "./generated/prisma/client.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
         },
      });

      const token = jwt.sign(
         { id: newUser.id, email: newUser.email },
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
         { id: user.id, email: user.email },
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

// FOR TONER MODEL:
app.get("/", (req, res) => {
   res.send("Hello! This is my first web server endpoint!");
});

// Post endpoint
app.post("/toners", async (req, res) => {
   const { model, color = "", printers = "", stock = 0 } = req.body;

   if (!model || typeof model !== "string" || model.trim() === "") {
      return res.status(400).json({ error: "Model is required" });
   }

   const toner = await prisma.toner.create({
      data: {
         model,
         color,
         printers,
         stock,
      },
   });

   res.status(201).json(toner);
});

// Put endpoint
app.put("/toners/:id", async (req, res) => {
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

// Delete endpoint
app.delete("/toners/:id", async (req, res) => {
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
app.get("/toners", async (req, res) => {
   const toners = await prisma.toner.findMany();
   res.json(toners);
});

app.listen(8000, () => {
   console.log("Server is running on localhost:8000!!! Yippie!!");
});
