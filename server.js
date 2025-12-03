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
         where: { id: tonerId },
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
