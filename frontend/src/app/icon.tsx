import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const logoPath = path.join(process.cwd(), "src", "assets", "Logo.png");
const logoData = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
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
          src={logoBase64}
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
