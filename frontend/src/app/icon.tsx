import { ImageResponse } from "next/og";

import logo from "@/assets/Logo.png";

export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt="WorkPulse"
          width={192}
          height={192}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    {
      width: 192,
      height: 192,
    },
  );
}
