// src/types/change-case-object.d.ts

declare module 'change-case-object' {
  export function camelCaseKeys<T>(obj: T, options?: { deep?: boolean }): T;
  export function snakeCaseKeys<T>(obj: T, options?: { deep?: boolean }): T;
}