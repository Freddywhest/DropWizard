require("dotenv").config({ path: ".env-tomarket" });
const generalSetting = require("../../../../utils/config");
const settings = {
  AUTO_PLAY_GAME: process.env.AUTO_PLAY_GAME
    ? process.env.AUTO_PLAY_GAME.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_DAILY_REWARD: process.env.AUTO_CLAIM_DAILY_REWARD
    ? process.env.AUTO_CLAIM_DAILY_REWARD.toLowerCase() === "true"
    : true,

  AUTO_FARM: process.env.AUTO_FARM
    ? process.env.AUTO_FARM.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_COMBO: process.env.AUTO_CLAIM_COMBO
    ? process.env.AUTO_CLAIM_COMBO.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_STARTS: process.env.AUTO_CLAIM_STARTS
    ? process.env.AUTO_CLAIM_STARTS.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_TAP:
    process.env.SLEEP_BETWEEN_TAP && /^\d+$/.test(process.env.SLEEP_BETWEEN_TAP)
      ? parseInt(process.env.SLEEP_BETWEEN_TAP)
      : 70,

  USE_PROXY_FROM_FILE: generalSetting.USE_PROXY_FROM_FILE,
};

module.exports = settings;
