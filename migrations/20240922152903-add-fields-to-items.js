module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые колонки
    await queryInterface.addColumn('items', 'img', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('items', 'min_price', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('items', 'max_price', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('items', 'fav', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('items', 'cart', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    // Получаем все записи из items
    const items = await queryInterface.sequelize.query(
      `SELECT id, item_uid FROM items`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const item of items) {
      // Находим изображение в таблице photos
      const photo = await queryInterface.sequelize.query(
        `SELECT img FROM photos WHERE item_uid = :itemUid LIMIT 1`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { itemUid: item.item_uid }
        }
      );

      if (photo.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE items SET img = :img WHERE id = :itemId`,
          {
            replacements: {
              img: photo[0].img,
              itemId: item.id
            }
          }
        );
      }

      // Находим minPrice и maxPrice в таблице sizes
      const prices = await queryInterface.sequelize.query(
        `SELECT MIN(price) as min_price, MAX(price) as max_price FROM sizes WHERE item_uid = :itemUid`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { itemUid: item.item_uid }
        }
      );

      if (prices.length > 0) {
        const { min_price, max_price } = prices[0];
        if (min_price !== null || max_price !== null) {
          await queryInterface.sequelize.query(
            `UPDATE items SET min_price = :min_price, max_price = :max_price WHERE id = :itemId`,
            {
              replacements: {
                min_price: min_price !== null ? min_price : Sequelize.Null,
                max_price: max_price !== null ? max_price : Sequelize.Null,
                itemId: item.id
              }
            }
          );
        }
      }

      // Считаем количество совпадений в таблице favs
      const favCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM favs WHERE item_uid::text = :itemId`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { itemId: item.id } // Используем item.id
        }
      );

      // Считаем количество совпадений в таблице carts
      const cartCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM carts WHERE item_uid = :itemUid`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { itemUid: item.item_uid }
        }
      );

      // Обновляем fav и cart в таблице items
      await queryInterface.sequelize.query(
        `UPDATE items SET fav = :fav, cart = :cart WHERE id = :itemId`,
        {
          replacements: {
            fav: favCount[0].count,
            cart: cartCount[0].count,
            itemId: item.id
          }
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем колонки
    await queryInterface.removeColumn('items', 'img');
    await queryInterface.removeColumn('items', 'min_price');
    await queryInterface.removeColumn('items', 'max_price');
    await queryInterface.removeColumn('items', 'fav');
    await queryInterface.removeColumn('items', 'cart');
  }
};
