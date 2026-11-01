export interface ShadeServiceInterface {
  up(): Promise<void>;
  down(): Promise<void>;
  my(): Promise<void>;
}
