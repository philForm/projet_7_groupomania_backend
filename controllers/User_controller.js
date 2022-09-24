import Db from "../db/db.js"

const getAllUsers = async (req, res, next) => {
    const users = await Db.query("SELECT * FROM users");
    res.send(users);
};

export { getAllUsers };