let express = require('express');
let router = express.Router();
let user_controller = require('../controllers/userController');

/// user ROUTES ///

// GET request for creating user. NOTE This must come before route for id (i.e. display user).
router.get('/create', user_controller.user_create_get);

// PUT request for creating user.
router.post('/create', user_controller.user_create_post);

// PUT request to delete user.
router.delete('/:id', user_controller.user_delete);

// GET request to update user.
router.get('/:id/update', user_controller.user_update_get);

// PATCH request to update user.
router.patch('/:id/update', user_controller.user_update_patch);

// GET request for one user.
router.get('/:id', user_controller.user_detail);

module.exports = router;
