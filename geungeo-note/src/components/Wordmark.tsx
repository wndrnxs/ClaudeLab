/** 서비스 이름. 형광펜 밑줄은 '근거 문장 표시'에서 가져온 상징입니다. */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = { sm: "text-[19px]", md: "text-[22px]", lg: "text-[30px]" }[size];
  return (
    <span className={`relative inline-block font-serif font-bold leading-none tracking-tight text-ink ${text}`}>
      <span className="relative z-10">근거노트</span>
      <span aria-hidden className="absolute -bottom-0.5 left-0 h-[0.32em] w-[2.15em] bg-highlight" />
    </span>
  );
}
