const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadSkinImage,
  getUserSkinImages,
  getSkinImageById,
  deleteSkinImage
} = require('../controllers/skinImageController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getUserSkinImages)
  .post(upload.single('image'), uploadSkinImage);

router.route('/:id')
  .get(getSkinImageById)
  .delete(deleteSkinImage);

module.exports = router;