/**
 * Copies text to clipboard and returns a promise that resolves when the operation is complete
 * @param text The text to copy to clipboard
 * @returns A promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
