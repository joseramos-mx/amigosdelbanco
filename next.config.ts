import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: hosts that may load the Next dev server. Add your LAN IP here
  // when testing from phone/tablet. No scheme, no port.
  allowedDevOrigins: ["172.20.10.2", "192.168.68.52"],
};

export default nextConfig;
