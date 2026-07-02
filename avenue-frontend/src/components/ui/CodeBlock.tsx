"use client";

import { useState } from "react";
import { CopySimple, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showCopy?: boolean;
  highlightLines?: number[];
}

function tokenize(code: string) {
  // Simple tokenizer for visual highlighting
  return code
    .replace(/(".*?")/g, '<span class="code-token-string">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="code-token-comment">$1</span>')
    .replace(/\b(const|let|var|async|await|function|return|import|export|from|default|if|else|true|false|null)\b/g, '<span class="code-token-keyword">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="code-token-number">$1</span>');
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative rounded-xl overflow-hidden font-mono text-sm border border-white/10", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a1f2e] border-b border-white/10">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        {filename && (
          <span className="text-[#6a8a9a] text-xs">{filename}</span>
        )}
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[#6a8a9a] hover:text-[#10b981] transition-colors text-xs"
            aria-label="Copy code"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copied</>
            ) : (
              <><CopySimple className="w-3.5 h-3.5" /> Copy</>
            )}
          </button>
        )}
      </div>

      {/* Code body */}
      <pre className="bg-[#061c28] text-[#c9d8e0] p-5 overflow-x-auto leading-relaxed">
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: tokenize(code) }}
        />
      </pre>
    </div>
  );
}
