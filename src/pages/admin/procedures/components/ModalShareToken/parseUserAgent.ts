/**
 * parseUserAgent.ts
 * Dùng để: parse User Agent string → tên browser, OS, loại thiết bị
 * Dùng trong: ExpandedRow.tsx (hiển thị lịch sử truy cập)
 */

import { MobileOutlined, LaptopOutlined, TabletOutlined } from "@ant-design/icons";
import React from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ParsedUA {
    browser: string;
    os: string;
    deviceType: DeviceType;
}

export function parseUserAgentDetail(ua: string): ParsedUA {
    if (!ua) return { browser: "Không rõ", os: "Không rõ", deviceType: "desktop" };

    let os = "Không rõ";
    let deviceType: DeviceType = "desktop";

    if (/iPad/.test(ua)) {
        os = "iPadOS"; deviceType = "tablet";
    } else if (/iPhone/.test(ua)) {
        os = "iOS"; deviceType = "mobile";
    } else if (/Android/.test(ua)) {
        deviceType = /Mobile/.test(ua) ? "mobile" : "tablet";
        const m = ua.match(/Android\s([\d.]+)/);
        os = `Android ${m?.[1] ?? ""}`.trim();
    } else if (/Windows NT/.test(ua)) {
        const versions: Record<string, string> = {
            "10.0": "10/11", "6.3": "8.1", "6.2": "8",
            "6.1": "7", "6.0": "Vista", "5.1": "XP",
        };
        const m = ua.match(/Windows NT ([\d.]+)/);
        const ver = versions[m?.[1] ?? ""] ?? "";
        os = ver ? `Windows ${ver}` : "Windows";
        deviceType = "desktop";
    } else if (/Mac OS X/.test(ua)) {
        const m = ua.match(/Mac OS X ([\d_]+)/);
        const ver = m?.[1]?.replace(/_/g, ".") ?? "";
        os = ver ? `macOS ${ver}` : "macOS";
        deviceType = "desktop";
    } else if (/CrOS/.test(ua)) {
        os = "ChromeOS"; deviceType = "desktop";
    } else if (/Linux/.test(ua)) {
        os = "Linux"; deviceType = "desktop";
    }

    let browser = "Trình duyệt khác";

    if (/EdgA?\//.test(ua)) {
        const m = ua.match(/Edg(?:A)?\/\s*([\d.]+)/);
        browser = `Edge ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/OPR\//.test(ua) || /Opera\//.test(ua)) {
        const m = ua.match(/OPR\/([\d.]+)/);
        browser = `Opera ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/FxiOS\//.test(ua)) {
        const m = ua.match(/FxiOS\/([\d.]+)/);
        browser = `Firefox ${m?.[1]?.split(".")[0] ?? ""} (iOS)`;
    } else if (/Firefox\//.test(ua)) {
        const m = ua.match(/Firefox\/([\d.]+)/);
        browser = `Firefox ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/CriOS\//.test(ua)) {
        const m = ua.match(/CriOS\/([\d.]+)/);
        browser = `Chrome ${m?.[1]?.split(".")[0] ?? ""} (iOS)`;
    } else if (/SamsungBrowser\//.test(ua)) {
        const m = ua.match(/SamsungBrowser\/([\d.]+)/);
        browser = `Samsung Browser ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
        const m = ua.match(/Chrome\/([\d.]+)/);
        browser = `Chrome ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Chromium\//.test(ua)) {
        const m = ua.match(/Chromium\/([\d.]+)/);
        browser = `Chromium ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Version\/[\d.]+ .*Safari/.test(ua)) {
        const m = ua.match(/Version\/([\d.]+)/);
        browser = `Safari ${m?.[1]?.split(".")[0] ?? ""}`;
    }

    return { browser, os, deviceType };
}

export function parseUserAgent(ua: string): string {
    if (!ua) return "Không rõ";
    const { browser, os } = parseUserAgentDetail(ua);
    return os && os !== "Không rõ" ? `${browser} · ${os}` : browser;
}

export function getDeviceIcon(ua: string): React.ReactElement {
    if (!ua) return React.createElement(LaptopOutlined, { style: { color: "#6b7280", fontSize: 12 } });
    const { deviceType } = parseUserAgentDetail(ua);
    if (deviceType === "mobile") return React.createElement(MobileOutlined, { style: { color: "#6b7280", fontSize: 12 } });
    if (deviceType === "tablet") return React.createElement(TabletOutlined, { style: { color: "#6b7280", fontSize: 12 } });
    return React.createElement(LaptopOutlined, { style: { color: "#6b7280", fontSize: 12 } });
}

export function parseIp(ip: string): string {
    if (!ip) return "—";
    if (ip === "0:0:0:0:0:0:0:1" || ip === "::1" || ip === "127.0.0.1") return "localhost";
    if (ip.includes(":") && ip.length > 20) return ip.slice(0, 20) + "…";
    return ip;
}