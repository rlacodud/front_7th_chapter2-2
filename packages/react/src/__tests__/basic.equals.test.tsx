import { describe, expect, it } from "vitest";
import { deepEquals, shallowEquals } from "../utils/equals";

describe("비교 함수 구현하기 > ", () => {
  describe("shallowEquals 함수", () => {
    it("기본 타입 값들을 정확히 비교해야 한다", () => {
      expect(shallowEquals(1, 1)).toBe(true);
      expect(shallowEquals("안녕", "안녕")).toBe(true);
      expect(shallowEquals(true, true)).toBe(true);
      expect(shallowEquals(null, null)).toBe(true);
      expect(shallowEquals(undefined, undefined)).toBe(true);
      expect(shallowEquals(1, 2)).toBe(false);
      expect(shallowEquals("안녕", "잘가")).toBe(false);
      expect(shallowEquals(true, false)).toBe(false);
      expect(shallowEquals(null, undefined)).toBe(false);
    });

    it("배열을 얕게 비교해야 한다", () => {
      expect(shallowEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(shallowEquals([1, 2, 3], [1, 2, 4])).toBe(false);
      const arr1 = [1, {}];
      const arr2 = [1, {}];
      expect(shallowEquals(arr1, arr2)).toBe(false); // 다른 객체 참조
    });

    it("객체를 얕게 비교해야 한다", () => {
      expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      const obj1 = { a: {} };
      const obj2 = { a: {} };
      expect(shallowEquals(obj1, obj2)).toBe(false); // 다른 객체 참조
    });

    it("중첩된 구조를 깊게 비교하지 않아야 한다", () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      expect(shallowEquals(obj1, obj2)).toBe(false); // 중첩된 객체의 참조가 다름
    });
  });

  describe("deepEquals 함수", () => {
    it("기본 타입 값들을 정확히 비교해야 한다", () => {
      expect(deepEquals(1, 1)).toBe(true);
      expect(deepEquals("안녕", "안녕")).toBe(true);
      expect(deepEquals(true, true)).toBe(true);
      expect(deepEquals(null, null)).toBe(true);
      expect(deepEquals(undefined, undefined)).toBe(true);
      expect(deepEquals(1, 2)).toBe(false);
      expect(deepEquals("안녕", "잘가")).toBe(false);
      expect(deepEquals(true, false)).toBe(false);
      expect(deepEquals(null, undefined)).toBe(false);
    });

    it("배열을 정확히 비교해야 한다", () => {
      expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEquals([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEquals([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });

    it("객체를 정확히 비교해야 한다", () => {
      expect(deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(deepEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(deepEquals({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
      expect(deepEquals({ a: { b: 2 } }, { a: { b: 3 } })).toBe(false);
    });

    it("중첩된 구조를 정확히 비교해야 한다", () => {
      const obj1 = { a: 1, b: { c: 2, d: [3, 4, { e: 5 }] } };
      const obj2 = { a: 1, b: { c: 2, d: [3, 4, { e: 5 }] } };
      const obj3 = { a: 1, b: { c: 2, d: [3, 4, { e: 6 }] } };
      expect(deepEquals(obj1, obj2)).toBe(true);
      expect(deepEquals(obj1, obj3)).toBe(false);
    });
  });
});
