import { useState, useMemo } from 'react';
import { CannedResponse } from '../types';

export function useCannedResponseFilter(cannedResponses: CannedResponse[]) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'usage' | 'updated' | 'shortcut'>('usage');

  const filteredResponses = useMemo(() => {
    return cannedResponses
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (statusFilter === 'active' && !item.isActive) return false;
        if (statusFilter === 'inactive' && item.isActive) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const inShortcut = item.shortcut.toLowerCase().includes(q);
          const inTitle = item.title.toLowerCase().includes(q);
          const inContent = item.content.toLowerCase().includes(q);
          const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
          return inShortcut || inTitle || inContent || inTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
        if (sortBy === 'updated') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        if (sortBy === 'shortcut') return a.shortcut.localeCompare(b.shortcut);
        return 0;
      });
  }, [cannedResponses, selectedCategory, statusFilter, searchQuery, sortBy]);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filteredResponses,
  };
}
