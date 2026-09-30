import { query } from '../../db.js';
import { getThaiTime, rowToConversation, rowToMessage } from '../utils/formatters.js';
import { sendLinePush } from '../services/lineService.js';

export const getConversations = async (req, res) => {
  try {
    const convResult = await query(
      `SELECT * FROM conversations ORDER BY updated_at DESC`
    );
    const msgResult = await query(`SELECT * FROM messages ORDER BY created_at ASC`);

    const msgMap = {};
    for (const msg of msgResult.rows) {
      if (!msgMap[msg.conversation_id]) msgMap[msg.conversation_id] = [];
      msgMap[msg.conversation_id].push(rowToMessage(msg));
    }

    const data = convResult.rows.map((row) =>
      rowToConversation(row, msgMap[row.id] || [])
    );

    return res.status(200).json({ status: 'success', data, count: data.length });
  } catch (err) {
    console.error('[GET /api/conversations Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

export const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { text, isPrivate, authorName } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const convResult = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conv = convResult.rows[0];

    const timeStr = getThaiTime();
    const newMsgId = `m-${Date.now()}`;
    const sender = isPrivate ? 'note' : 'agent';
    const author = authorName || 'วิภา ส.';

    await query(
      `INSERT INTO messages (id, conversation_id, sender, author_name, text, time, is_private_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newMsgId, id, sender, author, text.trim(), timeStr, !!isPrivate]
    );

    if (!isPrivate) {
      await query(
        `UPDATE conversations SET last_message_preview=$1, time=$2, updated_at=NOW() WHERE id=$3`,
        [text.trim(), timeStr, id]
      );
    }

    // Push to LINE if real user
    if (!isPrivate && conv.line_user_id) {
      await sendLinePush(conv.line_user_id, text.trim());
    }

    const newMsg = {
      id: newMsgId,
      sender,
      authorName: author,
      text: text.trim(),
      time: timeStr,
      isPrivateNote: !!isPrivate,
    };

    return res.status(200).json({ status: 'success', message: newMsg });
  } catch (err) {
    console.error('[POST messages Error]:', err.message);
    return res.status(500).json({ error: 'Database error', detail: err.message });
  }
};
