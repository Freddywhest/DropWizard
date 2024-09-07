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
          startParam: "1167045062",
        })
      );
      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      const data = parser.toJson(
        decodeURIComponent(this.#clean_tg_web_data(tgWebData))
      );

      return parser.toQueryString(data);
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
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
      return null;
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
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 😴 sleeping for ${settings.SLEEP_BETWEEN_REQUESTS} seconds...`
        );
        await sleep(settings.SLEEP_BETWEEN_REQUESTS);
      }
    }
  }
}
module.exports = Tapper;
