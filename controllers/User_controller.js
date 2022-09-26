import { QueryTypes } from "sequelize";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import Db from "../db/db.js";

// selectionne tous les utilisateurs dans la BDD
const getAllUsers = async (req, res, next) => {
    const [users] = await Db.query("SELECT * FROM users");
    res.send(users);
};

// selectionne UN utilisateur dans la BDD avec son ID
const getOneUser = async (req, res, next) => {
    const reqId = req.params.id
    const [user] = await Db.query("SELECT * FROM users WHERE id = ?",
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
    const { firstname, lastname, email, picture } = await req.body;
    const hash = await bcrypt.hash(req.body.password, 10);
    Db.query(`
            INSERT INTO users (firstname, lastname, pass_word, email, user_picture) VALUES (?,?,?,?,?);`,
        {
            replacements: [firstname, lastname, hash, email, picture],
            type: QueryTypes.INSERT
        }
    ).then(() => {
        res.status(201).json({ message: "Utilisateur créé !" });
    })
        .catch(error => res.status(500).json({ error }));

};

// Authentifie un utilisateur
const loginUser = async (req, res, next) => {
    const [user] = await Db.query(
        'SELECT `id`, `email`, `pass_word` FROM `users` WHERE `users`.`email` = ?',
        {
            replacements: [req.body.email],
            type: QueryTypes.SELECT
        }
    );
    console.log(user.id)

    const valid = await bcrypt.compare(req.body.password, user.pass_word);

    if (!valid) {
        return res.status(401).json({ message: "Mot de passe incorrect !" });
    }
    res.status(200).json({
        userId: user.id,
        token: jwt.sign(
            { userId: user.id },
            process.env.WEB_TOKEN,
            { expiresIn: "24h" }
        )
    });

}


export { getAllUsers, getOneUser, signupUser, loginUser };

