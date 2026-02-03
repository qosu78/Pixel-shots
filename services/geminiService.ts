
/**
 * Static tactical battle cry or commentary.
 */
export const generateBattleComm = async (event: string, playerName: string) => {
  return "Tactical advantage maintained.";
};

/**
 * Static squad names.
 */
export const getBotNames = async (count: number) => {
  const STATIC_BOT_NAMES = [
    'Viper', 'Ghost', 'Phantom', 'Iron', 'Titan', 
    'Hunter', 'Rex', 'Shadow', 'Ace', 'Specter',
    'Blade', 'Wolf', 'Hawk', 'Neon', 'Zero'
  ];
  return STATIC_BOT_NAMES.slice(0, count);
};
