const sequelize = require('../db')
const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')

const Item = sequelize.define('items', {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    brand: { type: DataTypes.STRING },
    model: { type: DataTypes.STRING },
    item_uid: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING },
    orders: { type: DataTypes.INTEGER, defaultValue: 0 },
})

const Photo = sequelize.define('photos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    img: { type: DataTypes.STRING, allowNull: false },
    item_uid: { type: DataTypes.STRING, allowNull: false }
})

const Size = sequelize.define('sizes', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    size: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    item_uid: { type: DataTypes.STRING, allowNull: false },
    size_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'EU' },
    size_default: { type: DataTypes.STRING },
    item_category: { type: DataTypes.STRING }
})

// const SizesTable = sequelize.define('sizes_table', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     size_type: { type: DataTypes.STRING, allowNull: false },
//     size_default: { type: DataTypes.STRING, allowNull: false },
//     size: { type: DataTypes.STRING, allowNull: false },
//     item_uid: { type: DataTypes.STRING, allowNull: false }
// })

const User = sequelize.define('user', {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING }
})

const Fav = sequelize.define('favs', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_uid: { type: DataTypes.STRING, allowNull: false },
})

const Cart = sequelize.define('cart', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_uid: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
    size_type: { type: DataTypes.STRING, allowNull: false },
})

const Order = sequelize.define('orders', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    comment: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, allowNull: false },
    executor: { type: DataTypes.STRING, allowNull: false },
    recipient: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    cargo_cost: { type: DataTypes.FLOAT, allowNull: false },
    sdek_cost: { type: DataTypes.FLOAT, allowNull: false },
    cargo_track: { type: DataTypes.STRING, allowNull: false },
    sdek_track: { type: DataTypes.STRING, allowNull: false },
    delivery_cost: { type: DataTypes.STRING, allowNull: false },
    course: { type: DataTypes.FLOAT, allowNull: false },
    fee: { type: DataTypes.FLOAT, allowNull: false },
    cost: { type: DataTypes.FLOAT, allowNull: false },
    paid: { type: DataTypes.FLOAT, allowNull: false }
})

const OrderItem = sequelize.define('order_items', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    item_uid: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.STRING, allowNull: false },
})

const OrderPhoto = sequelize.define('order_photos', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    img: { type: DataTypes.STRING, allowNull: false },
})

const Story = sequelize.define('stories', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    img: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
})

const Auth = sequelize.define('auth', {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true, allowNull: false, unique: true },
    code: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'wait' },
    chat_id: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING }
})

User.hasMany(Fav, { foreignKey: 'client_id' })
Fav.belongsTo(User, { foreignKey: 'client_id' })

User.hasMany(Cart, { foreignKey: 'client_id' })
Cart.belongsTo(User, { foreignKey: 'client_id' })

User.hasMany(Order, { foreignKey: 'client_id' })
Order.belongsTo(User, { foreignKey: 'client_id' })

Order.hasMany(OrderItem, { foreignKey: 'order_id' })
OrderItem.belongsTo(Order, { foreignKey: 'order_id' })

Order.hasMany(OrderPhoto, { foreignKey: 'order_id' })
OrderPhoto.belongsTo(Order, { foreignKey: 'order_id' })

module.exports = {
    Auth,
    Item,
    Photo,
    Size,
    // SizesTable,
    User,
    Fav,
    Cart,
    Order,
    OrderItem,
    OrderPhoto,
    Story
}