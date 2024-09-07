require("dotenv").config({ path: ".env-blum" });
const generalSetting = require("../../../../utils/config");
const settings = {
  CLAIM_DAILY_REWARD: process.env.CLAIM_DAILY_REWARD
    ? process.env.CLAIM_DAILY_REWARD.toLowerCase() === "true"
    : true,

  CLAIM_FRIENDS_REWARD: process.env.CLAIM_FRIENDS_REWARD
    ? process.env.CLAIM_FRIENDS_REWARD.toLowerCase() === "true"
    : true,

  AUTO_PLAY_GAMES: process.env.AUTO_PLAY_GAMES
    ? process.env.AUTO_PLAY_GAMES.toLowerCase() === "true"
    : true,

  AUTO_START_FARMING: process.env.AUTO_START_FARMING
    ? process.env.AUTO_START_FARMING.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_FARMING_REWARD: process.env.AUTO_CLAIM_FARMING_REWARD
    ? process.env.AUTO_CLAIM_FARMING_REWARD.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_TAP:
    process.env.SLEEP_BETWEEN_TAP && /^\d+$/.test(process.env.SLEEP_BETWEEN_TAP)
      ? parseInt(process.env.SLEEP_BETWEEN_TAP)
      : 70,

  USE_PROXY_FROM_FILE: generalSetting.USE_PROXY_FROM_FILE,

  AUTO_JOIN_TRIBE: process.env.AUTO_JOIN_TRIBE
    ? process.env.AUTO_JOIN_TRIBE.toLowerCase() === "true"
    : true,

  CLAIM_TASKS_REWARD: process.env.CLAIM_TASKS_REWARD
    ? process.env.CLAIM_TASKS_REWARD.toLowerCase() === "true"
    : false,
};

module.exports = settings;
