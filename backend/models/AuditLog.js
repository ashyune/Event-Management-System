const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AuditLog model — Issue #30 (EMS Sprint 2)
 * Records every REGISTRATION_CREATED and REGISTRATION_CANCELLED action
 * for compliance and traceability.
 */
const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the user who triggered the action'
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Type of action performed (e.g. REGISTRATION_CREATED, REGISTRATION_CANCELLED)'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Primary key of the affected Registration record'
    },
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'registration',
        comment: 'Type of entity affected'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Extra context — eventId, ticketCode, etc.'
    }
}, {
    tableName: 'AuditLogs',
    timestamps: true,          // createdAt = when the action occurred
    updatedAt: false           // audit records are immutable
});

module.exports = AuditLog;

