export type SettingGridRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  isActive: boolean | null;
  /** Always null for a secret — the grid never echoes a credential. */
  value: string | null;
  /** Whether a (possibly hidden) value is stored. */
  hasValue: boolean;
  isSecret: boolean;
  amount: number | null;
  createdAt: Date;
  updatedAt: Date | null;
};
