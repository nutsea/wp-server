'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('constants', 'type', {
      type: Sequelize.STRING,
      allowNull: true // Измените на false, если поле должно быть обязательным
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('constants', 'type');
  }
};
