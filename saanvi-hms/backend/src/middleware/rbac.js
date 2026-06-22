// Role-based access control middleware.
// Usage: router.delete('/:id', protect, authorize('admin'), handler)
// Usage with multiple roles: authorize('admin', 'doctor')
//
// Must run AFTER `protect`, since it relies on req.user being set.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user on request' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = { authorize };
