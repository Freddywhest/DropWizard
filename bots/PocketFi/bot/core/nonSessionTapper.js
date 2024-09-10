const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const settings = require("../config/config");
const user_agents = require("../../../../utils/userAgents");
const fs = require("fs");
const sleep = require("../../../../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const path = require("path");
const _isArray = require("../../../../utils/_isArray");
const { HttpsProxyAgent } = require("https-proxy-agent");

class NonSessionTapper {
  constructor(query_id, query_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = query_name;
    this.query_id = query_id;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      return this.query_id;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
      );
      throw error;
    } finally {
      /* await this.tg_client.disconnect(); */
      await sleep(1);
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚀 Starting session...`
      );
    }
  }

  async #check_proxy(http_client, proxy) {
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

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;

    let mining_info;
    let sleep_time = 0;

    if (settings.USE_PROXY_FROM_FILE && proxy) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }
    while (true) {
      try {
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 3600) {
          const tg_web_data = await this.#get_tg_web_data();
          if (
            _.isNull(tg_web_data) ||
            _.isUndefined(tg_web_data) ||
            !tg_web_data ||
            _.isEmpty(tg_web_data)
          ) {
            continue;
          }

          http_client.defaults.headers["telegramrawdata"] = tg_web_data;
          access_token_created_time = currentTime;
          await sleep(2);
        }

        mining_info = await this.api.get_mining_info(http_client);
        if (_.isEmpty(mining_info)) {
          continue;
        }

        //Creating user
        if (_.isNull(mining_info?.userMining)) {
          await this.api.start_param(http_client);
          await this.api.create_mining_user(http_client);
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ User created successfully. Restarting the process...`
          );
          continue;
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💸 Balance: <la>${mining_info?.userMining?.gotAmount}</la> | Earn per hour: <pi>${mining_info?.userMining?.speed}</pi> | Mined: <ye>${mining_info?.userMining?.miningAmount}</ye>`
        );

        await sleep(2);

        if (settings.AUTO_MINE && mining_info?.userMining?.miningAmount > 0.1) {
          const claim_mining = await this.api.claim_mining(http_client);
          if (!_.isEmpty(claim_mining)) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ Mining successfully claimed | Balance: <bl>${claim_mining?.userMining?.gotAmount}</bl> (<gr>+${mining_info?.userMining?.miningAmount}</gr>)`
            );
          }
          mining_info = await this.api.get_mining_info(http_client);
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        let ran_sleep;
        if (_isArray(settings.SLEEP_BETWEEN_REQUESTS)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_REQUESTS[0],
              settings.SLEEP_BETWEEN_REQUESTS[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_REQUESTS)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_REQUESTS + ran_add;
        } else {
          ran_sleep = _.random(450, 800);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
        );
        await sleep(ran_sleep);
      }
    }
  }
}
module.exports = NonSessionTapper;
