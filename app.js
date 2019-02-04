!function() {

// Requirements
const express = require('express');
const sequelize = require('./models').sequelize;
const Sequelize = require('./models').Sequelize;
const Book = require('./models').Book;
const Loan = require('./models').Loan;
const Patron = require('./models').Patron;
const bodyParser = require('body-parser');

// Table associations
Loan.belongsTo(Book, {foreignKey: 'book_id', targetKey: 'id'});
Loan.belongsTo(Patron, {foreignKey: 'patron_id', targetKey: 'id'});
Book.hasMany(Loan, {foreignKey: 'book_id', sourceKey: 'id'});
Patron.hasMany(Loan, {foreignKey: 'patron_id', sourceKey: 'id'});

// Declaring app as express method.
const app = express();
// Requirement
app.locals.moment = require('moment');

// Set up the public folder to serve static files.
app.use('/static', express.static('public'));
// Set app to use bodyParser.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Set view engine to look for .pug files.
app.set('view engine', 'pug');

// Globally defined object literal.
let searchCriteria = {};
// Since each page with a search box can post from multiple forms, the following
// function helps keep track of previously posted info in order to re-serve the
// page with the correct search info populating each search field.
function searchCrit (body) {
  if (body.search) {
    if (body.search_title) {
      searchCriteria.search_title = body.search_title;
    } else {
      searchCriteria.search_title = null;
    }
    if (body.search_author) {
      searchCriteria.search_author = body.search_author;
    } else {
      searchCriteria.search_author = null;
    }
    if (body.search_genre) {
      searchCriteria.search_genre = body.search_genre;
    } else {
      searchCriteria.search_genre = null;
    }
    if (body.search_first_name) {
      searchCriteria.search_first_name = body.search_first_name;
    } else {
      searchCriteria.search_first_name = null;
    }
    if (body.search_last_name) {
      searchCriteria.search_last_name = body.search_last_name;
    } else {
      searchCriteria.search_last_name = null;
    }
    if (body.search_library_id) {
      searchCriteria.search_library_id = body.search_library_id;
    } else {
      searchCriteria.search_library_id = null;
    }
    searchCriteria.page = 1;
  } else {
    searchCriteria.page = parseInt(body.page);
  }
}

// This is a helper function that enables case insensitive partial string searches
// from the search forms.
function findValue (searchText, column) {
  return sequelize.where(sequelize.fn('LOWER', sequelize.col(column)), 'LIKE', '%' + searchText + '%')
}

// This function rebuilds and returns the search option object each time the page gets posted
// to using req.body or previously searched criteria from the globally defined
// searchCriteria object, whichever exists.
function searchCondition (body, call) {
  let searchCond = {};
  let whereCond = {};
  let conditionCount = 0;
  const includeArray = [{model: Loan, required: false}];
  searchCond.include = includeArray;
  if (body.page) {
    if (searchCriteria.search_title) {
      whereCond.title = findValue(searchCriteria.search_title, 'title');
      conditionCount += 1;
    }
    if (searchCriteria.search_author) {
      whereCond.author = findValue(searchCriteria.search_author, 'author');
      conditionCount += 1;
    }
    if (searchCriteria.search_genre) {
      whereCond.genre = findValue(searchCriteria.search_genre, 'genre');
      conditionCount += 1;
    }
    if (searchCriteria.search_first_name) {
      whereCond.first_name = findValue(searchCriteria.search_first_name, 'first_name');
      conditionCount += 1;
    }
    if (searchCriteria.search_last_name) {
      whereCond.last_name = findValue(searchCriteria.search_last_name, 'last_name');
      conditionCount += 1;
    }
    if (searchCriteria.search_library_id) {
      whereCond.library_id = findValue(searchCriteria.search_library_id, 'library_id');
      conditionCount += 1;
    }
  } else if (body.search) {
    if (body.search_title) {
      whereCond.title = findValue(body.search_title, 'title');
      conditionCount += 1;
    }
    if (body.search_author) {
      whereCond.author = findValue(body.search_author, 'author');
      conditionCount += 1;
    }
    if (body.search_genre) {
      whereCond.genre = findValue(body.search_genre, 'genre');
      conditionCount += 1;
    }
    if (body.search_first_name) {
      whereCond.first_name = findValue(body.search_first_name, 'first_name');
      conditionCount += 1;
    }
    if (body.search_last_name) {
      whereCond.last_name = findValue(body.search_last_name, 'last_name');
      conditionCount += 1;
    }
    if (body.search_library_id) {
      whereCond.library_id = findValue(body.search_library_id, 'library_id');
      conditionCount += 1;
    }
  }
  if (conditionCount > 0) {
    searchCond.where = whereCond;
  }
  if (call === 2) {
    searchCond.offset = ((searchCriteria.page - 1) * 10);
    searchCond.limit = 10;
  }
  return searchCond;
}

// This function builds the error in case of a server error.
function serverError() {
  const err = new Error('Server Error');
  err.status = 500;
  return err;
}

// This function builds the error in case of a not found error.
function notFoundError() {
  const err = new Error('Not Found');
  err.status = 404;
  return err;
}

// Home route renders the home page.
app.get('/', (req, res, next) => {
  res.render('home');
});

// The list all books route contains a search box, and gets paginated if there
// are more than 10 records.
app.get('/books', (req, res, next) => {
  searchCriteria = {};
  let pages;
  let buttons = [];
  Book.findAll().then(function(books) {
    pages = Math.ceil(books.length / 10);
    for (let i = 0; i < pages; i += 1) {
      buttons.push(i+1);
    }
    if (buttons.length === 1) {
      buttons = [];
      res.render('books', {books: books, buttons: buttons});
    } else {
      Book.findAll({
        limit: 10
      }).then(function(books) {
        res.render('books', {books: books, buttons: buttons});
      }).catch(function(err) {
        next(serverError());
      });
    }
  });
});

// The list all books post route accepts search and page number criteria, and
// displays the corresponding query on the list all books route.
app.post('/books', (req, res, next) => {
  searchCrit(req.body);
  let pages;
  let buttons = [];
  let search1 = searchCondition(req.body, 1);
  Book.findAll(
    search1
  ).then(function(books) {
    pages = Math.ceil(books.length / 10);
    for (let i = 0; i < pages; i += 1) {
      buttons.push(i+1);
    }
    if (buttons.length === 1) {
      buttons = [];
      res.render('books', {books: books, buttons: buttons, body: searchCriteria});
    } else {
      let search2 = searchCondition(req.body, 2);
      Book.findAll(
        search2
      ).then(function(books) {
        res.render('books', {books: books, buttons: buttons, body: searchCriteria});
      }).catch(function(err) {
        next(serverError);
      });
    }
  });
});

// The new book route displays the new book form.
app.get('/books/new', (req, res, next) => {
  res.render('new_book', {book: Book.build()});
});

// The new book post route tests form submissions against database validation
// criteria, and displays the appropriate errors if they exist.
app.post('/books/new', (req, res, next) => {
  Book.create(req.body).then(function(book) {
    res.redirect('/books');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      res.render('new_book', {
        book: Book.build(req.body),
        body: req.body,
        errors: err.errors
      })
    } else {
      next(serverError());
    }
  });
});

