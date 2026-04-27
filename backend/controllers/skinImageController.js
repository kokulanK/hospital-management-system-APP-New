const SkinImage = require('../models/SkinImage');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Upload new image
const uploadSkinImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let patientId = req.user._id;

    // Receptionist uploading for patient
    if (req.user.role === 'receptionist' && req.body.patientId) {
      const patient = await User.findOne({
        _id: req.body.patientId,
        role: 'patient'
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      patientId = patient._id;
    } else if (req.user.role === 'receptionist' && !req.body.patientId) {
      return res.status(400).json({
        message: 'Patient ID is required for receptionist upload'
      });
    }

    // Cloudinary data
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    // 1. Default container
    let analysisResult = {};

    // 2. Call local AI service (Gatekeeper + Classifier)
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/analyze`,
        { image_url: imageUrl },
        { timeout: 30000 }
      );
      // Will contain { status: 'rejected'|'accepted', gatekeeper: {...}, classifier?: {...} }
      analysisResult = aiResponse.data;
    } catch (aiError) {
      console.error('AI service call failed:', aiError.response?.data || aiError.message);
      analysisResult = { 
        status: 'error', 
        error: 'AI analysis unavailable', 
        details: aiError.message 
      };
    }

    // 3. Check if the AI explicitly rejected the image
    if (analysisResult.status === 'rejected') {
      // Clean up the image from Cloudinary since it's rejected
      if (publicId) {
        cloudinary.uploader.destroy(publicId).catch(err => console.error("Cloudinary cleanup error:", err));
      }
      
      // Return the rejection immediately without saving to the database
      return res.status(200).json({
        analysisResult: analysisResult,
        message: 'Image rejected by AI gatekeeper'
      });
    }

    // 4. Save to database for accepted or pending/error images
    const skinImage = new SkinImage({
      user: patientId,
      imageUrl: imageUrl,
      publicId: publicId,
      analysisResult: analysisResult
    });

    await skinImage.save();

    res.status(201).json(skinImage);

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all images for logged-in user
const getUserSkinImages = async (req, res) => {
  try {
    const images = await SkinImage
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(images);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single image by ID
const getSkinImageById = async (req, res) => {
  try {
    const image = await SkinImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(image);
  } catch (error) {
    console.error("GET IMAGE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete image
const deleteSkinImage = async (req, res) => {
  try {
    const image = await SkinImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete from Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    await image.deleteOne();

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadSkinImage,
  getUserSkinImages,
  getSkinImageById,
  deleteSkinImage
};