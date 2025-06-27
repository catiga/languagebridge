"use client";
import React, { useState } from 'react';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount, useSignMessage, useNetwork, useChainId } from 'wagmi';
import { mainnet, arbitrum, optimism, polygon, bsc, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiClient } from '../utils/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const config = getDefaultConfig({
  appName: 'EnglishBridge',
  projectId: 'WALLETCONNECT_PROJECT_ID', // TODO: 替换为你的WalletConnect项目ID
  chains: [mainnet, arbitrum, optimism, polygon, bsc, base],
  ssr: false,
});

const queryClient = new QueryClient();

// 假设你有一个变量isSolanaWallet来判断当前是否为Solana钱包
// 这里用伪代码，实际集成Solana钱包时需替换为真实判断
const isSolanaWallet = false; // TODO: 替换为真实Solana钱包连接状态

function WalletSignFlow() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const [msgId, setMsgId] = useState<number | null>(null);
  const router = useRouter();

  // EVM链映射
  const CHAIN_ID_TO_NAME: Record<number, string> = {
    1: 'ethereum',
    56: 'bsc',
    137: 'polygon',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base',
    // ...如有其他链补充
  };
  let chainName = 'unknown';
  if (isSolanaWallet) {
    chainName = 'solana';
  } else {
    chainName = CHAIN_ID_TO_NAME[chainId] || 'unknown';
  }

  const saveLoginData = (token: string, userInfo: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    Cookies.set('token', token, { expires: 7, path: '/' });
    Cookies.set('userInfo', JSON.stringify(userInfo), { expires: 7, path: '/' });
    window.dispatchEvent(new Event('userChanged'));
  };

  const handleWalletLogin = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await apiClient.post('/spwapi/preauth/get_msg', { auth_key: address, chain: chainName });
      if (data && data.code === 0 && data.data && data.data.message) {
        setMsgId(data.data.id);
        const signature = await signMessageAsync({ message: data.data.message });
        const verifyRes = await apiClient.post('/spwapi/preauth/verify_msg', {
          id: data.data.id,
          sign: signature,
          chain: chainName,
          ref: ''
        });
        if (verifyRes && verifyRes.code === 0 && verifyRes.data && verifyRes.data.token) {
          toast.success('Wallet login success!');
          saveLoginData(verifyRes.data.token, verifyRes.data);
          setTimeout(() => {
            router.push('/profile/overview');
          }, 1000);
        } else {
          toast.error(verifyRes?.msg || 'Signature verify failed');
        }
      } else {
        toast.error(data?.msg || 'Failed to get sign message');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to get sign message');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;
  return (
    <div className="mt-4 w-full flex flex-col items-center">
      <button
        className={`px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={handleWalletLogin}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Sign to Login'}
      </button>
    </div>
  );
}

export default function WalletLoginSection() {
  return (
    <div className="my-8">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="flex items-center mb-4">
        <div className="flex-grow h-px bg-gray-200" />
        <span className="mx-4 text-gray-500 font-semibold">or</span>
        <div className="flex-grow h-px bg-gray-200" />
      </div>
      <div className="flex flex-col items-center">
        <div className="mb-2 text-lg font-bold text-blue-700 flex items-center gap-2">
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 13l-8-4v6a2 2 0 002 2h12a2 2 0 002-2v-6l-8 4z" /></svg>
          Wallet Login
        </div>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <ConnectButton showBalance={false} accountStatus="address" />
              <WalletSignFlow />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </div>
    </div>
  );
} 