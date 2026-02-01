import React, { useState, useRef, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, readOnly = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lines = code.split('\n');
  const lineNumbers = lines.map((_, i) => i + 1);

  // Tab handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 4 spaces
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      onChange(newValue);

      // Move cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  return (
    <div className="relative flex h-full w-full font-mono text-sm border border-slate-700 rounded-md bg-slate-900 overflow-hidden">
      {/* Line Numbers */}
      <div 
        ref={lineNumbersRef}
        className="w-12 bg-slate-800 text-slate-500 text-right pr-3 pt-4 select-none overflow-hidden"
      >
        {lineNumbers.map((num) => (
          <div key={num} className="h-6 leading-6">
            {num}
          </div>
        ))}
      </div>

      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        className="flex-1 w-full h-full bg-transparent text-slate-200 p-4 leading-6 resize-none focus:outline-none code-scroll whitespace-pre"
        style={{ tabSize: 4 }}
      />
    </div>
  );
};