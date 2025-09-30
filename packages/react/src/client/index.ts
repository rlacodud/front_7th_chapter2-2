import { setup, type VNode } from "../core";

export const createRoot = (rootElement: HTMLElement) => {
  return {
    render: (root: VNode) => setup(root, rootElement),
  };
};
