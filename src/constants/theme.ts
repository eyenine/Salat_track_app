export const COLORS = {
  bg: '#06080a',          // Premium deep obsidian background
  bgLight: '#0c0f14',     // Slightly lighter obsidian section background
  card: '#12171e',        // Sleek matte slate dark card background
  cardHover: '#18202a',   // Interactive card background
  border: '#1d2633',      // Modern subtle border
  borderGlow: '#2f3d52',  // Glowing border for active elements
  primary: '#10b981',     // Vibrant emerald green
  primaryDark: '#059669', // Medium emerald green
  gold: '#f59e0b',        // Radiant amber/gold accent
  goldGlow: '#fbbf24',    // Bright gold glow
  text: '#f3f4f6',        // Clean off-white text
  textMuted: '#8a99ad',   // Sleek muted slate text
  textSoft: '#a7f3d0',    // Soft mint green text
  
  // Status Colors (Matching the theme)
  STATUS: {
    PENDING: '#64748b',   // Cool slate gray
    ON_TIME: '#10b981',   // Emerald
    LATE: '#f59e0b',      // Gold/Amber
    QAZA: '#8b5cf6',      // Royal Purple
    MISSED: '#f43f5e',    // Rose/Ruby Red
    EXCUSED: '#475569',   // Dark Steel Blue
  }
};

export const SHADOWS = {
  emerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  gold: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  }
};
