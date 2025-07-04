import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const WALLET_ADDRESSES: Record<string, string> = {
  ERC20: '0x16B2dafE491531b5DB409630203b5368aBb63987',
  BEP20: '0x16B2dafE491531b5DB409630203b5368aBb63987',
  Solana: '0x16B2dafE491531b5DB409630203b5368aBb63987',
  TRC20: '0x16B2dafE491531b5DB409630203b5368aBb63987',
  OP: '0x16B2dafE491531b5DB409630203b5368aBb63987',
  ARB: '0x16B2dafE491531b5DB409630203b5368aBb63987',
};

const CHAIN_OPTIONS = [
  { label: 'Ethereum (ERC20)', value: 'ERC20' },
  { label: 'BNB Chain (BEP20)', value: 'BEP20' },
  { label: 'Solana', value: 'Solana' },
  { label: 'Tron (TRC20)', value: 'TRC20' },
  { label: 'Optimism (OP)', value: 'OP' },
  { label: 'Arbitrum (ARB)', value: 'ARB' },
];

export default function CryptoAndWechatPayment({ wechatQrSrc }: { wechatQrSrc?: string }) {
  const [selectedChain, setSelectedChain] = useState('ERC20');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLET_ADDRESSES[selectedChain]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="mt-6 rounded-2xl shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 transition-all">
      <div className="flex items-center mb-6">
        <svg className="h-8 w-8 text-blue-500 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="#fff"/><path d="M3 7l9 6 9-6" stroke="#3b82f6" strokeWidth="2" fill="none"/></svg>
        <span className="text-xl font-bold text-blue-700 tracking-wide">Secure Payment Area</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 微信支付 */}
        <div className="flex flex-col items-center bg-white rounded-xl border border-blue-100 shadow p-6">
          <div className="font-bold text-lg mb-2 text-gray-800">Pay via WeChat</div>
          <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border mb-2">
            <QRCodeSVG
              value={wechatQrSrc ? wechatQrSrc : 'https://u.wechat.com/EBL9aQu9Xr_Zg4DAmC13LX0?s=3'}
              size={120}
              bgColor="#F3F4F6"
              fgColor="#22c55e"
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-gray-600 text-sm text-center">Add our customer service on WeChat and mention your order number.</div>
          <div className="mt-2 text-xs text-gray-400">WeChat ID: <b>your_wechat_id</b></div>
        </div>
        {/* 加密货币支付 */}
        <div className="flex flex-col items-center bg-white rounded-xl border border-blue-100 shadow p-6">
          <div className="font-bold text-lg mb-2 text-gray-800">Pay with Crypto (USDT/USDC)</div>
          <div className="mb-3 w-full">
            <label className="mr-2 font-medium text-gray-700">Select Chain:</label>
            <div className="relative inline-block w-full">
              <select
                className="block w-full appearance-none border border-blue-300 rounded-lg px-4 py-2 pr-8 bg-blue-50 text-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                value={selectedChain}
                onChange={e => setSelectedChain(e.target.value)}
              >
                {CHAIN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 w-full justify-center">
            <span className="font-mono text-base bg-blue-50 px-3 py-2 rounded select-all border border-blue-200 text-blue-800 tracking-tight">{WALLET_ADDRESSES[selectedChain]}</span>
            <button
              className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition font-semibold"
              onClick={handleCopy}
            >{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          <div className="text-gray-600 text-sm mt-3 text-center">After payment, please upload your transaction hash or contact support.</div>
        </div>
      </div>
    </div>
  );
} 