function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-center sm:flex-row sm:text-left">
        
        <p className="text-sm text-slate-500">
          © 2026 WardWatch • Civic Grievance Desk
        </p>

        <div className="flex gap-5 text-sm text-slate-500">
          <button className="hover:text-indigo-600">
            Privacy Policy
          </button>

          <button className="hover:text-indigo-600">
            Terms
          </button>

          <button className="hover:text-indigo-600">
            Contact
          </button>
        </div>

      </div>
    </footer>
  );
}

export default Footer;