// The overdue books route displays only the books whose corresponding loans have
// not been returned by their return_by date.
app.get('/books/overdue', (req, res, next) => {
  Loan.findAll({
    where: {
      return_by: {
        [Sequelize.Op.lt]: new Date()
      },
      returned_on: null
    },
    include: [
      {
        model: Book
      }
    ]
  }).then(function(loans) {
    res.render('overdue_books', {loans: loans});
  }).catch(function(err) {
    next(serverError());
  });
});

// The checked out books route displays all books that are checked out, or all
// records that do not contain a returned_on fieldvalue.
app.get('/books/checked_out', (req, res, next) => {
  Loan.findAll({
    where: {
      returned_on: null
    },
    include: [
      {
        model: Book
      }
    ]
  }).then(function(loans) {
    res.render('checked_out_books', {loans: loans});
  }).catch(function(err) {
    next(serverError());
  });
});

// The book detail route displays the information concerning the book with the
// corresponding ID and its loan history.
app.get('/books/:id', (req, res, next) => {
  let bookDetail;
  Book.findById(req.params.id).then(function(book) {
    if (!book) {
      next(notFoundError());
    }
    bookDetail = book;
  }).then(Loan.findAll({
    where: {
      book_id: req.params.id
    },
    include: [{
      model: Book,
    },
    {
      model: Patron
    }
  ]
  }).then(function(loans) {
    res.render('book_detail', {book: bookDetail, loans: loans});
  }).catch(function(err) {
    next(serverError());
  }));
});

