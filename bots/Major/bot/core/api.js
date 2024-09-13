const app = require("../config/app");
const logger = require("../../../../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = session_name;
  }

  async get_user_info(http_client, user_id) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/users/${user_id}/`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting user info: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting user info: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_position(http_client, user_id) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/users/top/position/${user_id}/?`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status <= 599) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting position:</b>: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting position:</b>: ${error.message}`
        );
      }

      return null;
    }
  }

  async visit_streak(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/user-visits/streak/`
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting visit streak:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting visit streak:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_referrals(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/users/referrals/`
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting referrals:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting referrals:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_tasks(http_client, is_daily) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/tasks/?is_daily=${is_daily}`
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting tasks:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting tasks:</b> ${error.message}`
        );
      }

      return [];
    }
  }

  async get_bonus(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/bonuses/coins/`
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting bonus:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting bonus:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_roulette(http_client) {
    try {
      const response = await http_client.get(`${app.apiUrl}/api/roulette/`);
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting roulette:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting roulette:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_swipe(http_client) {
    try {
      const response = await http_client.get(`${app.apiUrl}/api/swipe_coin/`);
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return error?.response?.status;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting swipe:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting swipe:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async validate_query_id(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/auth/tg/`,
        JSON.stringify(data)
      );

      if (!_.isEmpty(response?.data)) {
        return true;
      }
      return false;
    } catch (error) {
      if (error?.response?.status >= 500) {
        return "server";
      }
      if (
        error?.response?.data?.message
          ?.toLowerCase()
          ?.includes("invalid init data signature") ||
        error?.response?.status == 401
      ) {
        return false;
      }

      throw error;
    }
  }

  async claim_visit(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/user-visits/visit/`
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming visit:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming visit:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async check_joined_major_channel(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/tasks/`,
        JSON.stringify({ task_id: 27 })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status == 400 && error?.response?.data?.detail) {
        return error?.response?.data;
      }

      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming visit:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming visit:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_task(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/tasks/`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sever Error with ${this.bot_name} while <b>claiming task</b>. Retrying again...`
        );

        return "Retry";
      }
      if (error?.response?.status == 400 && error?.response?.data?.detail) {
        return error?.response?.data;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming task:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming task:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_bonus(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/bonuses/coins/`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status == 400 && error?.response?.data?.detail) {
        return error?.response?.data;
      }

      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming bonus:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming bonus:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_roulette(http_client) {
    try {
      const response = await http_client.post(`${app.apiUrl}/api/roulette/`);
      return response.data;
    } catch (error) {
      if (error?.response?.status == 400 && error?.response?.data?.detail) {
        return error?.response?.data;
      }
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming roulette:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming roulette:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_swipe(http_client, coins) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/swipe_coin/`,
        JSON.stringify({ coins })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status == 400 && error?.response?.data?.detail) {
        return error?.response?.data;
      }
      if (
        (error?.response?.status >= 500 && error?.response?.status <= 599) ||
        error?.response?.status == 400
      ) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming swipe coin:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming swipe coin:</b> ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
