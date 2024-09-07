require("dotenv").config({ path: ".env-timefarm" });
const _isArray = require("../../../../utils/_isArray");
const generalSetting = require("../../../../utils/config");
const settings = {
  CLAIM_FRIENDS_REWARD: process.env.CLAIM_FRIENDS_REWARD
    ? process.env.CLAIM_FRIENDS_REWARD.toLowerCase() === "true"
    : true,

  AUTO_FARMING: process.env.AUTO_FARMING
    ? process.env.AUTO_FARMING.toLowerCase() === "true"
    : true,

  AUTO_DAILY_QUIZ: process.env.AUTO_DAILY_QUIZ
    ? process.env.AUTO_DAILY_QUIZ.toLowerCase() === "true"
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
