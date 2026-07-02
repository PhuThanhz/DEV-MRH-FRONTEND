import React from "react";

interface PageContainerProps {
    title: string;
    filter?: React.ReactNode;
    extra?: React.ReactNode;
    children?: React.ReactNode;
    fullHeight?: boolean;
    contentClassName?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, filter, children, fullHeight = false, contentClassName }) => {
    return (
        <div className={fullHeight ? "flex flex-col h-full w-full bg-[#f8f9fa]" : "min-h-screen w-full bg-[#f8f9fa]"}>
            {/* Header */}
            {title && (
                <div className="bg-[#f8f9fa] border-b border-gray-200/60 px-4 sm:px-8 py-4">
                    <div className="flex items-center gap-3">
                        {/* Pink accent indicator */}
                        <div className="h-6 w-[4px] bg-gradient-to-b from-pink-400 to-pink-600 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.3)]" />
                        
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                            {title}
                        </h1>
                    </div>
                </div>
            )}

            {/* Filter */}
            {filter && (
                <div className="px-4 sm:px-8 pt-4 pb-2">
                    {filter}
                </div>
            )}

            {/* Content */}
            <div className={contentClassName ?? (fullHeight ? "px-4 sm:px-8 py-2 flex-1 min-h-0" : "px-4 sm:px-8 py-5")}>
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
