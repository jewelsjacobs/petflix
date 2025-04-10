export const ERROR_MESSAGES = {
  // Permissions
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to take a photo. Please enable it in your device settings.',
  MEDIA_LIBRARY_PERMISSION_DENIED: 'Media Library permission is required to select a photo. Please enable it in your device settings.',

  // File/Image Handling
  IMAGE_PICKER_CANCELLED: 'Image selection was cancelled.',
  FILE_UPLOAD_ERROR: 'There was an error uploading the file. Please try again.',
  IMAGE_LOAD_ERROR: 'Could not load the selected image. Please try a different one.',

  // API & Network
  API_REQUEST_FAILED: 'Something went wrong while communicating with our servers. Please check your connection and try again.',
  API_TIMEOUT: 'The request timed out. Please check your connection and try again.',
  VIDEO_GENERATION_FAILED: 'We couldn't create your video this time. Please try again later.',
  NETWORK_CONNECTION_ERROR: 'No internet connection detected. Please connect to the internet and try again.',

  // Video Playback
  VIDEO_PLAYBACK_ERROR: 'Could not play the video. Please try again or restart the app.',

  // Sharing
  SHARING_FAILED: 'Could not share the video. Please try again.',
  SAVE_VIDEO_FAILED: 'Could not save the video to your device. Please check storage permissions and try again.',

  // General
  GENERIC_ERROR: 'An unexpected error occurred. Please try again or restart the app.',
}; 