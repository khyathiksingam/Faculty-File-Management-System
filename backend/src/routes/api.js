const express = require('express');
const router = express.Router();

const { authenticate, requireRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const departmentController = require('../controllers/departmentController');
const folderController = require('../controllers/folderController');
const fileController = require('../controllers/fileController');
const searchController = require('../controllers/searchController');
const shareController = require('../controllers/shareController');
const versionController = require('../controllers/versionController');
const analyticsController = require('../controllers/analyticsController');
const activityController = require('../controllers/activityController');
const notificationController = require('../controllers/notificationController');
const settingsController = require('../controllers/settingsController');

// ---------------- Authentication Routes ----------------
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/signup', authController.signup);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.verifyOtpAndResetPassword);
router.get('/auth/me', authenticate, authController.me);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.post('/auth/change-password', authenticate, authController.changePassword);
router.post('/auth/logout', authenticate, authController.logout);

// ---------------- Public Settings Route (for branding before login) ----------------
router.get('/settings/public', settingsController.getSettings);

// ---------------- Protected Settings Routes ----------------
router.get('/settings', authenticate, settingsController.getSettings);
router.put('/settings', authenticate, requireRoles('admin'), settingsController.updateSettings);
router.get('/settings/backup', authenticate, requireRoles('admin'), settingsController.backupDatabase);
router.post('/settings/restore', authenticate, requireRoles('admin'), upload.single('backup'), settingsController.restoreDatabase);

// ---------------- User Management Routes ----------------
router.get('/users', authenticate, userController.getAllUsers);
router.get('/users/roles', authenticate, userController.getRoles);
router.get('/users/:id', authenticate, userController.getUserById);
router.post('/users', authenticate, requireRoles('admin'), userController.createUser);
router.put('/users/:id', authenticate, requireRoles('admin'), userController.updateUser);
router.patch('/users/:id/toggle-status', authenticate, requireRoles('admin'), userController.toggleUserStatus);
router.post('/users/:id/reset-password', authenticate, requireRoles('admin'), userController.resetPassword);
router.delete('/users/:id', authenticate, requireRoles('admin'), userController.deleteUser);

// ---------------- Department Management Routes ----------------
router.get('/departments', authenticate, departmentController.getAllDepartments);
router.get('/departments/:id', authenticate, departmentController.getDepartmentById);
router.post('/departments', authenticate, requireRoles('admin'), departmentController.createDepartment);
router.put('/departments/:id', authenticate, requireRoles('admin'), departmentController.updateDepartment);
router.post('/departments/:id/assign-hod', authenticate, requireRoles('admin'), departmentController.assignHOD);
router.delete('/departments/:id', authenticate, requireRoles('admin'), departmentController.deleteDepartment);

// ---------------- Folder Routes ----------------
router.get('/folders', authenticate, folderController.getFolders);
router.get('/folders/tree', authenticate, folderController.getFolderTree);
router.get('/folders/:id/breadcrumbs', authenticate, folderController.getFolderBreadcrumbs);
router.post('/folders', authenticate, folderController.createFolder);
router.put('/folders/:id/rename', authenticate, folderController.renameFolder);
router.put('/folders/:id/move', authenticate, folderController.moveFolder);
router.delete('/folders/:id', authenticate, folderController.deleteFolder);

// ---------------- File Routes ----------------
router.post('/files/upload', authenticate, upload.array('files', 15), fileController.uploadFiles);
router.get('/files', authenticate, fileController.getFiles);
router.get('/files/:id', authenticate, fileController.getFileById);
router.get('/files/:id/download', authenticate, fileController.downloadFile);
router.get('/files/:id/preview', authenticate, fileController.previewFile);
router.put('/files/:id/rename', authenticate, fileController.renameFile);
router.put('/files/:id/move', authenticate, fileController.moveFile);
router.post('/files/:id/star', authenticate, fileController.toggleStar);
router.patch('/files/:id/visibility', authenticate, fileController.toggleVisibility);
router.post('/files/batch-trash', authenticate, fileController.batchMoveToTrash);
router.post('/files/batch-visibility', authenticate, fileController.batchChangeVisibility);
router.delete('/files/:id', authenticate, fileController.deleteFile); // soft delete to trash
router.post('/files/:id/restore', authenticate, fileController.restoreFile);
router.post('/trash/restore-all', authenticate, fileController.restoreAllTrash);
router.post('/trash/restore-selected', authenticate, fileController.restoreSelectedTrash);
router.delete('/files/:id/permanent', authenticate, fileController.permanentlyDeleteFile);
router.delete('/trash/empty', authenticate, fileController.emptyTrash);

// ---------------- Search & OCR Routes ----------------
router.get('/search', authenticate, searchController.search);

// ---------------- File Sharing Routes ----------------
router.post('/files/:file_id/share', authenticate, shareController.shareFile);
router.delete('/shares/:share_id', authenticate, shareController.removeShare);
router.get('/shared-with-me', authenticate, shareController.getSharedWithMe);

// ---------------- Version History Routes ----------------
router.get('/files/:id/versions', authenticate, versionController.getFileVersions);
router.post('/files/:id/versions', authenticate, upload.single('file'), versionController.uploadNewVersion);
router.get('/files/:id/versions/:versionNumber/download', authenticate, versionController.downloadVersion);
router.post('/files/:id/versions/:versionNumber/restore', authenticate, versionController.restoreVersion);

// ---------------- Analytics & Dashboard Routes ----------------
router.get('/analytics/dashboard', authenticate, analyticsController.getDashboardStats);
router.get('/analytics/storage', authenticate, analyticsController.getStorageAnalytics);

// ---------------- Activity Logs Routes ----------------
router.get('/activity', authenticate, activityController.getActivityLogs);

// ---------------- Notification Routes ----------------
router.get('/notifications', authenticate, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.patch('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/notifications', authenticate, notificationController.clearNotifications);

module.exports = router;
