/** 서비스 이름. '픽' 아래 형광펜은 '답을 고른다(pick)'와 '근거 문장 표시'에서 가져온 상징입니다. */
export function Wordmark({ size = "md", withLatin = false }: { size?: "sm" | "md" | "lg"; withLatin?: boolean }) {
  const text = { sm: "text-[19px]", md: "text-[22px]", lg: "text-[30px]" }[size];
  return (
    <span className={`inline-flex items-baseline gap-2 font-serif font-bold leading-none tracking-tight text-ink ${text}`}>
      <span>
        클래스
        <span className="relative inline-block">
          <span className="relative z-10">픽</span>
          <span aria-hidden className="absolute right-[0.08em] -bottom-0.5 left-0 h-[0.32em] bg-highlight" />
        </span>
      </span>
      {withLatin && <span className="font-sans text-[0.45em] font-semibold tracking-normal text-ink-3">Class Pick</span>}
    </span>
  );
}