// The book detail post route allows changes to be made to the book details. This
// route also checks submissions against database validation criteria, and displays
// all errors if they exist.
app.post('/books/:id', (req, res, next) => {
  Book.findById(req.params.id).then(function(book) {
    if (!book) {
      next(notFoundError());
    }
    return book.update(req.body);
  }).then(function(book) {
    res.redirect('/books');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      let newBook = Book.build(req.body);
      newBook.id = req.params.id;
      Loan.findAll({
        where: {
          book_id: req.params.id
        },
        include: [{
          model: Book,
        },
        {
          model: Patron
        }
      ]
      }).then(function(loans) {
        res.render('book_detail', {
          book: newBook,
          loans: loans,
          body: req.body,
          errors: err.errors
        });
      });
    } else {
      next(serverError());
    }
  });
});

// The book return route allows any loaned book that does not have a returned_on
// fieldvalue to be returned. This route displays the return form.
app.get('/books/loan/:id/return', (req, res, next) => {
  Loan.findById(req.params.id).then(function(checkLoan) {
    if (!checkLoan) {
      next(notFoundError());
    }
  });
  Loan.findAll({
    where: {
      id: req.params.id
    },
    include: [
      {
        model: Book
      },
      {
        model: Patron
      }
    ]
  }).then(function(loan) {
    res.render('book_return', {loan: loan});
  }).catch(function(err) {
    next(serverError());
  });
});

// The return book post route allows the returned_on fieldvalue to be submitted.
app.post('/books/loan/:id/return', (req, res, next) => {
  Loan.findById(req.params.id).then(function(loan) {
    if (!loan) {
      next(notFoundError());
    }
    return loan.update(req.body);
  }).then(function(loan) {
    res.redirect('/loans');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      Loan.findAll({
        where: {
          id: req.params.id
        },
        include: [
          {
            model: Book
          },
          {
            model: Patron
          }
        ]
      }).then(function(loan) {
        res.render('book_return', {
          loan: loan,
          body: req.body,
          errors: err.errors
        });
      });
    } else {
      next(serverError());
    }
  });
});

// The list all patrons route contains a search box, and gets paginated if there
// are more than 10 records.
app.get('/patrons', (req, res, next) => {
  searchCriteria = {};
  let pages;
  let buttons = [];
  Patron.findAll().then(function(patrons) {
    pages = Math.ceil(patrons.length / 10);
    for (let i = 0; i < pages; i += 1) {
      buttons.push(i+1);
    }
    if (buttons.length === 1) {
      buttons = [];
      res.render('patrons', {patrons: patrons, buttons: buttons});
    } else {
      Patron.findAll({
        limit: 10
      }).then(function(patrons) {
        res.render('patrons', {patrons: patrons, buttons: buttons});
      }).catch(function(err) {
        next(serverError());
      });
    }
  });
});

// The list all patrons post route accepts search and page number criteria, and
// displays the corresponding query on the list all patrons route.
app.post('/patrons', (req, res, next) => {
  searchCrit(req.body);
  let pages;
  let buttons = [];
  let search1 = searchCondition(req.body, 1);
  Patron.findAll(
    search1
  ).then(function(patrons) {
    pages = Math.ceil(patrons.length / 10);
    for (let i = 0; i < pages; i += 1) {
      buttons.push(i+1);
    }
    if (buttons.length === 1) {
      buttons = [];
      res.render('patrons', {patrons: patrons, buttons: buttons, body: searchCriteria});
    } else {
      let search2 = searchCondition(req.body, 2);
      Patron.findAll(
        search2
      ).then(function(patrons) {
        res.render('patrons', {patrons: patrons, buttons: buttons, body: searchCriteria});
      }).catch(function(err) {
        next(serverError());
      });
    }
  });
});

// The new patrons route displays the new patron form.
app.get('/patrons/new', (req, res, next) => {
  res.render('new_patron', {patron: Patron.build()});
});

// The new patron post route tests submissions against database validation criteria
// If any errors in creating a new patron exist, they will get displayed.
app.post('/patrons/new', (req, res, next) => {
  Patron.create(req.body).then(function(patron) {
    res.redirect('/patrons');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      res.render('new_patron', {
        book: Patron.build(req.body),
        body: req.body,
        errors: err.errors
      })
    } else {
      next(serverError());
    }
  });
});

// The patrons detail route displays the details concerning the patron whose corresponding
// id matches that searched for or selected.
app.get('/patrons/:id', (req, res, next) => {
  let patronDetail;
  Patron.findById(req.params.id).then(function(patron) {
    if (!patron) {
      next(notFoundError());
    }
    patronDetail = patron;
  }).then(Loan.findAll({
    where: {
      patron_id: req.params.id
    },
    include: [{
      model: Book,
    },
    {
      model: Patron
    }
  ]
  }).then(function(loans) {
    res.render('patron_detail', {patron: patronDetail, loans: loans});
  }).catch(function(err) {
    next(serverError());
  }));
});

