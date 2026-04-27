const cloudinary = require('../config/cloudinary');

/**
 * Generate a signed URL for an authenticated Cloudinary resource
 * @param {string} publicId - The public ID of the resource (should include extension for raw files)
 * @param {string} resourceType - 'image', 'raw', 'video' (default 'raw' for PDFs/docs)
 * @param {number} expiresInSeconds - Expiration time from now (default 7 days)
 * @returns {string} Signed URL with expiration
 */
const getSignedUrl = (publicId, resourceType = 'raw', expiresInSeconds = 604800) => {
  // For raw files, Cloudinary requires the extension to be part of the public ID.
  // If it's missing, we append '.pdf' as a fallback (but ideally it should already be there).
  let finalPublicId = publicId;
  if (resourceType === 'raw' && !publicId.includes('.')) {
    console.warn(`Public ID "${publicId}" missing extension – appending .pdf`);
    finalPublicId = `${publicId}.pdf`;
  }

  const options = {
    sign_url: true,
    type: 'authenticated',
    resource_type: resourceType,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  return cloudinary.url(finalPublicId, options);
};

module.exports = { getSignedUrl };