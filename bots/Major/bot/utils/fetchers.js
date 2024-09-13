const app = require("../config/app");
const logger = require("../../../../utils/logger");
const sleep = require("../../../../utils/sleep");

class Fetchers {
  constructor(api, session_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = session_name;
    this.api = api;
  }
  async get_access_token(tgWebData, http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/auth/tg/`,
        JSON.stringify(tgWebData)
      );

      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return "server";
      }
      if (error?.response?.message) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Error while getting Access Token: ${error.response.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Error while getting Access Token: ${error}`
        );
      }
      return null;
      await sleep(3); // 3 seconds delay
    }
  }

  async check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }
}

module.exports = Fetchers;
