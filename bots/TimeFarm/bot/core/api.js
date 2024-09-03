const app = require("../config/app");
const logger = require("../../../../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async get_farm_info(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/v1/farming/info`
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting farming info: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting farming info: ${error.message}`
        );
      }

      return null;
    }
  }

  async get_balance(http_client) {
    try {
      const response = await http_client.get(`${app.apiUrl}/api/v1/balance`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting balance:</b>: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting balance:</b>: ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_friends_balance(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/balance/referral/claim`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming friends balance:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming friends balance:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async start_farming(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/farming/start`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>starting farming:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>starting farming:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_quiz(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/api/v1/daily-questions`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting quiz:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting quiz:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_quiz_answer(http_client) {
    try {
      const response = await http_client.get(`${app.quiz}`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting quiz answer:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting quiz answer:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_farming(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/farming/finish`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming farm reward:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming farm reward:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_quiz(http_client, answer) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/daily-questions`,
        JSON.stringify({ answer })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming quiz:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming quiz:</b> ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
