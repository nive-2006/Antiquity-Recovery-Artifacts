const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { allow } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.use(allow('admin'));

router.get('/pending-users', async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/approve', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_APPROVED',
      targetId: user._id.toString(),
      at: new Date()
    });

    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/reject', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'USER_REJECTED',
      targetId: user._id.toString(),
      at: new Date()
    });

    res.json({ message: 'User rejected successfully', user });
  } catch (err) {
    next(err);
  }
});

router.get('/audit', async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email role organization')
      .sort({ at: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
