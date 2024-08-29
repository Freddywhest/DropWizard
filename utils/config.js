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
  USE_QUERY_ID_TOMARKET: process.env.USE_QUERY_ID_TOMARKET
    ? process.env.USE_QUERY_ID_TOMARKET.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_BLUM: process.env.USE_QUERY_ID_BLUM
    ? process.env.USE_QUERY_ID_BLUM.toLowerCase() === "true"
    : false,
  USE_QUERY_ID_ROCKYRABBIT: process.env.USE_QUERY_ID_ROCKYRABBIT
    ? process.env.USE_QUERY_ID_ROCKYRABBIT.toLowerCase() === "true"
    : false,
};

module.exports = settings;
