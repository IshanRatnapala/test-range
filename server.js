var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var middleware = require('./middleware');
var db = require('./db.js');

var app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(middleware.logger);

// GET /todos
app.get('/todos', function (req, res) {
    var query = req.query;
    var filters = {};

    if (query.hasOwnProperty('completed')) {
        if (query.completed === 'true') {
            filters.completed = true;
        } else if (query.completed === 'false') {
            filters.completed = false;
        }
    }
    if (query.hasOwnProperty('q') && query.q.length > 0) {
        filters.description = {
            $like: '%' + query.q + '%'
        };
    }

    db.todo.findAll({
        where: filters
    }).then(function (todos) {
        res.json(todos);
    }).catch(function (e) {
        res.status(500).send();
    });
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findById(todoId)
        .then(
            function (todo) {
                if (!!todo) {
                    res.json(todo);
                } else {
                    res.status(404).send();
                }
            },
            function (e) {
                res.status(500).send();
            });
});

// POST /todos
app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    db.todo.create(body)
        .then(function (todo) {
            res.json(todo.toJSON());
        })
        .catch(function (e) {
            res.send(400).json(e);
        });
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var filteredTodo = _.findWhere(todos, { id: todoId });

    if (filteredTodo) {
        todos = _.without(todos, filteredTodo);
        res.send(todos);
    } else {
        res.status(404).json({ "error": "Todo not found." });
    }
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    var todoId = parseInt(req.params.id, 10);
    var filteredTodo = _.findWhere(todos, { id: todoId });
    var validAttributes = {};

    if (!filteredTodo) {
        return res.status(404).send();
    }

    if (body.hasOwnProperty('completed') &&
        _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    } else {

    }

    if (body.hasOwnProperty('description') &&
        _.isString(body.description) &&
        body.description.trim().length) {
        validAttributes.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    } else {

    }

    _.extend(filteredTodo, validAttributes);
    res.json(todos);
});

app.use(express.static(__dirname + '/public'));

db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('Express server started on port', PORT);
    });
});
