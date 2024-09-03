require("dotenv").config({ path: ".env-general" });
const settings = {
  API_ID:
    process.env.API_ID && /^\d+$/.test(process.env.API_ID)
      ? parseInt(process.env.API_ID)
      : process.env.API_ID && !/^\d+$/.test(process.env.API_ID)
      ? "N/A"
      : undefined,
  API_HASH: process.env.API_HASH || "",
  BLUM: process.env.BLUM ? process.env.BLUM.toLowerCase() === "true" : true,
  ROCKYRABBIT: process.env.ROCKYRABBIT
    ? process.env.ROCKYRABBIT.toLowerCase() === "true"
    : true,
  TOMARKET: process.env.TOMARKET
    ? process.env.TOMARKET.toLowerCase() === "true"
    : true,
  DOTCOIN: process.env.DOTCOIN
    ? process.env.DOTCOIN.toLowerCase() === "true"
    : true,
  TIMEFARM: process.env.TIMEFARM
    ? process.env.TIMEFARM.toLowerCase() === "true"
    : true,
  LOSTDOGS: process.env.LOSTDOGS
    ? process.env.LOSTDOGS.toLowerCase() === "true"
    : true,
  MAJOR: process.env.MAJOR ? process.env.MAJOR.toLowerCase() === "true" : true,
  USE_QUERY_ID_TOMARKET: process.env.USE_QUERY_ID_TOMARKET
    ? process.env.USE_QUERY_ID_TOMARKET.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_BLUM: process.env.USE_QUERY_ID_BLUM
    ? process.env.USE_QUERY_ID_BLUM.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_ROCKYRABBIT: process.env.USE_QUERY_ID_ROCKYRABBIT
    ? process.env.USE_QUERY_ID_ROCKYRABBIT.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_DOTCOIN: process.env.USE_QUERY_ID_DOTCOIN
    ? process.env.USE_QUERY_ID_DOTCOIN.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_LOSTDOGS: process.env.USE_QUERY_ID_LOSTDOGS
    ? process.env.USE_QUERY_ID_LOSTDOGS.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_TIMEFARM: process.env.USE_QUERY_ID_TIMEFARM
    ? process.env.USE_QUERY_ID_TIMEFARM.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_MAJOR: process.env.USE_QUERY_ID_MAJOR
    ? process.env.USE_QUERY_ID_MAJOR.toLowerCase() === "true"
    : false,
  USE_PROXY_FROM_FILE: process.env.USE_PROXY_FROM_FILE
    ? process.env.USE_PROXY_FROM_FILE.toLowerCase() === "true"
    : false,
};

module.exports = settings;
