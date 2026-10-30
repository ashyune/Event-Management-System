const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');

const Registration = sequelize.define('Registration', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'events',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    registrationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'confirmed'
    },
    ticketCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'registrations',
    timestamps: true
});

// Define model associations
Registration.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Registration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' });
Event.hasMany(Registration, { foreignKey: 'eventId', as: 'registrations' });

module.exports = Registration;

