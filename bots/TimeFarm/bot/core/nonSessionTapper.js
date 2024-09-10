const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const settings = require("../config/config");
const app = require("../config/app");
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

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "android";
  }

  async #get_tg_web_data() {
    try {
      const platform = this.#get_platform(this.#get_user_agent());
      const json = {
        initData: this.query_id,
        platform,
      };
      return json;
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

  async #get_access_token(tgWebData, http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/auth/validate-init/v2`,
        JSON.stringify(tgWebData)
      );

      return response.data;
    } catch (error) {
      if (error?.response?.data) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error while getting Access Token: Invalid or expired query id`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error while getting Access Token: ${error}`
        );
      }
      await sleep(3); // 3 seconds delay
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

    let farm_info;
    let user_balance;
    let farmingTime = 0;
    let access_token;

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
        if (currentTime - access_token_created_time >= 1800) {
          const tg_web_data = await this.#get_tg_web_data();
          access_token = await this.#get_access_token(tg_web_data, http_client);
          http_client.defaults.headers[
            "authorization"
          ] = `Bearer ${access_token?.token}`;
          access_token_created_time = currentTime;
          await sleep(2);
        }

        farm_info = await this.api.get_farm_info(http_client);
        user_balance = await this.api.get_balance(http_client);
        if (!farm_info || !user_balance) {
          continue;
        }

        if (
          settings.CLAIM_FRIENDS_REWARD &&
          user_balance?.referral?.availableBalance > 10
        ) {
          const result_claim_friend = await this.api.claim_friends_balance(
            http_client
          );

          if (
            typeof result_claim_friend == "string" &&
            result_claim_friend.toLowerCase() == "ok"
          ) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed friends reward | Reward: <la>${user_balance?.referral?.availableBalance}</la>`
            );
            user_balance = await this.api.get_balance(http_client);
          }
        }

        await sleep(5);

        // Farming
        if (settings.AUTO_FARMING) {
          if (farm_info?.activeFarmingStartedAt && farm_info?.farmingReward) {
            farmingTime = _.floor(
              new Date(farm_info?.activeFarmingStartedAt).getTime() / 1000 +
                farm_info?.farmingReward
            );

            if (farmingTime < currentTime) {
              const result_claim = await this.api.claim_farming(http_client);
              if (result_claim) {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed farming reward | Balance: <la>${result_claim?.balance}</la>`
                );
              }
              const result_start = await this.api.start_farming(http_client);
              if (result_start) {
                farm_info = await this.api.get_farm_info(http_client);
                farmingTime = new _.floor(
                  Date(farm_info?.activeFarmingStartedAt).getTime() / 1000 +
                    farm_info?.farmingReward
                );
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${
                    this.session_name
                  } | 🤖 Started farming | Ends in: <pi>${
                    farmingTime - currentTime > 0
                      ? farmingTime - currentTime
                      : 0
                  }</pi> seconds.`
                );
              }
            } else {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | 🤖 Farming ends in: <pi>${
                  farmingTime - currentTime > 0 ? farmingTime - currentTime : 0
                }</pi> seconds.`
              );
            }
          } else {
            const result_start = await this.api.start_farming(http_client);
            if (result_start) {
              farm_info = await this.api.get_farm_info(http_client);
              farmingTime = _.floor(
                new Date(farm_info?.activeFarmingStartedAt).getTime() / 1000 +
                  farm_info?.farmingReward
              );
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | 🤖 Started farming | Ends in: <pi>${
                  farmingTime - currentTime > 0 ? farmingTime - currentTime : 0
                }</pi> seconds.`
              );
            }
          }
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
