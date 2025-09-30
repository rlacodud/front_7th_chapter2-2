# React 구현 가이드

## 목차
1. [함수 인터페이스](#1-함수-인터페이스)
2. [구현을 위한 수도코드](#2-구현을-위한-수도코드)
3. [구현 순서](#3-구현-순서)

## 1. 함수 인터페이스

### 1.1 Core 모듈 (`packages/react/src/core/`)

#### elements.ts
```typescript
// JSX를 VNode로 변환
export function createElement(
  type: string | symbol | React.ComponentType,
  props: Record<string, any> | null,
  ...children: any[]
): VNode

// Fragment 처리
export const Fragment: symbol
```

#### setup.ts
```typescript
// 루트 렌더링 함수 (실제 구현체에서 사용됨)
export function setup(node: VNode | null, container: HTMLElement): void
```

#### hooks.ts
```typescript
// 상태 관리 훅
export function useState<T>(
  initialValue: T | (() => T)
): [T, (newValue: T | ((prev: T) => T)) => void]

// 사이드 이펙트 훅
export function useEffect(
  effect: () => void | (() => void),
  deps?: unknown[]
): void
```

#### reconciler.ts
```typescript
// 가상 DOM 재조정
export function reconcile(
  container: HTMLElement,
  newNode: VNode | null,
  oldInstance: Instance | null
): Instance | null
```

#### render.ts
```typescript
// 렌더링 함수
export function render(node: VNode | null, container: HTMLElement): void
```

#### context.ts
```typescript
// 훅 컨텍스트 관리
export function createHooksContext(): HooksContext
export function getCurrentComponent(): ComponentPath | null
export function enterComponent(path: ComponentPath): void
export function exitComponent(): void
```

#### dom.ts
```typescript
// DOM 속성 설정 및 업데이트
export function setDomProps(dom: HTMLElement, props: Record<string, any>): void
export function updateDomProps(
  dom: HTMLElement,
  prevProps: Record<string, any>,
  nextProps: Record<string, any>
): void

// DOM 노드 관리
export function getDomNodes(instance: Instance | null): (HTMLElement | Text)[]
export function getFirstDom(instance: Instance | null): HTMLElement | Text | null
export function insertInstance(
  parentDom: HTMLElement,
  instance: Instance | null,
  anchor?: HTMLElement | Text | null
): void
export function removeInstance(parentDom: HTMLElement, instance: Instance | null): void
```

### 1.2 Hooks 모듈 (`packages/react/src/hooks/`)

#### useRef.ts
```typescript
export function useRef<T>(initialValue: T): { current: T }
```

#### useMemo.ts
```typescript
export function useMemo<T>(
  factory: () => T,
  deps: unknown[],
  equals?: (a: unknown[], b: unknown[]) => boolean
): T
```

#### useCallback.ts
```typescript
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: unknown[]
): T
```

#### useDeepMemo.ts
```typescript
export function useDeepMemo<T>(
  factory: () => T,
  deps: unknown[]
): T
```

#### useAutoCallback.ts
```typescript
export function useAutoCallback<T extends (...args: any[]) => any>(
  callback: T
): T
```

### 1.3 HOCs 모듈 (`packages/react/src/hocs/`)

#### memo.ts
```typescript
export function memo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P>
```

#### deepMemo.ts
```typescript
export function deepMemo<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P>
```

### 1.4 Utils 모듈 (`packages/react/src/utils/`)

#### equals.ts
```typescript
export function shallowEquals(a: unknown, b: unknown): boolean
export function deepEquals(a: unknown, b: unknown): boolean
```

#### enqueue.ts
```typescript
export function enqueue<T extends (...args: any[]) => any>(func: T): void
export function withEnqueue(): void
```

## 2. 구현을 위한 수도코드

### 2.1 Core 렌더링 플로우

```javascript
// setup 함수: 루트 렌더링 시작점
function setup(node, container) {
  // 1. 컨테이너 유효성 검사
  //    - 컨테이너가 없으면 에러 발생
  //    - 렌더링할 수 없는 상황을 미리 차단

  // 2. 기존 인스턴스 가져오기
  //    - 컨테이너에 이전에 렌더링된 내용이 있는지 확인
  //    - WeakMap이나 element property로 저장된 인스턴스 조회

  // 3. Reconciliation 수행
  //    - 새로운 VNode와 기존 Instance를 비교
  //    - 최소한의 DOM 변경으로 업데이트

  // 4. 컨테이너에 새 인스턴스 연결
  //    - 새로 생성된 인스턴스를 컨테이너와 연결
  //    - 다음 렌더링을 위해 참조 저장
}

// reconcile 함수: 가상 DOM 비교 및 실제 DOM 업데이트
function reconcile(container, newNode, oldInstance) {
  // 1. null 처리
  //    - 새 노드가 null이면 기존 인스턴스 제거
  //    - 언마운트 과정에서 cleanup 함수들 실행

  // 2. 타입이 다른 경우 완전 교체
  //    - div -> span 같은 타입 변경 시
  //    - 기존 DOM을 완전히 제거하고 새로 생성

  // 3. 새로 마운트
  //    - 기존 인스턴스가 없으면 새로 생성
  //    - 첫 렌더링이거나 타입 변경으로 인한 재생성

  // 4. 업데이트
  //    - 같은 타입이면 속성만 업데이트
  //    - 자식 노드들도 재귀적으로 reconcile
}

// mount 함수: 새로운 VNode를 DOM으로 생성
function mount(container, node) {
  // 1. 컴포넌트인지 확인
  //    - 함수 컴포넌트면 컴포넌트 마운트 로직 실행
  //    - 문자열이면 DOM 요소 생성

  // 2. DOM 요소 생성
  //    - createElement로 실제 DOM 노드 생성
  //    - Instance 객체로 VNode와 DOM 연결

  // 3. 속성 설정
  //    - props를 DOM 속성으로 변환
  //    - 이벤트 핸들러, className, style 등 처리

  // 4. 자식 처리
  //    - children 배열을 순회하며 재귀적으로 마운트
  //    - null, undefined, boolean 값들 필터링

  // 5. DOM에 추가
  //    - 생성된 DOM을 부모 컨테이너에 appendChild
  //    - Instance 객체 반환
}
```

### 2.2 Hooks 구현

```javascript
// useState 훅: 컴포넌트 상태 관리
function useState(initialValue) {
  // 1. 현재 컴포넌트 패스와 커서 가져오기
  //    - 컴포넌트별 고유 경로로 상태 격리
  //    - 훅 호출 순서를 커서로 추적

  // 2. 기존 상태 확인
  //    - 첫 렌더링이면 초기값으로 상태 생성
  //    - 함수형 초기값이면 lazy initialization 수행
  //    - Map<path, state[]> 구조로 상태 저장

  // 3. 현재 상태 가져오기
  //    - 현재 컴포넌트 패스와 커서로 상태 조회
  //    - 저장된 상태값 반환

  // 4. setter 함수 생성
  //    - 새 값이 함수면 이전 값을 인자로 호출
  //    - Object.is()로 값 비교하여 변경 감지
  //    - 값이 변경되면 재렌더링 스케줄링

  // 5. 커서 증가 및 반환
  //    - 다음 훅 호출을 위해 커서 증가
  //    - [현재상태, setter] 튜플 반환
}

// useEffect 훅: 사이드 이펙트 관리
function useEffect(effect, deps) {
  // 1. 현재 컴포넌트 정보 가져오기
  //    - 컴포넌트 패스와 현재 훅 커서 조회
  //    - 이펙트 훅 저장소에서 이전 정보 확인

  // 2. 의존성 배열 비교
  //    - 첫 렌더링이면 무조건 실행
  //    - deps가 없으면 매 렌더링마다 실행
  //    - deps가 있으면 shallowEquals로 비교

  // 3. 이펙트 실행 결정
  //    - 의존성이 변경되었거나 첫 렌더링이면 실행
  //    - 이전 cleanup 함수가 있으면 스케줄링

  // 4. 새 이펙트 스케줄링
  //    - 렌더링 완료 후 비동기로 실행
  //    - Promise.resolve().then() 또는 setTimeout 사용
  //    - 이펙트 실행 결과가 함수면 cleanup으로 저장

  // 5. 훅 정보 저장 및 커서 증가
  //    - 현재 이펙트와 의존성을 저장
  //    - 다음 렌더링 시 비교를 위해 보관
}
```

### 2.3 비교 함수

```javascript
// shallowEquals: 얕은 비교 함수
function shallowEquals(a, b) {
  // 1. 참조 동일성 검사 (Object.is 사용)
  //    - 같은 참조면 즉시 true 반환
  //    - NaN === NaN, +0 !== -0 등 특수 케이스 처리

  // 2. null/undefined 처리
  //    - 둘 중 하나라도 null이면 false
  //    - 기본 타입이면 참조 동일성으로 이미 판별됨

  // 3. 타입 검사
  //    - typeof 연산자로 타입 비교
  //    - 다른 타입이면 false 반환

  // 4. 객체/배열 1단계 깊이 비교
  //    - Object.keys()로 키 목록 추출
  //    - 키 개수가 다르면 false
  //    - 각 키의 값을 Object.is()로 비교
  //    - 중첩 객체는 참조만 비교 (얕은 비교)
}

// deepEquals: 깊은 비교 함수
function deepEquals(a, b) {
  // 1. 참조 동일성 검사
  //    - shallowEquals와 동일한 시작점
  //    - Object.is()로 기본 비교

  // 2. 타입 검사
  //    - 타입이 다르면 즉시 false
  //    - 객체가 아니면 참조 동일성으로 결정

  // 3. 재귀적 깊은 비교
  //    - 객체의 모든 키에 대해 재귀 호출
  //    - 배열도 동일한 방식으로 처리
  //    - 순환 참조 방지를 위한 WeakSet 사용 가능

  // 4. 특수 객체 처리
  //    - Date, RegExp 등의 특수 객체 고려
  //    - Array.isArray()로 배열 구분
  //    - null 체크로 안전성 확보
}
```

### 2.4 컴포넌트 마운트 및 업데이트

```javascript
// mountComponent: 함수 컴포넌트 마운트
function mountComponent(container, node) {
  // 1. 컴포넌트 패스 생성
  //    - 현재 렌더링 스택에서 고유한 패스 생성
  //    - "0.c0.i1.c2" 형식으로 컴포넌트 위치 추적
  //    - 부모-자식 관계와 형제 순서 포함

  // 2. 훅 컨텍스트 설정
  //    - 컴포넌트 스택에 현재 패스 추가
  //    - 훅 커서를 0으로 초기화
  //    - 기존 훅 상태가 있으면 복원

  // 3. 컴포넌트 함수 실행 (try-finally 보장)
  //    - node.type이 함수 컴포넌트
  //    - props를 인자로 전달하여 호출
  //    - 훅들이 올바른 순서로 호출되도록 보장

  // 4. 자식 VNode 마운트
  //    - 컴포넌트 실행 결과로 받은 VNode 처리
  //    - 재귀적으로 mount 함수 호출
  //    - DOM 요소나 다른 컴포넌트일 수 있음

  // 5. 컴포넌트 인스턴스 생성 및 정리
  //    - Instance 객체 생성 (컴포넌트 타입)
  //    - 자식 인스턴스와 패스 정보 저장
  //    - finally 블록에서 훅 컨텍스트 정리
}

// updateComponent: 함수 컴포넌트 업데이트
function updateComponent(instance, newNode) {
  // 1. 훅 컨텍스트 복원
  //    - 기존 인스턴스의 패스로 컨텍스트 복원
  //    - 이전 렌더링과 동일한 훅 순서 보장
  //    - 상태 및 이펙트 정보 복원

  // 2. 컴포넌트 함수 재실행
  //    - 새로운 props로 컴포넌트 함수 호출
  //    - 훅들이 기존 상태를 참조하여 실행
  //    - 의존성 변경에 따른 이펙트 스케줄링

  // 3. 자식 Reconciliation
  //    - 새로운 자식 VNode와 기존 자식 인스턴스 비교
  //    - 최적화된 업데이트로 DOM 변경 최소화
  //    - 타입이 다르면 언마운트 후 재마운트

  // 4. 인스턴스 정보 업데이트
  //    - 새로운 VNode 정보로 인스턴스 갱신
  //    - 자식 인스턴스 참조 업데이트
  //    - 컴포넌트 패스는 유지 (동일 위치)

  // 5. 정리 작업
  //    - finally 블록에서 훅 컨텍스트 정리
  //    - 다음 컴포넌트 렌더링을 위한 상태 복원
}
```

## 3. 구현 순서

테스트 진행 흐름과 맞물리도록 기본 과제 → 심화 과제로 나누어 구현하세요.

### ✅ 기본 과제 로드맵

#### Phase 1 · VNode와 기초 유틸리티
- `core/constants.ts`: `TEXT_ELEMENT`, `Fragment`, `NodeTypes`, `HookTypes`
- `core/elements.ts`: `createElement`, `normalizeNode`, `createChildPath`
- `utils/validators.ts`: `isEmptyValue`
- `utils/equals.ts`: `shallowEquals`, `deepEquals`

#### Phase 2 · 컨텍스트와 루트 초기화
- `core/types.ts`: VNode/Instance/Context 타입 선언
- `core/context.ts`: 루트/훅 컨텍스트와 경로 스택 관리
- `core/setup.ts`: 컨테이너 초기화, 컨텍스트 리셋, 루트 렌더 트리거
- `client/index.ts`: `createRoot().render()` API 노출

#### Phase 3 · DOM 인터페이스 구축
- `core/dom.ts`: 속성/스타일/이벤트 적용 규칙, DOM 노드 탐색/삽입/제거

#### Phase 4 · 렌더 스케줄링
- `utils/enqueue.ts`: `enqueue`, `withEnqueue`로 마이크로태스크 큐 구성
- `core/render.ts`: `render`, `enqueueRender`로 루트 렌더 사이클 구현

#### Phase 5 · Reconciliation
- `core/reconciler.ts`: 마운트/업데이트/언마운트, 자식 비교, key/anchor 처리
- `core/dom.ts`: Reconciliation에서 사용할 DOM 재배치 보조 함수 확인

#### Phase 6 · 기본 Hook 시스템
- `core/hooks.ts`: 훅 상태 저장, `useState`, `useEffect`, cleanup/queue 관리
- `core/context.ts`: 훅 커서 증가, 방문 경로 기록, 미사용 훅 정리

**기본 과제 완료 기준**: `basic.equals.test.tsx`, `basic.mini-react.test.tsx` 전부 통과

### 🚀 심화 과제 로드맵

#### Phase 7 · 확장 Hook & HOC
- `hooks/useRef.ts`: ref 객체 유지
- `hooks/useMemo.ts`, `hooks/useCallback.ts`: shallow 비교 기반 메모이제이션
- `hooks/useDeepMemo.ts`, `hooks/useAutoCallback.ts`: deep 비교/자동 콜백 헬퍼
- `hocs/memo.ts`, `hocs/deepMemo.ts`: props 비교 기반 컴포넌트 메모이제이션

**심화 과제 완료 기준**: `advanced.hooks.test.tsx`, `advanced.hoc.test.tsx` 전부 통과

## 4. 구현 체크리스트

### ✅ 기본 과제 체크리스트
- [ ] Phase 1 · VNode/유틸리티 (constants, elements, validators, equals)
- [ ] Phase 2 · 컨텍스트/루트 초기화 (types, context, setup, client)
- [ ] Phase 3 · DOM 인터페이스 (dom)
- [ ] Phase 4 · 렌더 스케줄링 (enqueue, render)
- [ ] Phase 5 · Reconciliation (reconciler, dom helpers)
- [ ] Phase 6 · 기본 Hook 시스템 (hooks, context cleanup)

### 🚀 심화 과제 체크리스트
- [ ] Phase 7 · 확장 Hook & HOC (hooks, hocs)

## 5. 테스트 실행 순서

1. **기본 과제 테스트**
   ```bash
   npm test basic.equals.test.tsx
   npm test basic.mini-react.test.tsx
   ```

2. **심화 과제 테스트**
   ```bash
   npm test advanced.hooks.test.tsx
   npm test advanced.hoc.test.tsx
   ```

3. **전체 테스트**
   ```bash
   npm test
   ```

각 Phase를 마칠 때마다 해당 테스트를 통과시키며 진행하면 전체 시스템이 자연스럽게 완성됩니다.
