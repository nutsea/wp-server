'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'surname', {
      type: Sequelize.STRING,
      allowNull: true // Делаем поле необязательным
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'surname', {
      type: Sequelize.STRING,
      allowNull: false // Возвращаем обратно к обязательному полю в случае отката
    });
  }
};
