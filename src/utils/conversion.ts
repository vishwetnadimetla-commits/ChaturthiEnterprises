export const calculateLitres = (count: number, litresPerUnit: number | null): number => {
  if (litresPerUnit === null || litresPerUnit === undefined) return 0;
  return count * litresPerUnit;
};

export const formatLitres = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0.00 L';
  return value.toFixed(2) + ' L';
};

export const formatUnits = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString();
};
