
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, RefreshCw, X, ChevronRight, Inbox } from 'lucide-react';
import { fetchRecentEmails, sendGameInvite } from '../lib/gmail';

interface GmailPanelProps {
  accessToken: string;
  onClose: () => void;
  roomId?: string;
}

export default function GmailPanel({ accessToken, onClose, roomId }: GmailPanelProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const loadEmails = async () => {
    setLoading(true);
    const data = await fetchRecentEmails(accessToken);
    setEmails(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEmails();
  }, [accessToken]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSending(true);
    try {
      const roomLink = window.location.origin + (roomId ? `?room=${roomId}` : '');
      await sendGameInvite(accessToken, inviteEmail, roomLink);
      setStatus({ type: 'success', msg: 'Invite sent successfully!' });
      setInviteEmail('');
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to send invite.' });
    } finally {
      setSending(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-black/95 backdrop-blur-xl border-l border-white/10 z-[100] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">Gmail Invites</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Secure Google Integration</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Invite Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Send Game Invite</h3>
          </div>
          <form onSubmit={handleSendInvite} className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Enter friend's email address..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-none p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <AnimatePresence>
              {status && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2",
                    status.type === 'success' ? "text-green-400" : "text-red-400"
                  )}
                >
                  {status.msg}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* Inbox Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Recent Emails</h3>
            <button 
              onClick={loadEmails}
              disabled={loading}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-none border border-white/5" />
              ))
            ) : emails.length > 0 ? (
              emails.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white/[0.03] border border-white/10 hover:border-red-500/30 transition-all group cursor-default"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black tracking-widest text-red-500/80 truncate max-w-[200px]">
                      {email.from}
                    </span>
                    <span className="text-[9px] font-bold text-white/20 whitespace-nowrap">
                      {email.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-red-400 transition-colors">
                    {email.subject}
                  </h4>
                  <p className="text-xs text-white/40 line-clamp-2 italic font-serif leading-relaxed">
                    {email.snippet}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-white/20 gap-3 border border-dashed border-white/10">
                <Inbox className="w-10 h-10 stroke-1" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inbox Empty</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-none italic text-[10px] text-red-500/70 leading-relaxed">
          Invite friends to play with you by typing in their email addresses above. Safe and secure.
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
