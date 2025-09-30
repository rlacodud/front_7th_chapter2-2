# React 구현을 위한 기초 지식

## 목차
1. [VNode와 컴포넌트 모델](#1-vnode와-컴포넌트-모델)
2. [렌더 사이클과 루트 관리](#2-렌더-사이클과-루트-관리)
3. [리컨실리에이션과 자식 비교 전략](#3-리컨실리에이션과-자식-비교-전략)
4. [DOM 속성, 스타일, 이벤트](#4-dom-속성-스타일-이벤트)
5. [Hook 컨텍스트와 상태 관리](#5-hook-컨텍스트와-상태-관리)
6. [스케줄링과 이펙트 실행](#6-스케줄링과-이펙트-실행)
7. [재사용을 위한 유틸리티 패턴](#7-재사용을-위한-유틸리티-패턴)

## 1. VNode와 컴포넌트 모델
- **트리 자료구조 이해**: JSX는 중첩된 요소로 표현되므로, 노드를 트리 형태로 저장하고 순회하는 방식이 필요합니다. MiniReact는 JSX를 `VNode` 객체로 바꾼 뒤 재귀적으로 다룹니다.
- **키(Key)와 경로(Path)의 개념**: 리스트 렌더링에서 동일한 컴포넌트를 재사용하려면 자식의 `key`와 위치 기반 경로가 필수입니다. 키가 있는 자식은 문자열 키로, 키가 없는 자식은 인덱스·타입 정보를 이용해 식별합니다.
- **텍스트와 Fragment 처리**: 문자열, 숫자, 불린 등 원시 값이 DOM에서 어떻게 표현되는지 정리해야 합니다. 특히 boolean 값은 화면에 나타나지 않도록 걸러내는 규칙이 필요합니다.
- **컴포넌트 타입 분류**: DOM 태그, 함수형 컴포넌트, Fragment 등을 구분하여 이후 렌더링 루틴에서 다른 경로로 처리할 준비를 합니다.

**예제**
```ts
// JSX가 어떤 VNode 트리로 바뀌는지 따라가 보기
const vnode = createElement(
  "ul",
  null,
  createElement("li", { key: "a" }, "Todo A"),
  createElement("li", { key: "b" }, "Todo B"),
);
// key가 있는 자식은 경로가 0.ka처럼 key 기반 토큰으로 만들어진다.
```

## 2. 렌더 사이클과 루트 관리
- **루트 컨테이너 초기화**: 새로운 렌더링을 시작할 때 기존 DOM과 상태를 어떻게 초기화할지 결정해야 합니다. 컨테이너를 비우고 루트 노드와 연결된 인스턴스를 초기화하는 절차가 필요합니다.
- **렌더 함수를 한 번만 예약하기**: 여러 상태 업데이트가 동시에 발생해도 렌더를 한 번만 실행하도록 예약하는 큐가 필요합니다.
- **렌더링 단계**: (1) 루트 노드에서 리컨실리에이션 실행, (2) 필요하면 DOM 삽입, (3) 방문하지 않은 컴포넌트의 훅 상태 정리.
- **컨텍스트 리셋**: 렌더 시작 시 훅 컨텍스트(상태, 커서, 방문 기록)를 초기화해야 Hook 규칙을 지킬 수 있습니다.

**예제**
```ts
// 상태 업데이트가 여러 번 일어나도 render는 한 번만 호출되도록 예약
const render = () => console.log("render once");
const scheduleRender = withEnqueue(render);

scheduleRender();
scheduleRender();
// 콘솔에는 'render once'가 한 번만 출력된다.
```

## 3. 리컨실리에이션과 자식 비교 전략
- **노드 타입 판별**: 이전 인스턴스와 새로운 VNode의 `type`, `key`를 비교하여 계속 사용할지 판단하는 로직이 핵심입니다. 일치하면 업데이트, 다르면 교체합니다.
- **마운트 vs 업데이트**: 처음 등장한 노드는 DOM을 생성하고 자식을 순서대로 붙입니다. 기존 노드는 DOM 속성만 갱신하고 자식을 비교합니다.
- **자식 비교 알고리즘**:
  - 키 있는 자식: 맵(map)을 사용해 빠르게 찾고 재사용합니다.
  - 키 없는 자식: 타입과 위치가 유사한 후보를 찾아 재사용하며, 일치하지 않으면 새로 마운트합니다.
  - 역순 순회와 anchor: 뒤에서 앞으로 순회하면서 다음 삽입 위치(anchor)를 계산하면 브라우저 DOM 이동을 최소화할 수 있습니다.
- **Fragment/컴포넌트의 DOM 참조**: 실제 DOM 요소가 없는 노드라면 자식 중 첫 번째 DOM 노드를 찾아 부모가 사용할 수 있도록 유지해야 합니다.

**예제**
```ts
// 이전 자식 배열
const prev = ["A", "B", "C"].map((text) => createElement("li", { key: text }, text));
// 새 자식 배열 - B와 A 위치가 바뀌고 D가 추가됨
const next = ["B", "A", "C", "D"].map((text) => createElement("li", { key: text }, text));
// 키를 기준으로 하면 기존 DOM을 재활용하면서 최소 이동만 발생한다.
```

## 4. DOM 속성, 스타일, 이벤트
- **DOM 속성 구분**: `className`, `style`, 일반 속성, 이벤트 핸들러 등 각각 처리 방식이 다릅니다. 예를 들어 이벤트는 `addEventListener`로 연결하고, 일반 속성은 프로퍼티 혹은 attribute를 선택해야 합니다.
- **스타일 병합 규칙**: 객체 형태의 스타일을 비교하여 삭제된 속성은 비우고, 새로운 속성만 업데이트해야 합니다.
- **이벤트 정리**: 동일한 이벤트가 교체되면 이전 리스너를 제거하고 새 리스너를 붙여야 합니다. 이벤트 이름을 정규화(`onClick` → `click`)하는 과정이 포함됩니다.
- **텍스트 노드 비교**: 텍스트의 변경 여부는 문자열 비교로 확인하고, 다르면 `nodeValue`만 바꿉니다.

**예제**
```ts
const oldHandler = () => console.log("old click");
const newHandler = () => console.log("new click");
const button = document.createElement("button");

updateDomProps(button, { onClick: oldHandler, style: { color: "red" } }, {
  onClick: newHandler,
  style: { color: "blue", fontWeight: "bold" },
});
// -> click 리스너는 교체되고, color는 파란색으로 변경, fontWeight 추가, red는 제거됨
```

## 5. Hook 컨텍스트와 상태 관리
- **훅 호출 순서 유지**: 함수형 컴포넌트마다 고유 경로와 훅 인덱스를 기억하여 렌더 간 동일 순서로 호출되어야 합니다. 순서가 달라지면 예외가 발생해야 합니다.
- **상태 저장소 구조**: `Map<경로, Hook[]>` 형태로 상태를 보관하고, 렌더 중에는 커서를 증가시키며 현재 훅을 찾습니다.
- **useState 동작 이해**: 초기값 평가, 상태 비교(Object.is), 업데이트 시 재렌더 예약까지의 흐름을 알아야 합니다.
- **useEffect 의존성 비교**: 의존성 배열은 얕은 비교(shallow equality)로 검사하고, 변경 시 이펙트를 큐에 넣습니다. 클린업 함수는 다음 effect 실행 전에 호출됩니다.
- **추가 Hook의 기반 지식**: `useRef`, `useMemo`, `useCallback` 등은 내부적으로 `useState`/`useEffect`를 활용해 참조 값을 유지하거나 메모이제이션을 수행합니다.

**예제**
```ts
function Counter() {
  const [count, setCount] = useState(0); // 커서 0
  const ref = useRef(null);             // 커서 1
  useEffect(() => {
    ref.current = count;
  }, [count]);                          // 커서 2
  return createElement("span", null, count);
}
// 훅 순서가 바뀌면 저장된 커서와 상태 배열이 맞지 않아 오류가 난다.
```

## 6. 스케줄링과 이펙트 실행
- **마이크로태스크 큐 개념**: `queueMicrotask` 또는 `Promise.resolve().then`을 사용하면 브라우저 렌더 전에 작업을 한 번 더 예약할 수 있습니다. MiniReact는 이를 이용해 렌더와 이펙트를 배치 처리합니다.
- **렌더 큐 vs 이펙트 큐**: 상태 업데이트는 렌더 큐에, `useEffect`는 별도의 이펙트 큐에 쌓입니다. 각각의 큐는 한 번에 하나씩 실행되도록 플래그를 사용합니다.
- **FIFO 실행 보장**: 큐에서 꺼낼 때 등록 순서를 지키면 effect가 선언된 순서대로 실행됩니다.
- **클린업 타이밍**: effect가 다시 실행될 때 기존 클린업을 먼저 호출하여 리소스를 정리하고, 컴포넌트가 언마운트되면 남은 effect들도 정리합니다.

**예제**
```ts
const queue: Array<{ run: () => void }> = [
  { run: () => console.log("effect 1") },
  { run: () => console.log("effect 2") },
];

const flushEffects = withEnqueue(() => {
  while (queue.length) {
    queue.shift()?.run();
  }
});

flushEffects();
flushEffects();
// effect 1, effect 2가 각각 한 번만 실행된다.
```

## 7. 재사용을 위한 유틸리티 패턴
- **동등성 비교 함수**: 얕은 비교(shallow)와 깊은 비교(deep)의 차이를 알고, 배열·객체 비교 로직을 재사용하면 Hook과 HOC 구현이 쉬워집니다.
- **함수 스케줄러**: 동일한 작업이 중복 예약되지 않도록 함수에 플래그를 두는 패턴은 렌더와 effect 모두에 사용됩니다.
- **Validator와 필터**: 불필요한 값(`null`, `undefined`, `boolean`)을 early stage에서 제거하면 이후 단계가 단순해집니다.
- **클라이언트 API 단순화**: 최종적으로 외부에는 `createRoot(container).render(node)`처럼 간결한 진입점을 제공해, 내부 구현을 감추고 학습 비용을 낮춥니다.

**예제**
```ts
// shallowEquals를 직접 실험해 보기
shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 }); // true
shallowEquals({ a: 1 }, { a: 1, b: 3 });       // false
// memo(Component, shallowEquals)을 구성할 때 어떤 props에서 리렌더가 막히는지 알 수 있다.
```

## 결론
MiniReact를 스스로 구현하려면 위 지식이 서로 어떻게 맞물리는지 이해해야 합니다. VNode 트리와 경로 규칙으로 컴포넌트를 식별하고, 렌더 사이클과 리컨실리에이션으로 DOM을 최소한으로 갱신하며, Hook 컨텍스트와 스케줄링을 통해 상태·이펙트를 안정적으로 관리합니다. 이 기반 위에서 equality 유틸리티, HOC, 추가 Hook 같은 확장 기능을 자연스럽게 구축할 수 있습니다.
