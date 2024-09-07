require("dotenv").config({ path: ".env-pocketfi" });
const generalSetting = require("../../../../utils/config");
const settings = {
  AUTO_MINE: process.env.AUTO_MINE
    ? process.env.AUTO_MINE.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_REQUESTS:
    process.env.SLEEP_BETWEEN_REQUESTS &&
    /^\d+$/.test(process.env.SLEEP_BETWEEN_REQUESTS)
      ? parseInt(process.env.SLEEP_BETWEEN_REQUESTS)
      : 70,

  USE_PROXY_FROM_FILE: generalSetting.USE_PROXY_FROM_FILE,
};

module.exports = settings;
