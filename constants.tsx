
import React from 'react';
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: 'bg-blue-100 text-blue-600 border-blue-200',
  Personal: 'bg-green-100 text-green-600 border-green-200',
  Idea: 'bg-purple-100 text-purple-600 border-purple-200',
  Urgent: 'bg-red-100 text-red-600 border-red-200',
  General: 'bg-slate-100 text-slate-600 border-slate-200',
  Private: 'bg-slate-900 text-white border-slate-800',
};

export const CATEGORY_DOTS: Record<Category, string> = {
  Work: 'bg-blue-500',
  Personal: 'bg-green-500',
  Idea: 'bg-purple-500',
  Urgent: 'bg-red-500',
  General: 'bg-slate-500',
  Private: 'bg-slate-900',
};

export const STICKY_COLORS = [
  { name: 'Yellow', bg: 'bg-[#FFF9C4]', border: 'border-[#FBC02D]', text: 'text-[#5D4037]' },
  { name: 'Pink', bg: 'bg-[#F8BBD0]', border: 'border-[#F06292]', text: 'text-[#880E4F]' },
  { name: 'Blue', bg: 'bg-[#B3E5FC]', border: 'border-[#29B6F6]', text: 'text-[#01579B]' },
  { name: 'Green', bg: 'bg-[#C8E6C9]', border: 'border-[#66BB6A]', text: 'text-[#1B5E20]' },
  { name: 'Orange', bg: 'bg-[#FFE0B2]', border: 'border-[#FF9800]', text: 'text-[#E65100]' },
  { name: 'Purple', bg: 'bg-[#E1BEE7]', border: 'border-[#BA68C8]', text: 'text-[#4A148C]' },
];

export const STORAGE_KEY = 'mindkeep_notes_v3';
