require("dotenv").config({ path: ".env-pocketfi" });
const _isArray = require("../../../../utils/_isArray");
const generalSetting = require("../../../../utils/config");
const settings = {
  AUTO_MINE: process.env.AUTO_MINE
    ? process.env.AUTO_MINE.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_REQUESTS:
    process.env.SLEEP_BETWEEN_REQUESTS &&
    _isArray(process.env.SLEEP_BETWEEN_REQUESTS)
      ? JSON.parse(process.env.SLEEP_BETWEEN_REQUESTS)
      : process.env.SLEEP_BETWEEN_REQUESTS &&
        /^\d+$/.test(process.env.SLEEP_BETWEEN_REQUESTS)
      ? parseInt(process.env.SLEEP_BETWEEN_REQUESTS)
      : 150,

  USE_PROXY_FROM_FILE: generalSetting.USE_PROXY_FROM_FILE,
};

module.exports = settings;
