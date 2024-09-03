require("dotenv").config({ path: ".env-major" });
const settings = {
  AUTO_PLAY_HOLD_TO_EARN: process.env.AUTO_PLAY_HOLD_TO_EARN
    ? process.env.AUTO_PLAY_HOLD_TO_EARN.toLowerCase() === "true"
    : true,

  AUTO_PLAY_ROULETTE: process.env.AUTO_PLAY_ROULETTE
    ? process.env.AUTO_PLAY_ROULETTE.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_TASKS: process.env.AUTO_CLAIM_TASKS
    ? process.env.AUTO_CLAIM_TASKS.toLowerCase() === "true"
    : true,

  CLAIM_DAILY_REWARDS: process.env.CLAIM_DAILY_REWARDS
    ? process.env.CLAIM_DAILY_REWARDS.toLowerCase() === "true"
    : true,

  SLEEP_BETWEEN_REQUESTS: process.env.SLEEP_BETWEEN_REQUESTS
    ? process.env.SLEEP_BETWEEN_REQUESTS.split(",").map((str) =>
        parseInt(str.trim())
      )
    : 70,

  USE_PROXY_FROM_FILE: process.env.USE_PROXY_FROM_FILE
    ? process.env.USE_PROXY_FROM_FILE.toLowerCase() === "true"
    : false,
};

module.exports = settings;
