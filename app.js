const express = require("express");

const users = require("./routers/User_router.js");
const posts = require("./routers/Posts_router.js");

const Db = require("./db/db.js");
// console.log(Db)

const path = require("path");

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use("/api/auth", users);

app.use("/api/post", posts);


Db.sync()
    .then((console.log(`connexion à la base de données : ${Db.config.database}`)))
    .catch(err => (console.error(err)));

module.exports = app;