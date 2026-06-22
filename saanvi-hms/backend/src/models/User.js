const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const { ALL_ROLES, ROLES } = require('../config/roles');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    // Stores the bcrypt hash, never the plain password.
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...ALL_ROLES),
    allowNull: false,
    defaultValue: ROLES.PATIENT,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  hooks: {
    // Hash the password automatically whenever it's set or changed,
    // so controllers never have to remember to do it manually.
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

// Instance method to check a plain-text password against the stored hash.
User.prototype.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Strip the password out whenever a user is converted to JSON
// (e.g. sent in an API response), so it never leaks to the client.
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
