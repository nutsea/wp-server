'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sizes', 'price_12', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('sizes', 'delivery_12', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('sizes', 'price_12');
    await queryInterface.removeColumn('sizes', 'delivery_12');
  }
};
