import { useEffect, useRef, useState } from "react";

interface TimePickerWheelProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

export function TimePickerWheel({ value, max, onChange, label }: TimePickerWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // 항목 높이
  const itemHeight = 40;
  
  // 숫자 배열 생성 (0 ~ max)
  const numbers = Array.from({ length: max + 1 }, (_, i) => i);

  // 초기 스크롤 위치 설정
  useEffect(() => {
    if (containerRef.current) {
      const scrollPosition = value * itemHeight;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [value]);

  const handleScroll = () => {
    if (containerRef.current && !isDragging) {
      const scrollPosition = containerRef.current.scrollTop;
      const selectedIndex = Math.round(scrollPosition / itemHeight);
      if (selectedIndex !== value) {
        onChange(selectedIndex);
      }
    }
  };

  const handleScrollEnd = () => {
    if (containerRef.current) {
      const scrollPosition = containerRef.current.scrollTop;
      const selectedIndex = Math.round(scrollPosition / itemHeight);
      containerRef.current.scrollTop = selectedIndex * itemHeight;
      onChange(selectedIndex);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    handleScrollEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    handleScrollEnd();
  };

  const handleWheelClick = () => {
    setIsInputMode(true);
    setInputValue(String(value).padStart(2, '0'));
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    
    // 유효성 검사: 범위를 벗어나거나 숫자가 아니면 00으로 설정
    if (isNaN(numValue) || numValue < 0 || numValue > max) {
      onChange(0);
      setInputValue("00");
    } else {
      onChange(numValue);
      setInputValue(String(numValue).padStart(2, '0'));
    }
    
    setIsInputMode(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleNumberClick = (num: number) => {
    if (num === value) {
      // 현재 선택된 값을 클릭하면 입력 모드로 전환
      handleWheelClick();
    } else {
      // 다른 값을 클릭하면 바로 그 값으로 변경
      onChange(num);
      // 스크롤 위치도 조정
      if (containerRef.current) {
        containerRef.current.scrollTop = num * itemHeight;
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-[120px] overflow-hidden">
        {/* 선택 영역 표시 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[40px] border-t border-b border-green-500/30 bg-green-50/30" />
        </div>

        {/* 입력 모드 */}
        {isInputMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 z-10">
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-16 h-12 text-center text-2xl font-bold text-gray-900 border-2 border-green-500 rounded-lg focus:outline-none"
              min={0}
              max={max}
            />
          </div>
        )}

        {/* 직접 입력 트리거 영역 */}
        <button
          onClick={handleWheelClick}
          className="absolute inset-0 flex items-center justify-center z-5 opacity-0 hover:opacity-0 active:opacity-0"
          style={{ top: '40px', height: '40px' }}
        />

        {/* 스크롤 컨테이너 */}
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* 상단 패딩 */}
          <div style={{ height: `${itemHeight}px` }} />
          
          {/* 숫자 항목들 */}
          {numbers.map((num) => (
            <div
              key={num}
              onClick={num === value ? handleWheelClick : () => handleNumberClick(num)}
              className="flex items-center justify-center font-medium text-gray-900 transition-all cursor-pointer"
              style={{
                height: `${itemHeight}px`,
                opacity: num === value ? 1 : 0.3,
                fontSize: num === value ? '20px' : '16px',
              }}
            >
              {String(num).padStart(2, '0')}
            </div>
          ))}
          
          {/* 하단 패딩 */}
          <div style={{ height: `${itemHeight}px` }} />
        </div>
      </div>
      
      {/* 레이블 */}
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}