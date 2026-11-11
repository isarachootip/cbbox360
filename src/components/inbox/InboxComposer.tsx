import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Lock, Paperclip, Send, Settings } from 'lucide-react';
import { CannedResponse, Conversation, Customer } from '../../types';
import { BotStatusToggle } from './BotStatusToggle';
import { AiSuggestedReplyPanel } from './AiSuggestedReplyPanel';
import { InboxTaskComposerForm, TaskComposerDraft } from './InboxTaskComposerForm';
import { CannedResponseQuickBar } from './CannedResponseQuickBar';

export type ComposerMode = 'reply' | 'note' | 'task';

interface InboxComposerProps {
  conversation: Conversation;
  customer: Customer;
  composerMode: ComposerMode;
  onComposerModeChange: (mode: ComposerMode) => void;
  inputText: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onAttachFile: () => void;
  onToggleBot: (nextState: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  selectedCannedGroup: string;
  onSelectCannedGroup: (group: string) => void;
  chipCannedResponses: CannedResponse[];
  slashFilteredResponses: CannedResponse[];
  slashSearchQuery: string;
  isSlashMenuOpen: boolean;
  onCloseSlashMenu: () => void;
  onApplyCannedResponse: (item: CannedResponse) => void;
  onSelectAiReply: (text: string, logId?: string) => void;
  taskForm: TaskComposerDraft;
  onTaskFormChange: (next: TaskComposerDraft) => void;
  onCreateTaskSubmit: (e?: React.FormEvent) => void;
}

export const InboxComposer: React.FC<InboxComposerProps> = (props) => {
  const navigate = useNavigate();
  const { conversation, customer, composerMode, inputText } = props;

  return (
    <div className="p-4 bg-white border-t border-border flex-shrink-0 space-y-2.5 relative">
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-4 text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => props.onComposerModeChange('reply')}
            className={`pb-1 border-b-2 transition-all ${
              composerMode === 'reply'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            ตอบกลับ
          </button>
          <button
            type="button"
            onClick={() => props.onComposerModeChange('note')}
            className={`pb-1 border-b-2 flex items-center gap-1 transition-all ${
              composerMode === 'note'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Private note</span>
          </button>
          <button
            type="button"
            onClick={() => props.onComposerModeChange('task')}
            className={`pb-1 border-b-2 flex items-center gap-1 transition-all ${
              composerMode === 'task'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>สร้าง Task</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <BotStatusToggle
            isBotActive={conversation.isBotActive !== false}
            onToggle={props.onToggleBot}
          />
          <span className="text-[11px] text-text-secondary hidden md:inline">
            พิมพ์ <kbd className="font-mono bg-bg-app px-1.5 py-0.5 rounded border border-border">/</kbd> เพื่อค้นหา
          </span>
          <button
            type="button"
            onClick={() => navigate('/canned-responses')}
            className="text-xs text-brand hover:text-brand-hover hover:underline flex items-center gap-1 font-medium"
            title="เปิดหน้าจัดการข้อความอัตโนมัติ"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>จัดการข้อความ</span>
          </button>
        </div>
      </div>

      {composerMode === 'task' ? (
        <InboxTaskComposerForm
          taskForm={props.taskForm}
          onChange={props.onTaskFormChange}
          onCancel={() => props.onComposerModeChange('reply')}
          onSubmit={props.onCreateTaskSubmit}
        />
      ) : (
        <>
          <CannedResponseQuickBar
            selectedCannedGroup={props.selectedCannedGroup}
            onSelectCannedGroup={props.onSelectCannedGroup}
            chipCannedResponses={props.chipCannedResponses}
            slashFilteredResponses={props.slashFilteredResponses}
            slashSearchQuery={props.slashSearchQuery}
            isSlashMenuOpen={props.isSlashMenuOpen}
            onCloseSlashMenu={props.onCloseSlashMenu}
            onApplyCannedResponse={props.onApplyCannedResponse}
          />

          {composerMode === 'reply' && (
            <AiSuggestedReplyPanel
              conversationId={conversation.id}
              customer={customer}
              messages={conversation.messages}
              onSelectReply={props.onSelectAiReply}
            />
          )}

          <form onSubmit={props.onSendMessage} className="relative">
            <textarea
              ref={props.textareaRef}
              rows={2}
              value={inputText}
              onChange={props.onInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (props.isSlashMenuOpen && props.slashFilteredResponses.length > 0) {
                    e.preventDefault();
                    props.onApplyCannedResponse(props.slashFilteredResponses[0]);
                    return;
                  }
                  e.preventDefault();
                  props.onSendMessage();
                } else if (e.key === 'Escape') {
                  props.onCloseSlashMenu();
                }
              }}
              placeholder={
                composerMode === 'reply'
                  ? 'พิมพ์ข้อความตอบกลับลูกค้า หรือพิมพ์ / เพื่อเลือกข้อความสำเร็จรูป...'
                  : 'เขียนโน้ตส่วนตัว (Private note สำหรับทีมภายใน ลูกค้าจะไม่เห็น)...'
              }
              className={`w-full px-3 py-2.5 text-[14px] leading-[1.6] rounded-xl border focus:outline-none transition-all resize-none ${
                composerMode === 'note'
                  ? 'bg-warn-bg/60 border-warn-border focus:border-amber-600 text-warn-text'
                  : 'bg-bg-subtle border-border focus:border-brand text-text-primary focus:bg-white'
              }`}
            />

            <div className="flex items-center justify-between pt-2 select-none">
              <button
                type="button"
                onClick={props.onAttachFile}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-subtle transition-colors"
                aria-label="Attach File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  inputText.trim()
                    ? composerMode === 'note'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-brand hover:bg-brand-hover text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{composerMode === 'note' ? 'บันทึกโน้ต' : 'ส่งข้อความ'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
