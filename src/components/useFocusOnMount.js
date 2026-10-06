import { useEffect, useRef } from 'react';

// 화면이 바뀌면 제목으로 포커스를 옮겨 스크린리더와 키보드 사용자가 새 화면을 바로 인지하게 한다.
export default function useFocusOnMount() {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    window.scrollTo(0, 0);
  }, []);
  return ref;
}
