import { Link } from "react-router-dom";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

const Breadcrumb = () => {
    const items = useBreadcrumb();

    return (
        <nav className="text-sm text-gray-600 mb-4" aria-label="breadcrumb">
            <ol className="flex items-center flex-wrap space-x-1 sm:space-x-2">
                {items.map((item, index) => (
                    <li key={item.path} className="flex items-center">
                        {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                        {item.isLast ? (
                            <span className="text-gray-800 font-semibold">{item.label}</span>
                        ) : (
                            <Link to={item.path} className="hover:text-blue-600 font-medium">
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
