require("dotenv").config({ path: ".env-timefarm" });
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

  SLEEP_BETWEEN_REQUESTS: process.env.SLEEP_BETWEEN_REQUESTS
    ? process.env.SLEEP_BETWEEN_REQUESTS.split(",").map((str) =>
        parseInt(str.trim())
      )
    : 70,

  USE_PROXY_FROM_FILE: generalSetting.USE_PROXY_FROM_FILE,
};

module.exports = settings;
