import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
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
      },
      {
        source: '/AccountDetails/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/AccountDetails/:path*',
      },
      {
        source: '/Account/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/Account/:path*',
      },
      {
        source: '/MyRequest/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/MyRequest/:path*',
      },
      {
        source: '/WaterLeakAlarm/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/WaterLeakAlarm/:path*',
      },
      {
        source: '/PrePaid/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/PrePaid/:path*',
      },
      {
        source: '/UserActionWeb/:path*',
        destination: 'https://eservicesuat.nws.nama.om:444/api/UserActionWeb/:path*',
      }
    ];
  },
};

export default nextConfig;