// The patrons detail post route allows edits to be made to the patron's details.
// This route tests submissions against database validation criteria. If any errors
// exist, they will be displayed before accepting the submission.
app.post('/patrons/:id', (req, res, next) => {
  Patron.findById(req.params.id).then(function(patron) {
    if (!patron) {
      next(notFoundError());
    }
    return patron.update(req.body);
  }).then(function(patron) {
    res.redirect('/patrons');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      let newPatron = Patron.build(req.body);
      newPatron.id = req.params.id;
      Loan.findAll({
        where: {
          patron_id: req.params.id
        },
        include: [{
          model: Book,
        },
        {
          model: Patron
        }
      ]
      }).then(function(loans) {
        res.render('patron_detail', {
          patron: newPatron,
          loans: loans,
          body: req.body,
          errors: err.errors
        });
      });
    } else {
      next(serverError());
    }
  });
});

// The list all loans route lists all loans.
app.get('/loans', (req, res, next) => {
  Loan.findAll({
    include: [{
      model: Book
    },
    {
      model: Patron
    }
  ]
}).then(function(loans) {
    res.render('loans', {loans: loans});
  }).catch(function(err) {
    next(ServerError());
  });
});

// The new loans route displays the new loan form.
app.get('/loans/new', (req, res, next) => {
  let allBooks;
  let allPatrons;
  Book.findAll({
    include: [
      {
        model: Loan,
        where: {
          returned_on: null
        },
        required: false
      }
    ]
  }).then(function(books) {
    allBooks = books;
  }).then(Patron.findAll().then(function(patrons) {
    res.render('new_loan', {patrons: patrons, books: allBooks});
  })).catch(function(err) {
    next(serverError());
  });
});

// The new loan post route allows new loans to be created. This route tests submissions
// against database validation criteria. If any errors exist, they will be displayed.
// The loaned_on and return_by fields are auto populated with today's date and
// the date 7 days from now. Also, if a book is out on loan, it will not be
// available to lend again until it is returned.
app.post('/loans/new', (req, res, next) => {
  Loan.create(req.body).then(function(loan) {
    res.redirect('/loans');
  }).catch(function(err) {
    if (err.name === "SequelizeValidationError") {
      let allBooks;
      let allPatrons;
      Book.findAll({
        include: [
          {
            model: Loan,
            where: {
              returned_on: null
            },
            required: false
          }
        ]
      }).then(function(books) {
        allBooks = books;
      }).then(Patron.findAll().then(function(patrons) {
        res.render('new_loan', {
          books: allBooks,
          patrons: patrons,
          body: req.body,
          errors: err.errors
        });
      }));
    } else {
      next(serverError());
    }
  });
});

// The overdue loans route lists all loans that are currently overdue (The current
// date is after the return_by date and the loan does not have a returned_on
// fieldvalue)
app.get('/loans/overdue', (req, res) => {
  Loan.findAll({
    where: {
      return_by: {
        [Sequelize.Op.lt]: new Date()
      },
      returned_on: null
    },
    include: [
      {
        model: Book
      },
      {
        model: Patron
      }
    ]
  }).then(function(loans) {
    res.render('overdue_loans', {loans: loans});
  }).catch(function(err) {
    next(serverError());
  });
});

// The checked out loans route displays all loans that are currently open. (Loans
// that do not have a returned_on fieldvalue)
app.get('/loans/checked_out', (req, res) => {
  Loan.findAll({
    where: {
      returned_on: null
    },
    include: [
      {
        model: Book
      },
      {
        model: Patron
      }
    ]
  }).then(function(loans) {
    res.render('checked_out_loans', {loans: loans});
  }).catch(function(err) {
    next(serverError());
  });
});

// This route catches all routes not handled above, and asign it to a not Found
// error. This will be displayed on an error template.
app.use((req, res, next) => {
  next(notFoundError());
});

// This route catches errors not handled above, and assign them as server errors.
// It then renders the error template.
app.use((err, req, res, next) => {
  if (!err.status) {
    err.status = 500;
    err.message = "Server Error";
  }
  res.render('error', {error: err});
});

const port = process.env.PORT || 3000;

// This syncs the database file with the table models before serving the application
// on port 3000.
sequelize.sync().then(function(){
  app.listen(port, () => {
    console.log('The server is running.');
  });
});

}();
