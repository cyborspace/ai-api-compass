export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#ff3b30] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm text-[#636366]">加载中...</p>
    </div>
  );
}
