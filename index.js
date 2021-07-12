const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({extended: true}))

const PORT = 3638;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) =>{
    res.render("landing");
});

app.get("/play", (req, res) =>{
    res.render("game");
});

app.listen( PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
});
