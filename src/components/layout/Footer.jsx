export function Footer() {
  return (
    <footer className="border-t border-slate-200 mt-20 py-10 text-sm text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} Sleep Banaza. All rights reserved.</p>
        <div className="flex gap-6">
          <span>Shipping</span>
          <span>Returns</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
}
