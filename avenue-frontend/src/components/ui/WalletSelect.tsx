import React, { useState, useRef, useEffect } from 'react';
import { Wallet as WalletIcon, CaretDown, Check } from '@phosphor-icons/react';
import { Wallet } from '@/lib/api/walletsApi';

interface WalletSelectProps {
  wallets: Wallet[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function WalletSelect({ wallets, value, onChange, placeholder = "-- Select Wallet --" }: WalletSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedWallet = wallets.find(w => w.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-white border border-[#e4e7e9] rounded-lg px-3.5 py-2.5 flex items-center justify-between hover:border-[#bbbdbd] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all"
      >
        {selectedWallet ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#059669] flex items-center justify-center shrink-0">
              <WalletIcon weight="duotone" className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-[#022c22] truncate">
                {selectedWallet.account_name || `${selectedWallet.first_name} ${selectedWallet.last_name}`.trim() || selectedWallet.label || 'Unnamed Wallet'}
              </span>
              <span className="text-xs text-[#6a6c6c] font-mono truncate">
                {selectedWallet.bank_name} • {selectedWallet.account_number}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-sm text-[#6a6c6c]">{placeholder}</span>
        )}
        <CaretDown className={`w-4 h-4 text-[#6a6c6c] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#e4e7e9] rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-64 overflow-y-auto p-1">
            {wallets.length === 0 ? (
              <li className="p-3 text-sm text-[#6a6c6c] text-center">No wallets found</li>
            ) : null}
            {wallets.map((wallet) => {
              const isSelected = value === wallet.id;
              const displayName = wallet.account_name || `${wallet.first_name} ${wallet.last_name}`.trim() || wallet.label || 'Unnamed Wallet';
              const balanceFormatted = (wallet.balance / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
              
              return (
                <li
                  key={wallet.id}
                  onClick={() => {
                    onChange(wallet.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-[#f0fdf4] text-[#022c22]' : 'hover:bg-[#f7f9fb] text-[#022c22]'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#10b981] text-white' : 'bg-[#f7f9fb] text-[#6a6c6c]'}`}>
                      <WalletIcon weight={isSelected ? "fill" : "duotone"} className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold truncate">{displayName}</span>
                      <span className="text-xs text-[#6a6c6c] font-mono truncate">{wallet.bank_name} • {wallet.account_number}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-semibold text-[#022c22]">₦{balanceFormatted}</span>
                    {isSelected ? <Check className="w-4 h-4 text-[#10b981]" /> : <div className="w-4 h-4" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
