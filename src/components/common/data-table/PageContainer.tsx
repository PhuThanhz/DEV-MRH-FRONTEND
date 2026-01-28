import React from "react";
import Breadcrumb from "@/components/navigation/Breadcrumb";

interface PageContainerProps {
    title: string;
    filter?: React.ReactNode;
    extra?: React.ReactNode;
    children?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
    title,
    filter,
    children,
}) => {
    return (
        <div className="min-h-screen w-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 pt-2 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                    {title}
                </h1>
                <div className="mt-1 sm:mt-0">
                    <Breadcrumb />
                </div>
            </div>

            {filter && <div className="px-6 pb-4">{filter}</div>}

            {/* Main Content */}
            <div className="px-6 pb-8">{children}</div>
        </div>
    );
};

export default PageContainer;
