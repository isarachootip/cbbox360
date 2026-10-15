/**
 * bindActor.js — overwrites client-supplied identity fields with the authenticated user,
 * so audit/AI logs can't be attributed to someone else by editing the request body.
 */
export const bindActor = (req, _res, next) => {
  if (req.user) {
    req.body = { ...(req.body ?? {}), userId: req.user.username, userRole: req.user.role };
  }
  next();
};
