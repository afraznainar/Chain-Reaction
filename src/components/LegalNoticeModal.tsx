import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldAlert, FileText, Eye, AlertCircle, Sparkles, Scale, Info } from 'lucide-react';

interface LegalNoticeModalProps {
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'dmca' | 'simulator' | 'disclaimer';
}

export default function LegalNoticeModal({ onClose, defaultTab = 'terms' }: LegalNoticeModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'dmca' | 'simulator' | 'disclaimer'>(defaultTab as any);

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Eye },
    { id: 'terms', label: 'Terms of Use', icon: FileText },
    { id: 'dmca', label: 'DMCA & IP Policy', icon: ShieldAlert },
    { id: 'simulator', label: 'Simulator Disclaimers', icon: Sparkles },
    { id: 'disclaimer', label: 'Atomic Disclaimer', icon: AlertCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id="legal-modal-overlay"
      className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        id="legal-modal-container"
        className="w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(255,46,99,0.15)] flex flex-col max-h-[85vh] overflow-hidden relative"
      >
        {/* Top Header */}
        <div id="legal-modal-header" className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#ff2e63]/10 to-transparent">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-[#ff2e63]" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter skew-x-[-6deg] text-white">
                Legal & Compliance Center
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Protecting your safety, privacy, and gaming rights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="legal-close-button"
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div id="legal-tab-triggers" className="flex overflow-x-auto border-b border-white/5 p-2 gap-1 scrollbar-none scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-trigger-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap scroll-mx-4 ${
                  isActive
                    ? 'bg-[#ff2e63] text-white shadow-[0_0_20px_rgba(255,46,99,0.3)] skew-x-[-6deg]'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Legal Text Body Scroll */}
        <div id="legal-modal-body" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-white/80 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/10">
          {activeTab === 'privacy' && (
            <div id="legal-privacy-content" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 1. Overview & Scope
                </h3>
                <p className="text-white/70">
                  This Privacy Policy details how <strong>Atomic Chain Reaction</strong> ("the App," "we," "us") gathers, stores, processes, and protects personal information of players. By accessing the service, authenticating via Google Accounts, or playing the game, you give express consent to the data practices described.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 2. Personal Information Collected
                </h3>
                <p className="text-white/70">
                  To supply a secure, verified, real-time multiplayer board game with dynamic rankings, global lobbies, and active matchmaking mechanics, we collect:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/60 text-xs">
                  <li><strong>Account Identity Data:</strong> Unique User ID (UID), Email address, display name, and profile photo URL retrieved safely via certified Firebase Google Authentication.</li>
                  <li><strong>Lobby Customization Data:</strong> Self-assembled customizable avatars, custom icon tokens, and user preference markers.</li>
                  <li><strong>In-game Statistics:</strong> Detailed matchmaking win/loss counters, tournament scores, AI challenge historical ratios, explosion metrics, count histories, and replay logs.</li>
                  <li><strong>Technical Server Metrics:</strong> Live WebSocket handshake payloads, approximate regional coordinates (for lobby distribution and low-ping matchmaking routing), and temporary performance identifiers.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 3. Cookie Usage and Client Persistence
                </h3>
                <p className="text-white/70">
                  The App operates on cookies and HTML5 Local Storage systems. These strictly supply identity persistence:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/60 text-xs">
                  <li>Keep players logged in across app updates via token headers.</li>
                  <li>Restore customizable audio muting configurations and display options.</li>
                  <li>Retain local verification states such as acknowledging cookie declarations so you do not see alerts continuously.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 4. Data Sharing & Third Parties
                </h3>
                <p className="text-white/70">
                  We maintain a absolute zero-monetization metadata model. <strong>We do not, and will never, sell, trade, rent, or lease your private personal data</strong> to marketing agencies or advertisement networks. All data pipelines flow purely into Google Cloud Run servers and Firebase Firestore backend databases.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 5. Data Deletion and Account Removal
                </h3>
                <p className="text-white/70">
                  You hold the legal right to request complete data deletion. Under GDPR, CCPA, and global regulations, players may contact us directly or click the log-off toggle. For complete database deletion, you may request removal of associated leaderboard states, global tournament accounts, and stored gameplay replays.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div id="legal-terms-content" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 1. Acceptance of Terms
                </h3>
                <p className="text-white/70">
                  By accessing, downloading, or playing <strong>Atomic Chain Reaction</strong>, you agree to be bound by these Terms of Use and all applicable laws. If you do not agree, you are unauthorized to play.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 2. Fair Play & Live Chat Rule of Conduct
                </h3>
                <p className="text-white/70">
                  To assure player safety and keep multiplayer environments clean, all users must respect the following protocols in rooms, naming, and live chat frames:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-white/60 text-xs">
                  <li><strong>Zero Harassment:</strong> Strictly no offensive slurs, profane language, direct threats, hate speech, sexual triggers, cyberbullying, or aggressive visual behavior in room names, customize names, or active game chat blocks.</li>
                  <li><strong>Competitive Integrity:</strong> Cheating, script injections, automated bots mimicking grid tactics, or abusing desync lobbies to force room disconnects is strictly forbidden.</li>
                  <li><strong>Sanctions:</strong> We reserve the sole right, without prior warnings, to kick players, strip stats on the dynamic Global Leaderboard, or permanently blacklist specific user IDs and IPs from server authentication.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 3. Intellectual Property Rights
                </h3>
                <p className="text-white/70">
                  All atomic artwork, particle assets, audio code libraries, game mechanics, state machines, math formulas, styling parameters, and database schemas are the sole proprietary property of this application's developers. Players receive a limited, revocable, non-transferable personal license to play.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 4. Disclaimers & Absolute Limitation of Liability
                </h3>
                <p className="text-[#ff2e63]/90 bg-[#ff2e63]/5 border border-[#ff2e63]/20 p-4 rounded-xl text-xs font-mono">
                  THIS APPLICATION AND NETWORKING SERVER IS SUPPLIED STRICTLY ON AN "AS IS" AND "AS AVAILABLE" BASE WITH ZERO WARRANTIES. THE DEVELOPERS EXCLUDE ALL LIABILITY FOR LOBBY DISCONNECTIONS, NETWORK LATENCY, MATCHMAKING ERRORS, LEADERBOARD RANK ACCIDENTALLY RESETTING, SERVER DOWNTIME, OR ANY FORM OF EMOTIONAL BLOWBACK, GAME COMPULSIONS, OR SUDDEN EXPLOSIVE DISPUTES BETWEEN FRIENDS PLAYING MULTIPLAYER.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'dmca' && (
            <div id="legal-dmca-content" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> Copyright Violations (DMCA Notice)
                </h3>
                <p className="text-white/70">
                  Since players can select user avatars, register names, and communicate in real-time lobby chat layers, we respect intellectual property rules. If you believe your copyrighted asset (such as custom artwork or trademarked handles) has been reproduced on this app without authorization, you may file a formal DMCA Takedown Notice.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> How to Submit a Claim
                </h3>
                <p className="text-white/70">
                  To submit a copyright claim, please email us with the following (as detailed under 17 U.S.C. § 512(c)(3)):
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-white/60 text-xs">
                  <li>Electronic or physical signature of the copyist owner or authorized legal proxy.</li>
                  <li>Precise identification of the copyrighted work asserted to have been infringed.</li>
                  <li>The specific link or room state where the infringing player or material resides, so that we can isolate and address it.</li>
                  <li>Your phone coordinates, address, and verified email contact so we can follow up.</li>
                  <li>A formal statement that you write in "good faith" belief that the asset has not been licensed.</li>
                </ul>
                <p className="text-white/50 text-xs mt-3">
                  Please submit DMCA requests directly to our compliance desk: <span className="text-[#ff2e63] font-mono">legal-compliance@atomic-chain-reaction.app</span> or use the developer feedback portal.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div id="legal-simulator-content" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 1. Simulated Advertisement Disclaimers
                </h3>
                <p className="text-white/70">
                  This game features an interactive <strong>AdOverlay / Sponsored Video</strong> block that awards extra "Undo" charges.
                </p>
                <div className="bg-[#f5d300]/10 border border-[#f5d300]/30 p-4 rounded-xl text-xs space-y-2 text-[#f5d300]">
                  <p className="font-extrabold uppercase tracking-wide flex items-center gap-2">
                    <Info className="w-4 h-4" /> CONSUMER SATISFACTION DECLARATION:
                  </p>
                  <p className="leading-relaxed">
                    All advertisements, videos, sponsored clips, and promotional banners presented inside the game are <strong>strictly simulated for entertainment, visual game-flow authenticity, and monetization structure demonstrations</strong>. No real-world consumer cookies, external advertising trackers, or telemetry lines are executed. Watching simulated sponsors grants standard, sandbox-only gameplay advantages and represents absolutely no monetary value, real currency flow, or professional endorsement.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> 2. Sandbox Checkout & Simulation Store
                </h3>
                <p className="text-white/70">
                  The checkout triggers and the premium membership shop ("Store") operate in a mock framework. Under consumer safety boundaries:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/60 text-xs">
                  <li>No real-world banking details, credit card numbers, or online wallets are requested or parsed.</li>
                  <li>"Premium" accounts are unlocked inside the client session sandbox environment purely for feature preview.</li>
                  <li>Users are forbidden from passing any actual bank codes or real monetary data to these endpoints since they are illustrative models of transaction logic.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div id="legal-disclaimer-content" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-[#ff2e63] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> Critical Safety & Chemical Declaration
                </h3>
                <p className="text-white/70">
                  This disclaimer is provided to avert any security-level misunderstandings or liabilities, and to clarify the exact nature of the game.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4 text-xs font-mono">
                <p className="text-white/90">
                  <strong>APPLICABILITY & DEFINITION OF ATOMIC SYMBOLS:</strong>
                </p>
                <p className="text-white/60 leading-relaxed">
                  The terms used within this applet, including but not limited to <em>"Atomic Chain Reaction," "Atomic Burst," "Fission Fuses," "Explosive Energy," "Thermal Grid," "Cell Capture," "Critical Capacity,"</em> and <em>"Nuclear Splitting,"</em> are used strictly as creative theme elements for a strategic cellular math board game.
                </p>
                <p className="text-[#ff2e63]/90 font-black uppercase leading-relaxed">
                  This game does not teach, encourage, support, or describe military tactics, nuclear munitions compounding, explosive manufacturing, weapons of mass destruction, or dangerous chemicals. Players receive strictly logical math and gaming entertainment.
                </p>
                <p className="text-white/60 leading-relaxed">
                  Any visual representation of explosions, split atomic nodes, or color-fused orb propagation are programmatic graphics utilizing basic HTML canvases and simple renderers. There is no real-world energy dissipation, radiation release, or military utility associated.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff2e63] rounded-full inline-block" /> Health Warning
                </h3>
                <p className="text-white/70">
                  The fast-paced visual cascades, particle chain bursts, and neon rendering filters might trigger minor visual overstimulation or photosensitivity. If you experience dizziness, visual distortion, or eye strain, please mute sound, lower display brightness, or suspend gameplay.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div id="legal-modal-footer" className="p-4 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-[10px] text-white/30 font-mono">
            Revision: 2026.05.27.Compliance.01 • Active Regulatory Framework
          </div>
          <button
            onClick={onClose}
            id="legal-confirm-button"
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#ff2e63] to-red-500 hover:scale-105 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest transition-transform skew-x-[-6deg]"
          >
            I Acknowledge & Agree
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
