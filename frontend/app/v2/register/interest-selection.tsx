// frontend/app/v2/register/interest-selection.tsx

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/api'; // Adjust the import path as needed

interface Tag {
  id: number; // Use lowercase 'id'
  name: string; // Use lowercase 'name'
  desc: string; // Use lowercase 'desc'
}

interface InterestSelectionProps {
  selectedCategories: string[];
  onCategoryChange: (selectedCategories: string[]) => void;
  error?: string;
}

// Predefined color palettes
const colorPalettes = [
  { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300' },
  { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300' },
];

const InterestSelection: React.FC<InterestSelectionProps> = ({
  selectedCategories,
  onCategoryChange,
  error,
}) => {
  const [categories, setCategories] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/spwapi/public/tags'); // Assuming /spwapi is the proxy path
        if (res && res.code === 0 && res.data) { // Check for res.data
          // Ensure data is an array before setting state
          if (Array.isArray(res.data)) {
            // Filter out any invalid elements before setting state
            const validCategories = res.data.filter((item: any) => item && typeof item.id === 'number' && typeof item.name === 'string');
            setCategories(validCategories);
          } else {
            setFetchError('Invalid data format received: data is not an array');
          }
        } else {
          setFetchError(res?.msg || 'Failed to fetch interest categories');
        }
      } catch (err: any) {
        setFetchError(err?.message || 'Failed to fetch interest categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: number) => {
    const categoryIdStr = categoryId.toString(); // Convert number ID to string for consistency
    const newSelectedCategories = selectedCategories.includes(categoryIdStr)
      ? selectedCategories.filter(id => id !== categoryIdStr)
      : [...selectedCategories, categoryIdStr];
    onCategoryChange(newSelectedCategories);
  };

  if (loading) {
    return <div>Loading interest categories...</div>;
  }

  if (fetchError) {
    return <div className="text-red-500">Error: {fetchError}</div>;
  }

  // Add check for categories data before mapping
  if (!categories || categories.length === 0) {
      return <div className="text-gray-500">No interest categories available.</div>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Choose Your Interests</h3>
      <div className="flex flex-wrap gap-3">
        {categories.map((category, index) => {
            // Add check for individual category element
            if (!category || typeof category.id !== 'number') { // Use lowercase 'id'
                console.error('Invalid category data received:', category);
                return null; // Skip rendering invalid category
            }
            const colorIndex = index % colorPalettes.length;
            const colors = colorPalettes[colorIndex];

            return (
              <button
                key={category.id} // Use lowercase 'id'
                type="button"
                onClick={() => handleCategoryClick(category.id)} // Use lowercase 'id'
                className={`px-6 py-3 rounded-full border transition duration-300 text-sm font-medium
                  ${selectedCategories.includes(category.id.toString())
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' // Added scale-105 for selected effect
                    : `${colors.bg} ${colors.text} ${colors.border} hover:bg-opacity-75 transform hover:scale-105` // Added hover scale effect
                  }`}
              >
                {category.name} {/* Use lowercase 'name' */}
              </button>
            );
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default InterestSelection;
