const express = require("express");
const { LOS_MOCHIS } = require("../constants/geo");

const router = express.Router();

router.get("/geo", (req, res) => {
  res.json({
    ciudad: "Los Mochis",
    estado: "Sinaloa",
    pais: "México",
    centro: LOS_MOCHIS.center,
    zoom: LOS_MOCHIS.zoom,
    limites: LOS_MOCHIS.bounds,
  });
});

module.exports = router;
