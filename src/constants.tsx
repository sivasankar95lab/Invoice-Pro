import React from 'react';

export const APP_NAME = "Invoice Pro";
export const LOGIN_PASSWORD = "adminpass";

// Pastel Green Palette (Tailwind equivalents usually used, defined here for reference)
export const COLORS = {
  primary: '#2e7d31',
  secondary: '#4caf50',
  bg: '#f0fdf4',
  surface: '#ffffff',
  text: '#1f2937'
};

export const APP_LOGO_URL = "https://i.ibb.co/nNWT6zvw/345x150.png";
export const FAVICON_URL = "https://i.ibb.co/78MqDhb/239x250.png";
export const COMPANY_LOGO_URL = "https://i.ibb.co/6cTsY0Bh/SLabLogo.png";

export const CUSTOMER_TAG_COLORS = [
  '#2e7d31', // Brand Green
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899'  // Pink
];

export const AppLogo = ({ className }: { className?: string }) => (
  <img src={APP_LOGO_URL} alt="Invoice Pro" className={`object-contain ${className}`} />
);

export const Favicon = ({ className }: { className?: string }) => (
  <img src={FAVICON_URL} alt="Icon" className={`object-contain ${className}`} />
);