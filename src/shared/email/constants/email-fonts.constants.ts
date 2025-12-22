// Email Font Constants - Centralized font configuration for all emails
export const EMAIL_FONTS = {
  // Google Fonts link
  //   GOOGLE_FONTS_LINK:
  //     'https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap',

  GOOGLE_FONTS_LINK:
    'https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap',
  // Font family CSS value
  //   FONT_FAMILY: "'Merriweather', Georgia, 'Times New Roman', serif",
  FONT_FAMILY: "'Google Sans', sans-serif",

  // Preconnect links for performance
  PRECONNECT_GOOGLE: 'https://fonts.googleapis.com',
  PRECONNECT_GSTATIC: 'https://fonts.gstatic.com',
} as const;
