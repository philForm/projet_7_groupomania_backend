import { QueryTypes } from "sequelize";
import bcrypt from 'bcrypt'

import Db from "../db/db.js"

// selectionne tous les utilisateurs dans la BDD
const getAllUsers = async (req, res, next) => {
    const users = await Db.query("SELECT * FROM users");
    res.send(users);
};

// selectionne UN utilisateur dans la BDD avec son ID
const getOneUser = async (req, res, next) => {
    const reqId = req.params.id
    const user = await Db.query("SELECT * FROM users WHERE id = ?",
        {
            replacements: [reqId],
            type: QueryTypes.SELECT,
        }
    );
    res.send(user);
};

// Enregistrement d'un utilisateur
const signupUser = async (req, res, next) => {
    console.log(req.body)
    const { firstname, lastname } = await req.body;
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await Db.query(`
            INSERT INTO users (firstname, lastname, pass_word) VALUES (?,?,?);`,
        {
            replacements: [firstname, lastname, hash],
            type: QueryTypes.INSERT
        }
    ).then(() => {
        res.send(user);
        res.status(201).json({ message: "Utilisateur créé !" });
    })
        .catch(error => res.status(500).json({ error }));

};


export { getAllUsers, getOneUser, signupUser };

