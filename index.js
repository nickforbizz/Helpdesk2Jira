const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

require('dotenv').config();

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors());

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


require("./routes/user.routes")(app);
require("./routes/ticket.routes")(app);
require("./routes/param.routes")(app);
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to apptest2 application." });
});

// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});