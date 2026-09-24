// Segmented toggle with a highlight that slides to the chosen option.
export default function Segmented({
  value,
  options,
  onChange,
  small = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  small?: boolean;
}) {
  const index = options.findIndex((option) => option.value === value);

  return (
    <div
      role="radiogroup"
      className="relative grid rounded-2xl border border-line bg-[#F9F8F2] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {index >= 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-xl bg-forest shadow-[0_6px_16px_rgba(33,79,67,0.25)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: `calc((100% - 0.5rem) / ${options.length})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
      )}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative rounded-xl font-semibold transition-colors duration-300 ${
              small ? "px-2 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
            } ${selected ? "text-white" : "text-slate hover:text-forest"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
