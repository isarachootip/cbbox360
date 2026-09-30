import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Plus,
  ArrowRight,
  Sparkles,
  Edit2,
  Trash2,
  Zap,
  Send,
} from 'lucide-react';
import { CannedResponse, BotAutoReplyRule } from '../../types';
import { useBot } from '../../context/BotContext';

interface BotAutoReplyTabProps {
  cannedResponses: CannedResponse[];
  onOpenAddBotRule: (item?: CannedResponse) => void;
  onOpenEditBotRule: (rule: BotAutoReplyRule) => void;
}

export const BotAutoReplyTab: React.FC<BotAutoReplyTabProps> = ({
  cannedResponses,
  onOpenAddBotRule,
  onOpenEditBotRule,
}) => {
  const navigate = useNavigate();
  const {
    settings: botSettings,
    toggleBot,
    updateSettings: updateBotSettings,
    deleteRule: deleteBotRule,
    toggleRuleActive: toggleBotRuleActive,
    testMatch: testBotMatch,
  } = useBot();

  const [simText, setSimText] = useState('สอบถามเลขบัญชีโอนเงินหน่อยครับ');
  const [simResult, setSimResult] = useState<any>(null);

  const handleTestSimulate = () => {
    if (!simText.trim()) return;
    const res = testBotMatch(simText, {
      customer_name: 'คุณสมชาย',
      order_code: 'SO-10482',
      tracking_no: 'TH2609-88412',
    });
    setSimResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Master Bot Controller Card */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">{botSettings.botName}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    botSettings.isEnabled ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      botSettings.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{botSettings.isEnabled ? 'เปิดใช้งาน (Active)' : 'ปิดการทำงาน (Inactive)'}</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                ระบบ AI Bot ตอบกลับอัตโนมัติเมื่อลูกค้าส่งข้อความเข้ามาผ่าน LINE OA หรือ Social Channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleBot}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                botSettings.isEnabled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-brand hover:bg-brand-hover text-white'
              }`}
            >
              <span>{botSettings.isEnabled ? 'พักบอทชั่วคราว' : 'เปิดใช้งานบอท'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddBotRule()}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มกฎตอบกลับใหม่</span>
            </button>
          </div>
        </div>

        {/* Bot Core Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Operating Mode */}
          <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
            <span className="text-xs font-bold text-text-primary block mb-2">
              โหมดการทำงานของบอท
            </span>
            <select
              value={botSettings.operatingMode}
              onChange={(e) => updateBotSettings({ operatingMode: e.target.value as any })}
              className="w-full text-xs font-semibold py-2 px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="always">ทำงานตลอด 24 ชั่วโมง (24/7)</option>
              <option value="off_hours_only">ทำงานเฉพาะนอกเวลาทำการ</option>
              <option value="keyword_only">ตอบเฉพาะเมื่อตรงกับคำสำคัญ (Keywords)</option>
            </select>
            <p className="text-[11px] text-text-secondary mt-2">
              {botSettings.operatingMode === 'always'
                ? 'บอทจะช่วยตอบตลอดเวลา ทั้งในและนอกเวลาทำการ'
                : botSettings.operatingMode === 'off_hours_only'
                ? 'ในเวลาทำการจะให้เจ้าหน้าที่คนตอบ นอกเวลาบอทจะตอบแทน'
                : 'บอทจะตอบเฉพาะคำที่มีในลิสต์กฎเท่านั้น'}
            </p>
          </div>

          {/* Welcome Message Toggle */}
          <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-primary">
                ข้อความทักทายแรกเข้า (Welcome)
              </span>
              <button
                type="button"
                onClick={() =>
                  updateBotSettings({ welcomeMessageEnabled: !botSettings.welcomeMessageEnabled })
                }
                className={`text-xs font-semibold ${
                  botSettings.welcomeMessageEnabled ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {botSettings.welcomeMessageEnabled ? '● เปิด' : '● ปิด'}
              </button>
            </div>
            <select
              disabled={!botSettings.welcomeMessageEnabled}
              value={botSettings.welcomeCannedResponseId || ''}
              onChange={(e) => updateBotSettings({ welcomeCannedResponseId: e.target.value })}
              className="w-full text-xs font-semibold py-2 px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-brand cursor-pointer disabled:opacity-50"
            >
              {cannedResponses
                .filter((c) => c.category === 'greeting')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortcut} - {c.title}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-text-secondary mt-2">
              ส่งข้อความนี้อัตโนมัติทันทีที่ลูกค้าเปิดห้องแชทหรือทักข้อความแรก
            </p>
          </div>

          {/* Human Handoff */}
          <div className="bg-bg-subtle/70 rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-primary">
                คำสั่งส่งต่อเจ้าหน้าที่ (Handoff)
              </span>
              <button
                type="button"
                onClick={() =>
                  updateBotSettings({ humanHandoffEnabled: !botSettings.humanHandoffEnabled })
                }
                className={`text-xs font-semibold ${
                  botSettings.humanHandoffEnabled ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {botSettings.humanHandoffEnabled ? '● เปิด' : '● ปิด'}
              </button>
            </div>
            <div className="text-[11px] text-text-secondary mb-2 line-clamp-1">
              คำตรวจจับ: {botSettings.humanHandoffKeywords.join(', ')}
            </div>
            <button
              type="button"
              onClick={() => navigate('/settings?tab=hours')}
              className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
            >
              <span>แก้ไขคำสั่งส่งต่อ & ข้อความ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-bg-subtle/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <h3 className="font-bold text-xs text-text-primary">
              รายการกฎตอบกลับอัตโนมัติ ({botSettings.rules.length} กฎ)
            </h3>
          </div>
          <span className="text-[11px] text-text-secondary">
            ลำดับความสำคัญ: บอทจะประมวลผลกฎจากบนลงล่างตาม Priority
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50 text-text-secondary font-bold">
                <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-4">ชื่อกฎ / วัตถุประสงค์</th>
                <th className="py-2.5 px-4">คำสำคัญที่ตรวจจับ (Trigger Keywords)</th>
                <th className="py-2.5 px-4">ข้อความที่ใช้ตอบกลับ</th>
                <th className="py-2.5 px-4 w-28 text-center">สถานะ</th>
                <th className="py-2.5 px-4 w-24 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {botSettings.rules.map((rule, idx) => {
                const linkedCanned = cannedResponses.find(
                  (c) => c.id === rule.cannedResponseId
                );

                return (
                  <tr key={rule.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-center text-text-secondary">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-text-primary">{rule.name}</div>
                      <span className="text-[10px] text-text-secondary font-mono">
                        จับคู่แบบ: {rule.matchType === 'exact' ? 'ตรงกันทุกตัวอักษร' : 'มีคำนี้ในประโยค'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {rule.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-bg-app border border-border rounded text-[11px] text-brand font-medium"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {linkedCanned ? (
                        <div>
                          <span className="font-mono text-xs font-bold text-brand">
                            {linkedCanned.shortcut}
                          </span>
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5 max-w-sm">
                            {linkedCanned.content}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-secondary line-clamp-1">
                          {rule.customReplyText || '-'}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleBotRuleActive(rule.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                          rule.isActive ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{rule.isActive ? 'เปิดใช้' : 'ปิด'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditBotRule(rule)}
                          className="p-1 text-text-secondary hover:text-brand rounded hover:bg-bg-app transition-colors"
                          title="แก้ไขกฎ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBotRule(rule.id)}
                          className="p-1 text-text-secondary hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="ลบกฎ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Bot Simulator */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-divider pb-3">
          <Zap className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-sm text-text-primary">
            ทดสอบการตอบของ Bot (Interactive Chat Simulator)
          </h3>
          <span className="text-[11px] text-text-secondary ml-auto">
            พิมพ์ข้อความจำลองจากลูกค้าเพื่อทดสอบการจับคู่คำสำคัญทันที
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 space-y-3">
            <label className="block text-xs font-bold text-text-primary">
              ข้อความที่ลูกค้าพิมพ์ส่งมา:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestSimulate()}
                placeholder="เช่น ขอเลขบัญชีหน่อยครับ, ส่งของหรือยัง, ติดต่อเจ้าหน้าที่..."
                className="flex-1 px-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white transition-all font-medium"
              />
              <button
                type="button"
                onClick={handleTestSimulate}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ทดสอบ</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-text-secondary mr-1">ลองคลิกข้อความตัวอย่าง:</span>
              {[
                'ขอเลขบัญชีโอนเงินครับ',
                'ส่งของหรือยังครับ',
                'ตัดรอบส่งกี่โมง',
                'โอนเงินเรียบร้อยแล้วค่ะ',
                'สินค้าพังเปิดไม่ติด ขอเคลม',
                'เปิดปิดกี่โมงครับ',
                'ติดต่อเจ้าหน้าที่หน่อยค่ะ',
              ].map((text, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSimText(text);
                    const res = testBotMatch(text, {
                      customer_name: 'คุณสมชาย',
                      order_code: 'SO-10482',
                      tracking_no: 'TH2609-88412',
                    });
                    setSimResult(res);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded border border-border bg-bg-subtle hover:bg-bg-app text-text-primary font-medium transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-bg-subtle/80 rounded-xl p-4 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-brand" />
                  <span>ผลลัพธ์ที่ Bot ตอบกลับ:</span>
                </span>
                {simResult && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      simResult.matched ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        simResult.matched ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      {simResult.type === 'handoff'
                        ? 'ตรวจพบคำสั่งส่งต่อ (Handoff)'
                        : simResult.matched
                        ? `จับคู่กฎ: "${simResult.rule?.name || 'Rule'}"`
                        : 'ไม่ตรงกับกฎใดๆ'}
                    </span>
                  </span>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-border min-h-[90px] text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
                {simResult ? (
                  simResult.replyText
                ) : (
                  <span className="text-text-secondary italic">
                    พิมพ์ข้อความด้านซ้ายแล้วกดปุ่ม &quot;ทดสอบ&quot; เพื่อดูข้อความตอบกลับของบอท
                  </span>
                )}
              </div>
            </div>

            {simResult?.matchedKeyword && (
              <div className="text-[11px] text-text-secondary mt-2 pt-2 border-t border-divider">
                คำสำคัญที่ตรงกัน:{' '}
                <span className="font-bold text-brand">{simResult.matchedKeyword}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
