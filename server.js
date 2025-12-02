import express from "express";
import { PrismaClient } from "./generated/prisma/client.js";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/", (req, res) => {
   res.send("Hello! This is my first web server endpoint!");
});

// Post endpoint
app.post("/toners", async (req, res) => {
   const { model, color = "", printers = "", stock = 0 } = req.body;

   if (!model || typeof model !== "string" || model.trim() === "") {
      return res
         .status(400)
         .json({ error: "Model and stock are required fields." });
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

// Create a toner GET endpoint that returns a hardcoded lists of toner
app.get("/toners", async (req, res) => {
   const toners = await prisma.toner.findMany();
   res.json(toners);
});

app.listen(8000, () => {
   console.log("Server is running on localhost:8000!!! Yippie!!");
});
