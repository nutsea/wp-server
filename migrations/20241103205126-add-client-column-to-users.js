'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'client', {
            type: Sequelize.STRING,
            allowNull: true, // установи `false`, если колонка обязательна
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'client');
    }
};
