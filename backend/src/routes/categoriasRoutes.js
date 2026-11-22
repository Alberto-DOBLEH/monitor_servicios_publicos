const express = require("express");
const { listarCategorias } = require("../controllers/categoriasController");

const router = express.Router();

router.get("/", listarCategorias);

module.exports = router;
