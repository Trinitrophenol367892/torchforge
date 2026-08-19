export default function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 ambient-base" />
      <div className="absolute inset-0 ambient-grid" />
      <div className="absolute inset-0 scanbeam" style={{ height: "22vh" }} />
      <div className="absolute inset-0 ambient-noise" />
      <div
        className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full opacity-[0.13]"
        style={{ background: "radial-gradient(circle, #2fbfae 0%, transparent 65%)" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full opacity-[0.1]"
        style={{ background: "radial-gradient(circle, #ff8a3d 0%, transparent 65%)" }}
      />
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 180px rgba(4,8,16,0.85)" }} />
    </div>
  );
}
