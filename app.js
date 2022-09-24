import express from "express";

import users from "./routers/User_router.js"

import Db from "./db/db.js";
// console.log(Db)

import path from "path";

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());

app.use(users);


Db.sync()
    .then((console.log(`connexion à la base de données : ${Db.config.database}`)))
    .catch(err => (console.error(err)));
    
export default app;