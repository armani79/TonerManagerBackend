import express from "express";

const app = express();

app.get("/", (req, res) => {
   res.send("Hello! This is my first web server endpoint!");
});

// Create a toner GET endpoint that returns a hardcoded lists of toner
app.get("/toners", (req, res) => {
   res.json([
      {
         id: 1,
         model: "Lexmark 501H",
         color: "Black",
         printers: ["MS610dn", "MS510dn"],
         stock: 4,
      },
      {
         id: 2,
         model: "HP 12A Black",
         color: "Black",
         printers: ["LaserJet 1010", "LaserJet 1022"],
         stock: 1,
      },
      {
         id: 3,
         model: "Xerox 006R",
         color: "Cyan",
         printers: ["VersaLink C400"],
         stock: 7,
      },
   ]);
});

app.listen(8000, () => {
   console.log("Server is running on localhost:8000!!! Yippie!!");
});
