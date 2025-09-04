import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaInstagram, FaUser, FaEnvelope } from "react-icons/fa";
import { gsap } from "gsap";

const socialLinks = [
  {
    name: "GitHub",
    icon: <FaGithub />, 
    url: "https://github.com/RishabhTomar9",
  },
  {
    name: "LinkedIn",
    icon: <FaLinkedin />, 
    url: "https://linkedin.com/in/rishabhtomar99",
  },
//   {
//     name: "Instagram",
//     icon: <FaInstagram />, 
//     url: "https://instagram.com/your-instagram",
//   },
  {
    name: "Portfolio",
    icon: <FaUser />, 
    url: "https://portfolio-nxt8349.web.app/",
  },
  {
    name: "Email",
    icon: <FaEnvelope />, 
    url: "mailto:rishabhtomar9999@gmail.com",
  },
];

export default function Footer() {
  const footerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      footerRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-white text-gray-800 py-5 rounded-t-[50%] shadow-inner border-t-15 border-black/50"
    >
      <div className="flex flex-col items-center space-y-5">
        {/* Developer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-1"
        >
          <h2 className="text-md font-bold tracking-wide">Developed By</h2>
          <p className="text-lg font-bold italic">Rishabh Tomar</p>
          {/* <p className="text-sm">rishabhtomar9999@gmail.com</p> */}
        </motion.div>

        {/* Dynamic Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <div className="flex flex-wrap justify-center gap-8 text-lg">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white bg-black p-2 rounded-full"
                >
                  {link.icon}
                </a>
                <p className="text-sm">{link.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
