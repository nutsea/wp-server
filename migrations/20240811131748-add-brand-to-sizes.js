module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sizes', 'brand', {
      type: Sequelize.STRING,
      allowNull: true,  // можно установить в true, если brand может быть пустым
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sizes', 'brand');
  }
};
