import { Mail, Youtube, Instagram, Twitter } from "lucide-react";

export function Footer() {
  const socialLinks = [
    {
      icon: Youtube,
      href: "#",
      label: "YouTube",
      color: "hover:text-red-600",
    },
    {
      icon: Instagram,
      href: "#",
      label: "Instagram",
      color: "hover:text-pink-600",
    },
    {
      icon: Twitter,
      href: "#",
      label: "Twitter",
      color: "hover:text-blue-600",
    },
    {
      icon: (props: any) => (
        <svg {...props} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      ),
      href: "#",
      label: "Twitch",
      color: "hover:text-purple-600",
    },
  ];

  return (
    <footer id="contato" className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-8">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={`text-gray-400 transition-colors ${social.color}`}
                aria-label={social.label}
              >
                <social.icon className="h-6 w-6" />
              </a>
            ))}
          </div>

          {/* Commercial Email */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-2">
              <Mail className="h-5 w-5" />
              <span>Contato Comercial:</span>
            </div>
            <a
              href="mailto:comercial@creator.com"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              comercial@creator.com
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Creator. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
