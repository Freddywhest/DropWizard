const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const { SocksProxyAgent } = require("socks-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../../../../utils/userAgents");
const fs = require("fs");
const sleep = require("../../../../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const path = require("path");
const _isArray = require("../../../../utils/_isArray");

class NonSessionTapper {
  constructor(query_id, query_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = query_name;
    this.query_id = query_id;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name);
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
        proxy_url = `socks${proxy.socksType}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `socks${proxy.socksType}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new SocksProxyAgent(proxy_url);
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
      const json = {
        query: this.query_id,
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
        `${app.gatewayApiUrl}/api/v1/auth/provider/PROVIDER_TELEGRAM_MINI_APP`,
        JSON.stringify(tgWebData)
      );

      return response.data?.token;
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error, retrying again after sleep...`
        );
        await sleep(1);
        return null;
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error while getting Access Token: ${error}`
        );
        await sleep(3); // 3 seconds delay
      }
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

    let profile_data;
    let sleep_reward = 0;
    let access_token;
    let tasks = [];

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
        const currentTime = Date.now() / 1000;
        if (currentTime - access_token_created_time >= 1800) {
          const tg_web_data = await this.#get_tg_web_data();
          access_token = await this.#get_access_token(tg_web_data, http_client);
          http_client.defaults.headers[
            "authorization"
          ] = `Bearer ${access_token?.access}`;
          access_token_created_time = currentTime;
          await sleep(2);
        }

        profile_data = await this.api.get_user_data(http_client);
        const time = await this.api.get_time(http_client);
        const checkJWT = await this.api.check_jwt(http_client);

        if (!checkJWT || !profile_data) {
          profile_data = null;
          access_token = null;
          access_token_created_time = 0;
          continue;
        }

        // Daily reward
        if (currentTime >= sleep_reward) {
          if (settings.CLAIM_DAILY_REWARD) {
            const daily_reward = await this.api.daily_reward(http_client);
            if (daily_reward) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed daily reward`
              );
            } else {
              sleep_reward = currentTime + 18000;
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | ⏰ Daily reward not available. Next check: <b><lb>${new Date(
                  sleep_reward * 1000
                )}</lb></b>`
              );
            }
          }
        }

        if (settings.CLAIM_TASKS_REWARD) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Claiming of tasks is not available for everyone yet. <br /> Set <b><la>CLAIM_TASKS_REWARD=False</la></b> to disable this message.`
          );
        }

        // Sleep
        await sleep(3);

        // Tribe
        if (settings.AUTO_JOIN_TRIBE) {
          const check_my_tribe = await this.api.check_my_tribe(http_client);
          if (check_my_tribe === false) {
            const get_tribes = await this.api.get_tribes(http_client);
            if (
              Array.isArray(get_tribes?.items) &&
              get_tribes?.items?.length > 0
            ) {
              await this.api.join_tribe(http_client, get_tribes?.items[0].id);
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Joined tribe: <lb>${get_tribes?.items[0].chatname}</lb>`
              );
            }
          }
        }

        if (time?.now >= profile_data?.farming?.endTime) {
          if (settings.AUTO_CLAIM_FARMING_REWARD) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Claiming farming reward...`
            );
            const farm_reward = await this.api.claim_farming(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed farming reward | Balance <lb>${farm_reward?.availableBalance}</lb> | Available Play Pass <ye>${farm_reward?.playPasses}</ye>`
            );
          }
        } else if (time?.now >= profile_data?.farming?.startTime) {
          // in hours
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${
              this.session_name
            } | Farming ends in ${Math.floor(
              (profile_data?.farming?.endTime - time?.now) / 1000 / 60 / 60
            )} hour(s)`
          );
        }

        // Farming
        if (!profile_data?.farming) {
          if (settings.AUTO_START_FARMING) {
            const farm_response = await this.api.start_farming(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | Farming started  | End Time: <la>${new Date(
                farm_response?.endTime
              )}</la> | Earnings Rate: <pi>${farm_response?.earningsRate}</pi>`
            );
          }
        }

        // Sleep
        await sleep(3);

        // Re-assign profile data
        profile_data = await this.api.get_user_data(http_client);
        if (settings.AUTO_PLAY_GAMES) {
          // Game
          while (profile_data?.playPasses > 0) {
            profile_data = await this.api.get_user_data(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | sleeping for 20 seconds before starting game...`
            );
            await sleep(20);
            const game_response = await this.api.start_game(http_client);
            if (game_response?.gameId) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎲  Game started | Duration: <la> 35 seconds</la>`
              );
              await sleep(35);
              const points = _.random(100, 200);
              const data = {
                gameId: game_response?.gameId,
                points: points,
              };
              const game_reward = await this.api.claim_game_reward(
                http_client,
                data
              );

              // Re-assign profile data
              profile_data = await this.api.get_user_data(http_client);
              if (game_reward.toLowerCase() == "ok") {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎲  Game ended  | Earnings: <gr>+${points}</gr> Blum points | Available Play Passes: <ye>${profile_data?.playPasses}</ye> | Balance: <lb>${profile_data?.availableBalance}</lb>`
                );
              }
            }
          }
        }

        // Sleep
        await sleep(3);

        if (settings.CLAIM_FRIENDS_REWARD) {
          // Friend reward
          const friend_reward = await this.api.get_friend_balance(http_client);
          if (
            friend_reward?.canClaim &&
            !isNaN(parseInt(friend_reward?.amountForClaim))
          ) {
            if (parseInt(friend_reward?.amountForClaim) > 0) {
              const friend_reward_response =
                await this.api.claim_friends_balance(http_client);
              if (friend_reward_response?.claimBalance) {
                // Re-assign profile data
                profile_data = await this.api.get_user_data(http_client);
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed friends reward <gr>+${friend_reward_response?.claimBalance}</gr> | Balance: <lb>${profile_data?.availableBalance}</lb>`
                );
              }
            }
          }
        }
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        let ran_sleep;
        if (_isArray(settings.SLEEP_BETWEEN_TAP)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_TAP[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_TAP[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_TAP[0],
              settings.SLEEP_BETWEEN_TAP[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_TAP)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_TAP + ran_add;
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
