'use strict';
module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Title is required."
        }
      }
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Author is required."
        }
      }
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Genre is required."
        }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        notEmpty: true,
        is: {
          args: ["^[0-9]{4}$", 'i'],
          msg: "First Published must be a 4 digit year."
        }
      }
    }
  }, {
    timestamps: false,
    hooks: {
      beforeValidate: (book, options) => {
        if (book.first_published === "" || book.first_published === "null") {
          book.first_published = null;
        }
      }
    }
  });
  Book.associate = function(models) {
    // associations can be defined here
  };
  return Book;
};
