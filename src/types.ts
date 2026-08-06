/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'en';

export interface Service {
  id: string;
  iconName: string; // Lucide icon name
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  details: { ar: string[]; en: string[] };
  duration: { ar: string; en: string };
}

export interface Doctor {
  id: string;
  name: { ar: string; en: string };
  role: { ar: string; en: string };
  bio: { ar: string; en: string };
  specialties: { ar: string[]; en: string[] };
  education: { ar: string; en: string };
  image: string;
}

export interface Testimonial {
  id: string;
  name: { ar: string; en: string };
  rating: number;
  comment: { ar: string; en: string };
  treatment: { ar: string; en: string };
  date: string;
}

export interface GalleryItem {
  id: string;
  title: { ar: string; en: string };
  category: 'clinic' | 'cases';
  image: string;
  description?: { ar: string; en: string };
}

export interface Appointment {
  name: string;
  phone: string;
  email: string;
  serviceId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface BlogPost {
  id: string;
  title: { ar: string; en: string };
  excerpt: { ar: string; en: string };
  content: { ar: string; en: string };
  date: { ar: string; en: string };
  readTime: { ar: string; en: string };
  category: { ar: string; en: string };
  image: string;
  author: { ar: string; en: string };
}
