import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info } from 'lucide-react';

interface ConsentBannerProps {
  onOpenLegal: (tab: 'privacy' | 'terms' | 'simulator' | 'disclaimer') => void;
}

export default function ConsentBanner({ onOpenLegal }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the consent banner
    const consent = localStorage.getItem('atomic_cookie_consent_accepted');
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('atomic_cookie_consent_accepted', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          id="consent-banner-wrapper"
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[990] bg-[#09090b]/95 backdrop-blur-md border-2 border-[#ff2e63]/30 rounded-2xl p-5 shadow-[0_10px_40px_rgba(255,46,99,0.2)]"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#ff2e63]/10 border border-[#ff2e63]/20 rounded-xl text-[#ff2e63] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase italic tracking-wider skew-x-[-6deg] text-white">
                  Compliance & Cookie Gasket
                </h4>
                <p className="text-[10px] sm:text-xs text-white/60 leading-normal">
                  We use cookies and HTML5 storage to maintain active matchmaking, Google Auth credentials, preferences, and custom avatars. By clicking and playing, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('privacy')}
                    className="text-[#ff2e63] hover:underline font-extrabold focus:outline-none"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal('terms')}
                    className="text-[#ff2e63] hover:underline font-extrabold focus:outline-none"
                  >
                    Terms of Use
                  </button>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => onOpenLegal('disclaimer')}
                className="text-[9px] uppercase font-bold tracking-widest text-white/30 hover:text-white transition-colors"
              >
                Disclaimers
              </button>
              <div className="flex-1" />
              <button
                type="button"
                id="consent-accept-btn"
                onClick={handleAccept}
                className="px-5 py-2 bg-gradient-to-r from-[#ff2e63] to-red-500 hover:scale-105 active:scale-95 text-white font-black uppercase text-[10px] tracking-widest transition-transform skew-x-[-6deg] shadow-[0_0_15px_rgba(255,46,99,0.3)]"
              >
                Accept All / Initialize
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
