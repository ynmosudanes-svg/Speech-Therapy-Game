import React from 'react';

const Footer = () => {
  const footerText = '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629 \u00a9 \u0645\u0631\u0643\u0632 \u0627\u0644\u062a\u0623\u0647\u064a\u0644 \u0648\u0627\u0644\u062a\u062e\u0627\u0637\u0628';

  return (
    <footer className="relative z-20 w-full border-t border-slate-300 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm font-bold text-slate-600">
        {footerText}
      </div>
    </footer>
  );
};

export default Footer;
