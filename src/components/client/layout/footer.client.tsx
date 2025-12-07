import { FaTools } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-[#1b1f24] text-gray-300 py-5 border-t border-gray-700">
            <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white text-lg font-semibold">
                    <FaTools className="text-blue-400 text-xl" />
                    <span>Lotus Group Maintenance Tool</span>
                </div>

                <p className="text-sm text-gray-400 text-center sm:text-right">
                    © {new Date().getFullYear()} Lotus Group. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
