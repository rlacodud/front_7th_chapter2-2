/* eslint-disable @typescript-eslint/no-explicit-any */
/** @jsx createElement */
/** @jsxFrag Fragment */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, Fragment, setup, useState } from "../core";
import { memo, deepMemo } from "../hocs";

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  const container = document.createElement("div");
  setup(createElement(Fragment, null), container);
});

describe("Chapter 2-2 심화과제: hoc 만들어보기", () => {
  describe("직접 만든 memo > ", () => {
    const TestComponent = vi.fn(({ value, ...props }) => {
      return (
        <div data-testid="test-component" {...props}>
          {JSON.stringify(value)}
        </div>
      );
    });

    beforeEach(() => {
      TestComponent.mockClear();
    });

    it("props로 전달하는 값이 변경되어야 리렌더링 된다.", async () => {
      const MemoizedComponent = memo(TestComponent);
      let rerender: ({ value }: { value: number }) => void;

      function TestWrapper() {
        const [props, setProps] = useState({ value: 1 });
        rerender = setProps;
        return <MemoizedComponent {...props} />;
      }

      const container = document.createElement("div");
      setup(<TestWrapper />, container);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 동일한 값으로 setState - 메모이제이션으로 호출되지 않아야 함
      rerender!({ value: 1 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 다른 값으로 setState - 새로 호출되어야 함
      rerender!({ value: 2 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);

      // 동일한 값으로 다시 setState - 메모이제이션으로 호출되지 않아야 함
      rerender!({ value: 2 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);
    });
  });

  describe("deepMemo HOC", () => {
    const TestComponent = vi.fn(({ value, ...props }) => {
      return createElement("div", { "data-testid": "test-component", ...props }, JSON.stringify(value));
    });

    beforeEach(() => {
      TestComponent.mockClear();
    });

    it("props로 전달하는 값이 모두 변경되어야 리렌더링 된다.", async () => {
      const DeepMemoizedComponent = deepMemo(TestComponent);
      let setProps: ((props: any) => void) | undefined;

      function TestWrapper() {
        const [props, setPropsState] = useState({ value: 1 });
        setProps = setPropsState;
        return createElement(DeepMemoizedComponent, props);
      }

      const container = document.createElement("div");
      setup(createElement(TestWrapper), container);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 동일한 props로 setState - 메모이제이션으로 호출되지 않아야 함
      setProps!({ value: 1 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 다른 value로 setState - 새로 호출되어야 함
      setProps!({ value: 2 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);

      // 동일한 value로 다시 setState - 메모이제이션으로 호출되지 않아야 함
      setProps!({ value: 2 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);

      const DEFAULT_STYLE = { color: "#09F" };
      // 새로운 style prop 추가 - 새로 호출되어야 함
      setProps!({ value: 2, style: DEFAULT_STYLE });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(3);

      // 동일한 내용의 새로운 객체 - deepMemo이므로 호출되지 않아야 함
      setProps!({ value: 2, style: { color: "#09F" } });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(3);

      // props 순서가 다르지만 동일한 내용 - deepMemo이므로 호출되지 않아야 함
      setProps!({ style: { color: "#09F" }, value: 2 });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(3);
    });

    it("깊은 객체 비교를 수행해야 한다", async () => {
      const DeepMemoizedComponent = deepMemo(TestComponent);
      let setValue: ((value: any) => void) | undefined;

      function TestWrapper() {
        const [value, setValueState] = useState({ a: { b: 1 } });
        setValue = setValueState;
        return createElement(DeepMemoizedComponent, { value });
      }

      const container = document.createElement("div");
      setup(createElement(TestWrapper), container);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 동일한 구조의 새로운 객체 - deepMemo이므로 호출되지 않아야 함
      setValue!({ a: { b: 1 } });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 다른 값의 객체 - 새로 호출되어야 함
      setValue!({ a: { b: 2 } });
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);
    });

    it("깊은 배열 비교를 수행해야 한다", async () => {
      const DeepMemoizedComponent = deepMemo(TestComponent);
      let setValue: ((value: any) => void) | undefined;

      function TestWrapper() {
        const [value, setValueState] = useState([1, [2, 3]]);
        setValue = setValueState;
        return createElement(DeepMemoizedComponent, { value });
      }

      const container = document.createElement("div");
      setup(createElement(TestWrapper), container);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 동일한 구조의 새로운 배열 - deepMemo이므로 호출되지 않아야 함
      setValue!([1, [2, 3]]);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(1);

      // 다른 값의 배열 - 새로 호출되어야 함
      setValue!([1, [2, 4]]);
      await flushMicrotasks();
      expect(TestComponent).toHaveBeenCalledTimes(2);
    });
  });
});
