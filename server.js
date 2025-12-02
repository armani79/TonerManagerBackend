import express from "express";
import { PrismaClient } from "./generated/prisma/client.js";

const app = express();
const prisma = new PrismaClient();

app.get("/", (req, res) => {
   res.send("Hello! This is my first web server endpoint!");
});

// Create a toner GET endpoint that returns a hardcoded lists of toner
app.get("/toners", async (req, res) => {
   const toners = await prisma.toner.findMany();
   res.json(toners);
});

app.listen(8000, () => {
   console.log("Server is running on localhost:8000!!! Yippie!!");
});
