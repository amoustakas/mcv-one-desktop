// Minimal bn.js ambient declaration.
//
// bn.js v5 ships without .d.ts files. We need just enough type surface to
// treat monetary fields as BN instances throughout the SDK. @types/bn.js
// exists on the npm registry and may be adopted later — for now the shim
// is local to this package so adding it doesn't churn the workspace
// lockfile.
//
// Only the constructors + arithmetic methods actually used in the SDK are
// declared. Adding new methods is fine; do not reach for bn.js internals
// that aren't tracked here without updating the shim.

declare module 'bn.js' {
  export interface Endianness { big: 'be'; little: 'le' }

  export default class BN {
    constructor(
      number: number | string | BN | Uint8Array | Buffer,
      base?: number | 'hex',
      endian?: 'be' | 'le',
    );
    /** Absolute value */
    abs(): BN;
    add(other: BN): BN;
    sub(other: BN): BN;
    mul(other: BN): BN;
    /** Quotient of integer division */
    div(other: BN): BN;
    /** Remainder of integer division */
    mod(other: BN): BN;
    /** Raise to power */
    pow(other: BN): BN;
    cmp(other: BN): -1 | 0 | 1;
    eq(other: BN): boolean;
    lt(other: BN): boolean;
    lte(other: BN): boolean;
    gt(other: BN): boolean;
    gte(other: BN): boolean;
    isZero(): boolean;
    isNeg(): boolean;
    neg(): BN;
    toString(base?: number | 'hex', padding?: number): string;
    toNumber(): number;
    toArray(endian?: 'be' | 'le', length?: number): number[];
    toBuffer(endian?: 'be' | 'le', length?: number): Buffer;
    clone(): BN;

    /** Returns true if BN.isBN(obj) */
    static isBN(obj: unknown): obj is BN;
    static max(a: BN, b: BN): BN;
    static min(a: BN, b: BN): BN;
  }
}
