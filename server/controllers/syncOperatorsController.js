/**
 * syncOperatorsController.js — HTTP handler for POST /api/users/sync-operators.
 * Ensures agent columns exist, provisions any missing standard operator/agent accounts,
 * records an audit log entry, and returns the refreshed user list.
 */
export const createSyncOperatorsHandler = ({
  ensureColumns,
  seedOperators,
  listUsers,
  audit,
}) => async (req, res) => {
  try {
    await ensureColumns();
    const created = await seedOperators();
    const createdUsernames = created.map((c) => c.username);
    const users = await listUsers();

    await audit({
      userId: req.user?.username ?? 'admin',
      userRole: req.user?.role,
      action:
        createdUsernames.length > 0
          ? `ซิงก์สร้างบัญชี Agent มาตรฐาน (${createdUsernames.join(', ')})`
          : 'ตรวจสอบซิงก์บัญชี Agent มาตรฐาน (ครบถ้วนแล้ว)',
      category: 'user',
      resource: 'User/SyncOperators',
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      createdUsernames,
      users,
    });
  } catch (err) {
    console.error('[Sync Operators Error]:', err.message);
    return res.status(503).json({ success: false, error: 'USER_SERVICE_UNAVAILABLE' });
  }
};
