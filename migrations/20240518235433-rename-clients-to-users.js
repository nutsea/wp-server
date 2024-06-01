'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('clients', 'users');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('users', 'clients');
  }
};
