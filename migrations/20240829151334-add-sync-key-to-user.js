module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'sync_key', {
      type: Sequelize.STRING,
      allowNull: true, // настройка по твоему усмотрению
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'sync_key');
  }
};
