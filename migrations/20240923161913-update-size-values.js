'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // обновляем значения в поле size
    await queryInterface.sequelize.query(`
      UPDATE sizes
      SET size = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(size, '½', ' 1/2'), '⅔', ' 2/3'), '⅓', ' 1/3'), '¼', ' 1/4'), '¾', ' 3/4')
    `);

    // обновляем значения в поле size_default
    await queryInterface.sequelize.query(`
      UPDATE sizes
      SET size_default = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(size_default, '½', ' 1/2'), '⅔', ' 2/3'), '⅓', ' 1/3'), '¼', ' 1/4'), '¾', ' 3/4')
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // откат изменений, если нужно (необязательно)
    await queryInterface.sequelize.query(`
      UPDATE sizes
      SET size = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(size, ' 1/2', '½'), ' 2/3', '⅔'), ' 1/3', '⅓'), ' 1/4', '¼'), ' 3/4', '¾')
    `);

    await queryInterface.sequelize.query(`
      UPDATE sizes
      SET size_default = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(size_default, ' 1/2', '½'), ' 2/3', '⅔'), ' 1/3', '⅓'), ' 1/4', '¼'), ' 3/4', '¾')
    `);
  }
};
