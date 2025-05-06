import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name
 * @param name The full name to get initials from
 * @returns The first letter of each word in the name, up to 2 letters
 */
export function getInitials(name?: string | null): string {
  if (!name) return "U";
  
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .filter(char => char.length > 0)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Format a media URL to ensure it's properly referenced
 * @param url The media URL to format
 * @returns The properly formatted URL
 */
export function formatMediaUrl(url?: string | null): string {
  if (!url) return "";
  
  // If it's a data URL, return as is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // If it already has a leading slash, return as is
  if (url.startsWith('/')) {
    return url;
  }
  
  // Add leading slash for relative paths
  return `/${url}`;
}
