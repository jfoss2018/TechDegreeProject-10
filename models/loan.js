'use strict';
module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Book selection is required."
        }
      }
    },
    patron_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Patron selection is required."
        }
      }
    },
    loaned_on: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        is: {
          args: ["^[0-9]{4}-[0-9]{2}-[0-9]{2}$", 'i'],
          msg: "Loaned on date must be formatted as \"YYYY-MM-DD\"."
        }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        is: {
          args: ["^[0-9]{4}-[0-9]{2}-[0-9]{2}$", 'i'],
          msg: "Return by date must be formatted as \"YYYY-MM-DD\"."
        }
      }
    },
    returned_on: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        is: {
          args: ["^[0-9]{4}-[0-9]{2}-[0-9]{2}$", 'i'],
          msg: "Returned on date must be formatted as \"YYYY-MM-DD\"."
        }
      }
    }
  }, {
    timestamps: false,
    hooks: {
      beforeValidate: (loan, options) => {
        if (loan.returned_on === "" || loan.returned_on === "null") {
          loan.returned_on = null;
        }
      }
    }
  });
  Loan.associate = function(models) {
    // associations can be defined here
  };
  return Loan;
};
