const express = require('express');
const addTask = require('../controllers/addTask');
const fetchAllTasks = require('../controllers/fetchAllTasks');

const router = express.Router();

router.post('/tasks', addTask.addTask);

router.get('/tasks', fetchAllTasks.fetchAllTasks);

module.exports = router;
