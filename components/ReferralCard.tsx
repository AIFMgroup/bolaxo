'use client';

import { useState, useEffect } from 'react';
import { Share2, Users, Copy, Check } from 'lucide-react';

interface ReferralCardProps {
  referralCode: string;
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_BASE_URL || 'https://bolaxo.com');
  const referralLink = `${baseUrl}/login?ref=${referralCode}`;

  useEffect(() => {
    // Hämta antal referrals (skulle vara ett API-call i produktion)
    // För nu: mock
    setReferralCount(0);
  }, [referralCode]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-primary-blue to-blue-600 rounded-2xl p-8 text-white shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Bjud in vänner
          </h3>
          <p className="text-blue-100 text-sm">Dela din referral-länk och få bonusar</p>
        </div>
        <div className="text-center bg-white/20 rounded-xl p-4">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-5 h-5 mr-2" />
            <span className="text-3xl font-bold">{referralCount}</span>
          </div>
          <p className="text-xs text-blue-100">Inbjudna</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <p className="text-sm text-blue-100 mb-2">Din unika referral-länk:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-white text-primary-blue rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Kopierad!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Kopiera
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-blue-100">
        <p>💡 När någon registrerar sig via din länk får båda 20% rabatt på första månaden!</p>
      </div>
    </div>
  );
}

