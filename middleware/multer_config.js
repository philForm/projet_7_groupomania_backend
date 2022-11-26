const multer = require("multer");
const utf8 = require("utf8");
const { replaceChar } = require("../utils/functions");

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images")
    },
    filename: (req, file, callback) => {
        let fileName = utf8.decode(file.originalname).split(' ').join('_').split(".")[0];
        fileName = replaceChar(fileName);
        const extension = MIME_TYPES[file.mimetype];
        callback(null, `${fileName}${Date.now()}.${extension}`);
    }

});

module.exports = multer({ storage }).single("image");
