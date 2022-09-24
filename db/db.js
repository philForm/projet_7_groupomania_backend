import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// const dataBase = "groupomania_db";

const db = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD, {
    dialect: process.env.MYSQL_DIALECT,
    host: process.env.MYSQL_HOST
}

)

// export default new Sequelize(
//     dataBase, "root", "", {
//     dialect: "mysql",
//     host: "localhost"
// });

export default db;

