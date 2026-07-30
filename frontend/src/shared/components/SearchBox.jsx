import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBox({
  placeholder = "Search...",
  onSearch,
  initialValue = "",
}) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
        <Search className="w-5 h-5" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-50"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
