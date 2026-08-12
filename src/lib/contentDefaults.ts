/**
 * Static fallbacks for services, testimonials, and vision images.
 * Used when Supabase is empty / unavailable; admin CRUD becomes the live source after first save.
 */
import { SERVICES, TESTIMONIALS } from '../data';
import type { Service, Testimonial, VisionImages } from '../types';
import { IMAGES } from './images';

export const DEFAULT_VISION_IMAGES: VisionImages = {
  imagePrimary: IMAGES.about,
  imageSecondary: IMAGES.heroAlt,
};

export const DEFAULT_SERVICES: Service[] = SERVICES;

export const DEFAULT_TESTIMONIALS: Testimonial[] = TESTIMONIALS;
