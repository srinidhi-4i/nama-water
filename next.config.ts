import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/Menu/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/Menu/:path*',
      },
      {
        source: '/BranchOfficer/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/BranchOfficer/:path*',
      },
      {
        source: '/PushNotification/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/PushNotification/:path*',
      },
      {
        source: '/WaterShutdown/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/WaterShutdown/:path*',
      },
      {
        source: '/Wetland/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/Wetland/:path*',
      },
      {
        source: '/Appointment/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/Appointment/:path*',
      },
      {
        source: '/Common/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/Common/:path*',
      },
      {
        source: '/CommonService/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/CommonService/:path*',
      }
    ];
  },
};

export default nextConfig;
