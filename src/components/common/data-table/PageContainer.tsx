import React from "react";

interface PageContainerProps {
    title: string;
    filter?: React.ReactNode;
    extra?: React.ReactNode;
    children?: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, filter, children }) => {
    return (
        <div className="min-h-screen w-full bg-gray-50">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-3 sm:px-6 pt-2 pb-2">
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">
                    {title}
                </h1>
            </div>

            {/* Filter */}
            {filter && (
                <div className="px-2 sm:px-6 pt-3 pb-2">
                    {filter}
                </div>
            )}

            {/* Content */}
            <div className="px-1 sm:px-6 pb-6">
                {children}
            </div>
        </div>
    );
};

export default PageContainer;