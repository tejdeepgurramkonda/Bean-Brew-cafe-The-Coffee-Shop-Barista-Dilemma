export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="flex flex-col items-center gap-5">
        <div className="text-6xl animate-bounce">☕</div>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-white/95 backdrop-blur-sm px-8 py-5 text-base font-bold text-amber-900 shadow-lg">
          <span className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-amber-700 to-orange-800 shadow-lg"></span>
          Checking session...
        </div>
      </div>
    </div>
  )
}
