/** @jsx createElement */
/** @jsxFrag Fragment */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, Fragment, setup, useEffect, useState } from "../core";
import { useAutoCallback, useCallback, useDeepMemo, useMemo, useRef } from "../hooks";
import { shallowEquals } from "../utils";

const flushMicrotasks = async () => await Promise.resolve();

describe("Chapter 2-2 심화과제: hooks 구현하기 > ", () => {
  describe("직접 구현한 hooks > ", () => {
    describe("useRef 훅", () => {
      it("리렌더링이 되어도 useRef의 참조값이 유지된다. ", async () => {
        const refs = new Set();
        let rerenderFn1: (() => void) | undefined;
        let rerenderFn2: (() => void) | undefined;

        function UseMyRefTest({ label }: { label: string }) {
          const [, rerender] = useState({});
          const ref = useRef<HTMLDivElement | null>(null);
          refs.add(ref);

          if (label === "rerender1") {
            rerenderFn1 = () => rerender({});
          } else {
            rerenderFn2 = () => rerender({});
          }

          return createElement("div", { ref }, createElement("button", null, label));
        }

        const container = document.createElement("div");
        setup(
          createElement(
            Fragment,
            null,
            createElement(UseMyRefTest, { label: "rerender1" }),
            createElement(UseMyRefTest, { label: "rerender2" }),
          ),
          container,
        );

        rerenderFn1!();
        await flushMicrotasks();
        rerenderFn2!();
        await flushMicrotasks();

        expect(refs.size).toBe(2);
      });

      it("렌더링 간에 ref 값을 유지하고, 값 변경 시 리렌더링을 트리거하지 않아야 한다", async () => {
        let renderCount = 0;
        let incrementRef: (() => void) | undefined;
        let forceUpdate: (() => void) | undefined;
        let refValue: () => number;

        function TestComponent() {
          const [, setForceUpdate] = useState({});
          const ref = useRef(0);
          renderCount++;

          incrementRef = () => {
            ref.current += 1;
          };
          forceUpdate = () => setForceUpdate({});
          refValue = () => ref.current;

          return createElement(
            "div",
            null,
            createElement("div", { "data-testid": "render-count" }, `Render Count: ${renderCount}`),
            createElement("div", { "data-testid": "ref-value" }, `Ref Value: ${ref.current}`),
          );
        }

        const container = document.createElement("div");
        setup(<TestComponent />, container);

        expect(renderCount).toBe(1);
        expect(refValue!()).toBe(0);

        incrementRef!();
        await flushMicrotasks();

        expect(renderCount).toBe(1);
        expect(refValue!()).toBe(1);

        forceUpdate!();
        await flushMicrotasks();

        expect(renderCount).toBe(2);
        expect(refValue!()).toBe(1);
      });
    });

    describe("useMemo 훅", () => {
      const mockFactory = vi.fn();
      let updateDeps: ((newDeps: unknown[]) => void) | undefined;

      function TestComponent({ initialDeps }: { initialDeps: unknown[] }) {
        const [deps, setDeps] = useState(initialDeps);
        const [, setRenderCount] = useState(0);

        useMemo(() => mockFactory(), deps);

        updateDeps = (newDeps: unknown[]) => setDeps(newDeps);

        return createElement(
          "div",
          null,
          createElement("button", { onClick: () => setRenderCount((prev) => prev + 1) }, "Force Render"),
        );
      }

      beforeEach(() => {
        mockFactory.mockClear();
      });

      it("useMemo 메모이제이션 테스트: 의존성의 값들이 변경될 때 재계산", async () => {
        const container = document.createElement("div");
        setup(createElement(TestComponent, { initialDeps: [42] }), container);
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([42]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([43]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(2);

        updateDeps!([42, 43]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(3);

        updateDeps!([42, 43]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(3);

        const emptyObject = {};
        updateDeps!([emptyObject]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(4);

        updateDeps!([emptyObject]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(4);
      });
    });

    describe("useCallback 훅", () => {
      const mockCallback = vi.fn((x: number) => x * 2);
      let updateDeps: ((newDeps: unknown[]) => void) | undefined;
      let getMemoizedCallback: (() => () => unknown) | undefined;

      function TestComponent({ initialDeps }: { initialDeps: unknown[] }) {
        const [deps, setDeps] = useState(initialDeps);
        const [, setRenderCount] = useState(0);

        const memoizedCallback = useCallback(() => mockCallback(42), deps);

        updateDeps = (newDeps: unknown[]) => setDeps(newDeps);
        getMemoizedCallback = () => memoizedCallback;

        return createElement(
          "div",
          null,
          createElement("button", { onClick: () => setRenderCount((prev) => prev + 1) }, "Force Render"),
        );
      }

      beforeEach(() => {
        mockCallback.mockClear();
      });

      it("useCallback 메모이제이션 테스트: 의존성의 값들이 변경될 때 재생성", async () => {
        const container = document.createElement("div");
        setup(createElement(TestComponent, { initialDeps: [42] }), container);
        const initialCallback = getMemoizedCallback!();
        expect(initialCallback).toBeDefined();

        updateDeps!([42]);
        await flushMicrotasks();
        expect(getMemoizedCallback!()).toBe(initialCallback);

        updateDeps!([43]);
        await flushMicrotasks();
        expect(getMemoizedCallback!()).not.toBe(initialCallback);

        updateDeps!([42, 43]);
        await flushMicrotasks();
        const newCallback = getMemoizedCallback!();
        expect(newCallback).not.toBe(initialCallback);

        updateDeps!([42, 43]);
        await flushMicrotasks();
        expect(getMemoizedCallback!()).toBe(newCallback);
      });

      it("메모이제이션된 콜백 함수가 올바르게 동작하는지 확인", async () => {
        const container = document.createElement("div");
        setup(createElement(TestComponent, { initialDeps: [] }), container);
        const memoizedCallback = getMemoizedCallback!();

        memoizedCallback();
        expect(mockCallback).toHaveBeenCalledWith(42);
        expect(mockCallback).toHaveBeenCalledTimes(1);

        memoizedCallback();
        expect(mockCallback).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("custom hook 만들어보기", () => {
    describe("useMemo의 deps 비교 함수를 주입받아서 사용할 수 있다.", () => {
      const mockFactory = vi.fn();
      let updateDeps: ((newDeps: unknown[]) => void) | undefined;

      function TestComponent({
        initialDeps,
        equals = shallowEquals,
      }: {
        initialDeps: unknown[];
        equals: typeof shallowEquals;
      }) {
        const [deps, setDeps] = useState(initialDeps);
        const [, setRenderCount] = useState(0);

        useMemo(() => mockFactory(), deps, equals);

        updateDeps = (newDeps: unknown[]) => setDeps(newDeps);

        return createElement(
          "div",
          null,
          createElement("button", { onClick: () => setRenderCount((prev) => prev + 1) }, "Force Render"),
        );
      }

      beforeEach(() => {
        mockFactory.mockClear();
      });

      it("useMemo의 deps 비교 함수를 주입받아서 사용할 수 있다.", async () => {
        const equals = (a: unknown[], b: unknown[]) => a[0] === b[0];
        const container = document.createElement("div");
        setup(createElement(TestComponent, { initialDeps: [42], equals }), container);
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([42]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([43]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(2);

        updateDeps!([43, 44]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(2);

        updateDeps!([41, 44]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(3);
      });
    });

    describe("useDeepMemo 훅", () => {
      const mockFactory = vi.fn();
      let updateDeps: ((newDeps: unknown[]) => void) | undefined;

      function TestComponent({ initialDeps }: { initialDeps: unknown[] }) {
        const [deps, setDeps] = useState(initialDeps);
        const [, setRenderCount] = useState(0);

        useDeepMemo(() => mockFactory(), deps);

        updateDeps = (newDeps: unknown[]) => setDeps(newDeps);

        return createElement(
          "div",
          null,
          createElement("button", { onClick: () => setRenderCount((prev) => prev + 1) }, "Force Render"),
        );
      }

      beforeEach(() => {
        mockFactory.mockClear();
      });

      it("useDeepMemo를 사용할 경우, dependencies의 값에 대해 깊은비교를 하여 메모이제이션 한다.", async () => {
        const container = document.createElement("div");
        setup(createElement(TestComponent, { initialDeps: [{}] }), container);
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([{}]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(1);

        updateDeps!([{ a: 1 }]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(2);

        updateDeps!([{ a: 1 }]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(2);

        updateDeps!([[1, 2]]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(3);

        updateDeps!([[1, 2]]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(3);

        updateDeps!([[1, 2, 3]]);
        await flushMicrotasks();
        expect(mockFactory).toHaveBeenCalledTimes(4);
      });
    });

    describe("useAutoCallback 훅", () => {
      it("useAutoCallback으로 만들어진 함수는, 참조가 변경되지 않으면서 항상 새로운 값을 참조한다.", async () => {
        const fn = (x: number) => x * 2;
        const mockCallback1 = vi.fn(fn);
        const mockCallback2 = vi.fn(fn);
        const mockCallback3 = vi.fn(fn);
        const renderCounts = [0, 0, 0];
        let increment: (() => void) | undefined;
        let getCallbackResults: (() => [number, number, number]) | undefined;

        function TestComponent() {
          const [count, setCount] = useState(0);

          const callback1 = useAutoCallback(() => mockCallback1(count));
          const callback2 = useCallback(() => mockCallback2(count), []);
          const callback3 = useCallback(() => mockCallback3(count), [count]);

          useEffect(() => {
            renderCounts[0] += 1;
          }, [callback1]);

          useEffect(() => {
            renderCounts[1] += 1;
          }, [callback2]);

          useEffect(() => {
            renderCounts[2] += 1;
          }, [callback3]);

          increment = () => setCount(count + 1);
          getCallbackResults = () => [callback1(), callback2(), callback3()];

          return createElement(
            "div",
            null,
            createElement("button", { onClick: () => setCount(count + 1) }, "increment"),
          );
        }

        const container = document.createElement("div");
        setup(createElement(TestComponent), container);
        await flushMicrotasks();
        expect(renderCounts).toEqual([1, 1, 1]);

        increment!();
        await flushMicrotasks();

        expect(getCallbackResults!()).toEqual([2, 0, 2]);
        expect(renderCounts).toEqual([1, 1, 2]);

        increment!();
        await flushMicrotasks();
        expect(getCallbackResults!()).toEqual([4, 0, 4]);
        expect(renderCounts).toEqual([1, 1, 3]);
      });
    });
  });
});
