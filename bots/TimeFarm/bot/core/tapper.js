const { default: axios } = require("axios");
const logger = require("../../../../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const { SocksProxyAgent } = require("socks-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../../../../utils/userAgents");
const fs = require("fs");
const sleep = require("../../../../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const parser = require("../../../../utils/parser");
const path = require("path");
const moment = require("moment");

class Tapper {
  constructor(tg_client, bot_name) {
    this.bot_name = bot_name;
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.sleep_floodwait = 0;
    this.runOnce = false;
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

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
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

    return "Unknown";
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
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());
      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: await this.tg_client.getInputEntity(app.bot),
            limit: 10,
          })
        );
        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: await this.tg_client.getInputEntity(app.peer),
            })
          );
        }
      }
      const result = await this.tg_client.invoke(
        new Api.messages.RequestWebView({
          peer: await this.tg_client.getInputEntity(app.peer),
          bot: await this.tg_client.getInputEntity(app.bot),
          platform,
          from_bot_menu: false,
          url: app.webviewUrl,
          startParam: "VSLNu6frT0NF3Vw1",
        })
      );
      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      const data = parser.toJson(
        decodeURIComponent(this.#clean_tg_web_data(tgWebData))
      );

      const json = {
        initData: parser.toQueryString(data),
        platform,
      };
      return json;
    } catch (error) {
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      throw error;
    } finally {
      /* if (this.tg_client.connected) {
        await this.tg_client.destroy();
      } */
      await sleep(1);
      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚀 Starting session...`
        );
      }

      this.runOnce = true;
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
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error while getting Access Token: ${error}`
      );
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
    let sleep_time = 0;
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

        //Claim quiz
        if (settings.AUTO_DAILY_QUIZ) {
          const result_daily_quiz = await this.api.get_quiz(http_client);
          const result_daily_quiz_answer = await this.api.get_quiz_answer(
            http_client
          );

          if (
            !_.isEmpty(result_daily_quiz) &&
            !result_daily_quiz?.answer?.isCorrect &&
            !_.isEmpty(result_daily_quiz_answer) &&
            !_.isEmpty(result_daily_quiz_answer?.timefarm) &&
            moment(new Date(result_daily_quiz?.date)).isValid() &&
            moment(
              new Date(result_daily_quiz_answer?.timeFarmDate)
            ).isValid() &&
            moment(new Date(result_daily_quiz_answer?.timeFarmDate)).isSame(
              new Date(result_daily_quiz?.date)
            )
          ) {
            const result_claim_quiz = await this.api.claim_quiz(
              http_client,
              result_daily_quiz_answer?.timefarm
            );
            if (result_claim_quiz?.isCorrect === true) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed daily quiz | Reward: <la>${result_daily_quiz?.reward}</la> | Answer: <bl>${result_daily_quiz_answer?.timefarm}</bl>`
              );
              user_balance = await this.api.get_balance(http_client);
            }
          }
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
                  new Date(farm_info?.activeFarmingStartedAt).getTime() / 1000 +
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
              sleep_time =
                farmingTime - currentTime > 0 ? farmingTime - currentTime : 0;
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
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | 😴 sleeping for ${
            sleep_time > 0 ? sleep_time : settings.SLEEP_BETWEEN_REQUESTS
          } seconds...`
        );
        await sleep(
          sleep_time > 0 ? sleep_time : settings.SLEEP_BETWEEN_REQUESTS
        );
      }
    }
  }
}
module.exports = Tapper;
