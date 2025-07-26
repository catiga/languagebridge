// frontend/app/v2/components/custom-select.tsx

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        className={`w-full px-4 py-2 text-left bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? selectedOption.label : (placeholder || 'Select an option')}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 overflow-auto">
          <input
            type="text"
            placeholder="Search..."
            className="sticky top-0 z-10 w-full px-4 py-2 border-b border-gray-200 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking search input
          />
          <ul role="listbox" className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOptionClick(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No options found.</li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default CustomSelect;
