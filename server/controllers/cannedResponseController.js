import { query } from '../../db.js';

export const getCannedResponses = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM canned_responses ORDER BY usage_count DESC`
    );
    const data = result.rows.map((r) => ({
      id: r.id,
      shortcut: r.shortcut,
      title: r.title,
      category: r.category,
      content: r.content,
      tags: r.tags,
      isActive: r.is_active,
      usageCount: r.usage_count,
      lastUsedAt: r.last_used_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return res.status(200).json({ status: 'success', data, count: data.length });
  } catch (err) {
    console.error('[GET canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const createCannedResponse = async (req, res) => {
  const data = req.body;
  if (!data?.title || !data?.shortcut || !data?.content) {
    return res.status(400).json({ error: 'title, shortcut, and content are required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const id = data.id || `cr-${Date.now()}`;

  try {
    const result = await query(
      `INSERT INTO canned_responses (id, shortcut, title, category, content, tags, is_active, usage_count, last_used_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        id, data.shortcut, data.title, data.category || 'answer', data.content,
        data.tags || [], data.isActive !== undefined ? data.isActive : true,
        data.usageCount || 0, data.lastUsedAt || null, data.createdAt || today, today,
      ]
    );
    const r = result.rows[0];
    return res.status(201).json({
      status: 'success',
      data: { ...r, isActive: r.is_active, usageCount: r.usage_count },
    });
  } catch (err) {
    console.error('[POST canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const updateCannedResponse = async (req, res) => {
  const { id } = req.params;
  const upd = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await query(
      `UPDATE canned_responses SET
        shortcut    = COALESCE($1, shortcut),
        title       = COALESCE($2, title),
        category    = COALESCE($3, category),
        content     = COALESCE($4, content),
        tags        = COALESCE($5, tags),
        is_active   = COALESCE($6, is_active),
        usage_count = COALESCE($7, usage_count),
        last_used_at= COALESCE($8, last_used_at),
        updated_at  = $9
       WHERE id = $10
       RETURNING *`,
      [
        upd.shortcut || null, upd.title || null, upd.category || null,
        upd.content || null, upd.tags || null,
        upd.isActive !== undefined ? upd.isActive : null,
        upd.usageCount !== undefined ? upd.usageCount : null,
        upd.lastUsedAt || null, today, id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Canned response not found' });
    }
    const r = result.rows[0];
    return res.status(200).json({
      status: 'success',
      data: { ...r, isActive: r.is_active, usageCount: r.usage_count },
    });
  } catch (err) {
    console.error('[PUT canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const deleteCannedResponse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      `DELETE FROM canned_responses WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Canned response not found' });
    }
    return res.status(200).json({ status: 'success', deleted: result.rows[0] });
  } catch (err) {
    console.error('[DELETE canned-responses Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};
